#!/usr/bin/env node
/**
 * 推文抓取脚本
 *
 * 使用方式:
 *   node scripts/fetch-tweets.mjs
 *
 * 此脚本从 Nitter 实例抓取推文并保存到 data/tweets.json
 * 可在本地运行或通过 GitHub Actions 定时执行
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const TWEETS_FILE = path.join(DATA_DIR, 'tweets.json');
const FOLLOWERS_JSON_FILE = path.join(DATA_DIR, 'followers.json');
const FOLLOWERS_TXT_FILE = path.join(DATA_DIR, 'followers.txt');

// Nitter 实例列表
const NITTER_INSTANCES = [
  'nitter.privacyredirect.com',
  'xcancel.com',
  'nitter.poast.org',
];

/**
 * 从文本文件读取关注者列表（优先）
 * 格式支持：
 * - 简单格式: username
 * - 完整格式: username,displayName,group
 * - 注释行以 # 开头
 * - 空行会被忽略
 */
function loadFollowersFromText() {
  if (!fs.existsSync(FOLLOWERS_TXT_FILE)) {
    return null;
  }

  try {
    const content = fs.readFileSync(FOLLOWERS_TXT_FILE, 'utf-8');
    const lines = content.split('\n');
    const followers = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 跳过空行和注释
      if (!line || line.startsWith('#')) {
        continue;
      }

    // 解析行：支持 username 或 username,group
    // displayName 会从推文数据中自动获取，不需要在配置中指定
    const parts = line.split(',').map(p => p.trim());
    const username = parts[0];

    if (!username) {
      continue;
    }

    const follower = {
      username: username,
    };

    // 可选字段：分组（第二个参数是 group，不再是 displayName）
    if (parts[1]) {
      follower.group = parts[1];
    }

      followers.push(follower);
    }

    return followers.length > 0 ? followers : null;
  } catch (error) {
    console.error(`Error reading ${FOLLOWERS_TXT_FILE}:`, error.message);
    return null;
  }
}

/**
 * 从 JSON 文件读取关注者列表（向后兼容）
 */
function loadFollowersFromJson() {
  if (!fs.existsSync(FOLLOWERS_JSON_FILE)) {
    return null;
  }

  try {
    const data = JSON.parse(fs.readFileSync(FOLLOWERS_JSON_FILE, 'utf-8'));
    if (!data.followers || !Array.isArray(data.followers)) {
      return null;
    }

    // 验证每个关注者对象
    for (const follower of data.followers) {
      if (!follower.username) {
        throw new Error('Invalid follower: missing "username"');
      }
    }

    return data.followers;
  } catch (error) {
    console.error(`Error reading ${FOLLOWERS_JSON_FILE}:`, error.message);
    return null;
  }
}

/**
 * 加载关注者列表（优先使用文本格式）
 */
function loadFollowers() {
  // 优先使用文本格式
  let followers = loadFollowersFromText();

  // 如果文本格式不存在，尝试 JSON 格式（向后兼容）
  if (!followers) {
    followers = loadFollowersFromJson();
  }

  // 如果都不存在，报错
  if (!followers || followers.length === 0) {
    console.error('Error: No followers found!');
    console.error(`Please create ${FOLLOWERS_TXT_FILE} with the following format:`);
    console.error('');
    console.error('# 每行一个用户名');
    console.error('elonmusk,Elon Musk,Tech');
    console.error('jack,Jack Dorsey,Tech');
    console.error('# 或者简单格式');
    console.error('naval');
    console.error('VitalikButerin');
    process.exit(1);
  }

  return followers;
}

// 加载关注者列表
const FOLLOWERS = loadFollowers();

const FETCH_TIMEOUT = 30;
// 每个用户最多抓取的页数（每页约 20-30 条推文）
const MAX_PAGES_PER_USER = 5;

/**
 * 使用 curl 获取页面（绕过 bot 检测）
 */
async function fetchWithCurl(url, timeout = FETCH_TIMEOUT) {
  try {
    const { stdout } = await execAsync(
      `curl -sL --connect-timeout ${timeout} --max-time ${timeout * 2} "${url}"`,
      { maxBuffer: 10 * 1024 * 1024 }
    );
    return { ok: true, text: () => Promise.resolve(stdout) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * 解码 Nitter 图片 URL
 * Nitter 格式: /pic/https%3A%2F%2Fpbs.twimg.com%2F... 或 /pic/pbs.twimg.com%2F...
 */
/**
 * 将 Nitter 的相对 URL 转换为完整的代理 URL
 */
function decodeNitterUrl(url, instance) {
  if (!url || !url.startsWith('/pic/')) {
    return url;
  }

  // 保留 Nitter 代理 URL，因为 Twitter 图片需要通过代理访问
  // 使用提供的实例域名
  return `https://${instance}${url}`;
}

/**
 * 从 HTML 中提取文本内容
 */
function extractText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * 解析推文时间
 */
function parseTime(timeStr) {
  // 格式: "Dec 7, 2025 · 5:13 AM UTC"
  const match = timeStr.match(/(\w+ \d+, \d+)\s*·\s*(\d+:\d+ [AP]M)/);
  if (match) {
    const dateStr = `${match[1]} ${match[2]}`;
    return new Date(dateStr + ' UTC');
  }
  const parsed = new Date(timeStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  return new Date();
}

/**
 * 从数字字符串中提取数字
 */
function parseNumber(str) {
  const cleaned = str.replace(/,/g, '').trim();
  const match = cleaned.match(/([\d.]+)\s*([KMB])?/i);
  if (!match) return 0;

  let num = parseFloat(match[1]);
  const suffix = match[2]?.toUpperCase();

  if (suffix === 'K') num *= 1000;
  else if (suffix === 'M') num *= 1000000;
  else if (suffix === 'B') num *= 1000000000;

  return Math.round(num);
}

/**
 * 从 Nitter HTML 解析推文列表
 */
function parseNitterHTML(html, instance, currentUser) {
  const tweets = [];

  // 匹配所有 timeline-item
  const tweetRegex = /<div class="timeline-item[^"]*"[^>]*>([\s\S]*?)(?=<div class="timeline-item|<div class="show-more"|<div class="timeline-footer"|$)/g;

  let match;
  while ((match = tweetRegex.exec(html)) !== null) {
    try {
      const tweetHtml = match[1];

      // 提取推文 ID
      const idMatch = tweetHtml.match(/\/status\/(\d+)/);
      const id = idMatch ? idMatch[1] : '';
      if (!id) continue;

      // 提取用户名
      const usernameMatch = tweetHtml.match(/<a class="username"[^>]*>@(\w+)<\/a>/);
      const username = usernameMatch ? usernameMatch[1] : '';
      if (!username) continue;

      // 提取显示名称
      const fullnameMatch = tweetHtml.match(/<a class="fullname"[^>]*title="([^"]*)"[^>]*>/);
      const displayName = fullnameMatch ? fullnameMatch[1] : username;

      // 提取头像
      const avatarMatch = tweetHtml.match(/<img class="avatar[^"]*"[^>]*src="([^"]*)"[^>]*>/);
      let avatar = avatarMatch ? decodeNitterUrl(avatarMatch[1], instance) : '';

      // 提取时间
      const timeMatch = tweetHtml.match(/<span class="tweet-date"[^>]*>[\s\S]*?title="([^"]*)"[^>]*>/);
      const timeStr = timeMatch ? timeMatch[1] : '';
      const publishedAt = parseTime(timeStr);

      // 提取内容
      const contentMatch = tweetHtml.match(/<div class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      const contentHtml = contentMatch ? contentMatch[1] : '';
      const content = extractText(contentHtml);

      // 提取媒体（需要排除 quote 区块内的媒体）
      const media = [];

      // 先移除 quote 区块，避免提取引用推文的媒体
      let tweetHtmlWithoutQuote = tweetHtml;
      const quoteBlockMatch = tweetHtml.match(/<div class="quote[^"]*"[^>]*>([\s\S]*?)(?=<div class="tweet-stats|<p class="tweet-published"|$)/);
      if (quoteBlockMatch) {
        tweetHtmlWithoutQuote = tweetHtml.replace(quoteBlockMatch[0], '');
      }

      // 图片
      const imgRegex = /<a[^>]*class="still-image"[^>]*href="([^"]*)"[^>]*>/g;
      let imgMatch;
      while ((imgMatch = imgRegex.exec(tweetHtmlWithoutQuote)) !== null) {
        const url = decodeNitterUrl(imgMatch[1], instance);
        media.push({ type: 'image', url });
      }

      // 视频缩略图
      if (tweetHtmlWithoutQuote.includes('gallery-video') || tweetHtmlWithoutQuote.includes('video-container')) {
        const posterMatch = tweetHtmlWithoutQuote.match(/poster="([^"]*)"/);
        if (posterMatch) {
          const thumbnail = decodeNitterUrl(posterMatch[1], instance);
          media.push({ type: 'video', url: '', thumbnail });
        }
      }

      // 提取统计数据
      const stats = { replies: 0, retweets: 0, likes: 0 };
      const statsMatch = tweetHtml.match(/<div class="tweet-stat">([\s\S]*?)<\/div>/g);
      if (statsMatch) {
        for (const stat of statsMatch) {
          const numMatch = stat.match(/>(\d[\d,KMB]*)</i);
          if (!numMatch) continue;
          const num = parseNumber(numMatch[1]);
          if (stat.includes('comment')) stats.replies = num;
          else if (stat.includes('retweet')) stats.retweets = num;
          else if (stat.includes('heart')) stats.likes = num;
        }
      }

      // 检查是否为转推
      // Nitter HTML 结构: <div class="retweet-header"><span><div class="icon-container">...</div> vitalik.eth retweeted</span></div>
      let retweet;
      const retweetHeaderMatch = tweetHtml.match(/<div class="retweet-header"[^>]*>([\s\S]*?)<\/div>/);
      if (retweetHeaderMatch) {
        // 提取 "xxx retweeted" 文本
        const headerText = retweetHeaderMatch[1].replace(/<[^>]*>/g, '').trim();
        const rtNameMatch = headerText.match(/(.+?)\s+retweeted/i);
        if (rtNameMatch) {
          const retweeterName = rtNameMatch[1].trim();
          retweet = {
            username: currentUser, // 转推者是当前抓取的用户
            displayName: retweeterName,
          };
        }
      }

      // 检查引用推文
      let quote;
      const quoteMatch = tweetHtml.match(/<div class="quote[^"]*"[^>]*>([\s\S]*?)(?=<div class="tweet-stats|$)/);
      if (quoteMatch) {
        const quoteHtml = quoteMatch[1];

        // 提取引用推文的用户名
        const quoteUserMatch = quoteHtml.match(/<a class="username"[^>]*>@(\w+)<\/a>/);
        if (!quoteUserMatch) continue;

        const quoteUsername = quoteUserMatch[1];

        // 提取引用推文的显示名称
        const quoteDisplayNameMatch = quoteHtml.match(/<a class="fullname"[^>]*title="([^"]*)"[^>]*>/);
        const quoteDisplayName = quoteDisplayNameMatch ? quoteDisplayNameMatch[1] : quoteUsername;

        // 提取引用推文的 ID
        const quoteLinkMatch = quoteHtml.match(/href="\/[^/]+\/status\/(\d+)/);
        const quoteId = quoteLinkMatch ? quoteLinkMatch[1] : '';

        // 提取引用推文的文本内容
        const quoteTextMatch = quoteHtml.match(/<div class="quote-text"[^>]*>([\s\S]*?)<\/div>/);
        const quoteContent = quoteTextMatch ? extractText(quoteTextMatch[1]) : '';

        // 提取引用推文的媒体
        const quoteMedia = [];
        const quoteMediaMatch = quoteHtml.match(/<div class="quote-media-container">([\s\S]*?)<\/div>\s*<\/div>/);
        if (quoteMediaMatch) {
          const quoteMediaHtml = quoteMediaMatch[1];

          // 图片
          const quoteImgRegex = /<a[^>]*class="still-image"[^>]*href="([^"]*)"[^>]*>/g;
          let quoteImgMatch;
          while ((quoteImgMatch = quoteImgRegex.exec(quoteMediaHtml)) !== null) {
            const url = decodeNitterUrl(quoteImgMatch[1], instance);
            quoteMedia.push({ type: 'image', url });
          }

          // 视频
          if (quoteMediaHtml.includes('gallery-video') || quoteMediaHtml.includes('video-container')) {
            const quotePosterMatch = quoteMediaHtml.match(/poster="([^"]*)"/);
            if (quotePosterMatch) {
              const thumbnail = decodeNitterUrl(quotePosterMatch[1], instance);
              quoteMedia.push({ type: 'video', url: '', thumbnail });
            }
          }
        }

        quote = {
          username: quoteUsername,
          displayName: quoteDisplayName,
          content: quoteContent,
          link: quoteId ? `https://x.com/${quoteUsername}/status/${quoteId}` : `https://x.com/${quoteUsername}`,
          media: quoteMedia.length > 0 ? quoteMedia : undefined,
        };
      }

      tweets.push({
        id,
        username,
        displayName,
        avatar,
        content,
        contentHtml,
        publishedAt: publishedAt.toISOString(),
        link: `https://x.com/${username}/status/${id}`,
        media: media.length > 0 ? media : undefined,
        retweet,
        quote,
        stats,
      });
    } catch (e) {
      console.error('[Parser] Failed to parse tweet:', e.message);
    }
  }

  return tweets;
}

/**
 * 从 HTML 中提取分页链接（加载更多）
 * Nitter 的分页链接格式通常是: /{username}?cursor=... 或 /{username}/more?cursor=...
 */
function extractNextPageUrl(html, username, instance) {
  // 查找"加载更多"或"Show more"链接
  // 可能的格式:
  // 1. <a href="/{username}?cursor=...">Show more</a>
  // 2. <a href="/{username}/more?cursor=...">Show more</a>
  // 3. <div class="show-more"><a href="...">...</a></div>
  // 4. <a href="/{username}?cursor=..." class="show-more">...</a>

  // 先尝试在 show-more 区域内查找
  const showMoreBlockMatch = html.match(/<div[^>]*class="[^"]*show-more[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (showMoreBlockMatch) {
    const showMoreBlock = showMoreBlockMatch[1];
    const linkMatch = showMoreBlock.match(/<a[^>]*href="([^"]*)"[^>]*>/i);
    if (linkMatch && linkMatch[1]) {
      const href = linkMatch[1];
      // 处理相对路径和绝对路径
      if (href.startsWith('/')) {
        if (href.includes(username) || href.includes('cursor=')) {
          return `https://${instance}${href}`;
        }
      } else if (href.startsWith('http')) {
        // 已经是完整 URL
        if (href.includes(username) || href.includes('cursor=')) {
          return href;
        }
      }
    }
  }

  // 查找包含 "Show more" 文本的链接
  const showMoreTextPatterns = [
    /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?Show more/i,
    /<a[^>]*>[\s\S]*?Show more[\s\S]*?href="([^"]*)"/i,
  ];

  for (const pattern of showMoreTextPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const href = match[1];
      if (href.startsWith('/')) {
        if (href.includes(username) || href.includes('cursor=')) {
          return `https://${instance}${href}`;
        }
      } else if (href.startsWith('http')) {
        if (href.includes(username) || href.includes('cursor=')) {
          return href;
        }
      }
    }
  }

  // 查找包含 cursor 参数的链接（通常在 timeline-footer 或 show-more 附近）
  const cursorPatterns = [
    /href="(\/[^"]*\?cursor=[^"]*)"/i,
    /href="(\/[^"]*\/more\?cursor=[^"]*)"/i,
  ];

  for (const pattern of cursorPatterns) {
    const matches = html.matchAll(new RegExp(pattern.source, 'gi'));
    for (const match of matches) {
      if (match[1]) {
        const href = match[1];
        // 确保链接属于当前用户
        if (href.includes(username) || href.startsWith(`/${username}`)) {
          return `https://${instance}${href}`;
        }
      }
    }
  }

  return null;
}

/**
 * 从 Nitter 实例获取用户页面（单页）
 */
async function fetchUserPageSingle(username, instance, cursor = null) {
  let url;
  if (cursor) {
    // 如果有 cursor，使用分页 URL
    url = cursor.startsWith('http') ? cursor : `https://${instance}/${username}${cursor.startsWith('?') ? cursor : `?cursor=${cursor}`}`;
  } else {
    url = `https://${instance}/${username}`;
  }

  const response = await fetchWithCurl(url);

  if (!response.ok) {
    return { ok: false, error: response.error };
  }

  const html = await response.text();

  // 验证是否为有效的用户页面
  if (html.includes('timeline-item') && html.includes('tweet-content')) {
    return { ok: true, html, instance };
  }

  // 检查是否为错误页面或 bot 检测
  if (html.includes('error-panel') || html.includes('User not found')) {
    return { ok: false, error: 'user not found' };
  }

  if (html.includes('Checking your browser') || html.includes('challenge-platform') || html.includes('not a bot')) {
    return { ok: false, error: 'bot detection' };
  }

  return { ok: false, error: 'unexpected response' };
}

/**
 * 获取单个用户的推文（支持多页）
 */
async function fetchUserTweets(username, maxPages = 5) {
  console.log(`\nFetching @${username}...`);

  const errors = [];
  let workingInstance = null;
  const allTweets = [];
  const seenTweetIds = new Set();

  // 先找到一个可用的实例
  for (const instance of NITTER_INSTANCES) {
    try {
      console.log(`  [${instance}] Fetching page 1...`);
      let result = await fetchUserPageSingle(username, instance);

      if (!result.ok) {
        console.log(`  [${instance}] Error: ${result.error}`);
        errors.push(`${instance}: ${result.error}`);
        continue;
      }

      workingInstance = instance;
      let currentPage = 1;

      // 解析第一页
      const pageTweets = parseNitterHTML(result.html, instance, username);
      for (const tweet of pageTweets) {
        if (!seenTweetIds.has(tweet.id)) {
          allTweets.push(tweet);
          seenTweetIds.add(tweet.id);
        }
      }
      console.log(`  [${instance}] Page ${currentPage}: ${pageTweets.length} tweets (total: ${allTweets.length})`);

      // 继续抓取后续页面
      let nextPageUrl = extractNextPageUrl(result.html, username, instance);

      while (nextPageUrl && currentPage < maxPages) {
        currentPage++;
        console.log(`  [${instance}] Fetching page ${currentPage}...`);

        // 等待一段时间，避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1500));

        result = await fetchUserPageSingle(username, instance, nextPageUrl);

        if (!result.ok) {
          console.log(`  [${instance}] Page ${currentPage} failed: ${result.error}`);
          break;
        }

        // 解析当前页的推文
        const nextPageTweets = parseNitterHTML(result.html, instance, username);
        let newTweetsCount = 0;
        for (const tweet of nextPageTweets) {
          if (!seenTweetIds.has(tweet.id)) {
            allTweets.push(tweet);
            seenTweetIds.add(tweet.id);
            newTweetsCount++;
          }
        }
        console.log(`  [${instance}] Page ${currentPage}: ${nextPageTweets.length} tweets (${newTweetsCount} new, total: ${allTweets.length})`);

        // 如果这一页没有新推文，可能已经到底了
        if (newTweetsCount === 0 && nextPageTweets.length > 0) {
          console.log(`  [${instance}] No new tweets on page ${currentPage}, stopping`);
          break;
        }

        // 查找下一页链接
        nextPageUrl = extractNextPageUrl(result.html, username, instance);

        if (!nextPageUrl) {
          console.log(`  [${instance}] No more pages`);
          break;
        }
      }

      console.log(`  [${instance}] ✓ Success (${currentPage} page(s), ${allTweets.length} unique tweets)`);
      return allTweets;
    } catch (error) {
      const msg = error.message || 'Unknown error';
      console.log(`  [${instance}] Error: ${msg}`);
      errors.push(`${instance}: ${msg}`);
    }
  }

  console.error(`  All instances failed: ${errors.join(', ')}`);
  return [];
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('Tweet Fetcher');
  console.log('========================================');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Users: ${FOLLOWERS.map(f => '@' + f.username).join(', ')}`);
  console.log(`Instances: ${NITTER_INSTANCES.join(', ')}`);

  // 确保 data 目录存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 读取现有数据（如果有）
  let existingTweets = [];
  if (fs.existsSync(TWEETS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(TWEETS_FILE, 'utf-8'));
      existingTweets = data.tweets || [];
      console.log(`\nExisting tweets: ${existingTweets.length}`);
    } catch (e) {
      console.log('\nNo existing data or invalid format');
    }
  }

  // 抓取所有用户的推文
  const allTweets = [];
  let successCount = 0;
  let failCount = 0;

  for (const follower of FOLLOWERS) {
    try {
      const tweets = await fetchUserTweets(follower.username, MAX_PAGES_PER_USER);
      if (tweets.length > 0) {
        allTweets.push(...tweets);
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(`  Error fetching @${follower.username}:`, error.message);
      failCount++;
    }

    // 请求间隔，避免被限制
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 创建当前 followers 的用户名集合（用于过滤已删除的 followers 的推文）
  const currentFollowerUsernames = new Set(FOLLOWERS.map(f => f.username.toLowerCase()));

  // 合并新旧数据，去重
  const tweetMap = new Map();

  // 先添加旧数据（只保留当前 followers 的推文）
  for (const tweet of existingTweets) {
    // 只保留当前 followers 列表中的用户的推文
    if (currentFollowerUsernames.has(tweet.username.toLowerCase())) {
      tweetMap.set(tweet.id, tweet);
    }
  }

  // 新数据覆盖旧数据
  for (const tweet of allTweets) {
    tweetMap.set(tweet.id, tweet);
  }

  // 按时间排序
  const mergedTweets = Array.from(tweetMap.values())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 500); // 最多保留 500 条

  // 保存数据
  const output = {
    lastUpdated: new Date().toISOString(),
    followers: FOLLOWERS,
    stats: {
      total: mergedTweets.length,
      newFetched: allTweets.length,
      successUsers: successCount,
      failedUsers: failCount,
    },
    tweets: mergedTweets,
  };

  fs.writeFileSync(TWEETS_FILE, JSON.stringify(output, null, 2));

  console.log('\n========================================');
  console.log('Summary');
  console.log('========================================');
  console.log(`Success: ${successCount}/${FOLLOWERS.length} users`);
  console.log(`New tweets: ${allTweets.length}`);
  console.log(`Total tweets: ${mergedTweets.length}`);
  console.log(`Saved to: ${TWEETS_FILE}`);

  // 如果没有成功获取任何推文，返回错误码
  if (successCount === 0) {
    console.error('\nError: Failed to fetch any tweets!');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
