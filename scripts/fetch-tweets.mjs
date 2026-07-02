#!/usr/bin/env node

/**
 * Tweet fetching script.
 *
 * Usage:
 *   node scripts/fetch-tweets.mjs
 *
 * Fetches tweets from Nitter instances and saves them to data/tweets.json.
 * Can be run locally or on a schedule via GitHub Actions.
 */

import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const execAsync = promisify(exec)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT_DIR, 'data')
const DEFAULT_TWEETS_FILE = path.join(DATA_DIR, 'tweets.json')
const TWEETS_FILE = process.env.TWEETS_OUTPUT_FILE || DEFAULT_TWEETS_FILE
const EXISTING_TWEETS_FILE =
  process.env.TWEETS_EXISTING_FILE ||
  (fs.existsSync(TWEETS_FILE) ? TWEETS_FILE : DEFAULT_TWEETS_FILE)
const FOLLOWERS_JSON_FILE = path.join(DATA_DIR, 'followers.json')
const FOLLOWERS_TXT_FILE = path.join(DATA_DIR, 'followers.txt')

// Fallback Nitter instances used when dynamic discovery fails.
const FALLBACK_NITTER_INSTANCES = [
  'nitter.net',
  'nitter.privacyredirect.com',
  'xcancel.com',
  'nitter.1d4.us',
  'nitter.cz',
  'nitter.poast.org'
]

// Upstream sources for discovering working instances.
const INSTANCE_LIST_SOURCES = [
  {
    name: 'GitHub Wiki',
    url: 'https://raw.githubusercontent.com/wiki/zedeus/nitter/Instances.md',
    parser: parseGitHubWikiInstances
  }
]

/**
 * Parse the instance list from the GitHub Wiki markdown table.
 * Table format: | [domain.com](https://domain.com) | :white_check_mark: | ✅ | ...
 * Only keep instances marked as online and working.
 */
function parseGitHubWikiInstances(text) {
  const instances = []
  const lines = text.split('\n')

  for (const line of lines) {
    // Skip non-data rows.
    if (!line.startsWith('|') || line.includes('---') || line.includes('URL')) {
      continue
    }

    // Require rows marked as working (✅ or :white_check_mark:).
    // Format: | [url](https://...) | :white_check_mark: | ✅ | country | ...
    const isOnline = line.includes(':white_check_mark:') || line.includes('✅')
    if (!isOnline) {
      continue
    }

    // Exclude Tor (.onion) and I2P (.i2p) instances.
    if (line.includes('.onion') || line.includes('.i2p')) {
      continue
    }

    // Extract the domain from [domain.com](https://domain.com).
    const match = line.match(/\[([^\]]+)\]\(https?:\/\/([^)\/]+)/)
    if (match) {
      const domain = match[2].replace(/\/$/, '')
      // Filter out non-instance links such as SSL Labs checks.
      if (
        domain &&
        !domain.includes(' ') &&
        domain.includes('.') &&
        !domain.includes('ssllabs.com') &&
        !domain.includes('github.com')
      ) {
        instances.push(domain)
      }
    }
  }

  // Deduplicate instances.
  return [...new Set(instances)]
}

/**
 * Small HTTP helper for fetching instance lists.
 */
async function simpleFetch(url, timeout = 10) {
  try {
    const { stdout } = await execAsync(
      `curl -sL --connect-timeout ${timeout} --max-time ${timeout * 2} "${url}"`,
      { maxBuffer: 5 * 1024 * 1024 }
    )
    return stdout
  } catch {
    return null
  }
}

/**
 * Discover Nitter instances dynamically.
 * Prefer online sources and fall back to the static list on failure.
 */
async function getNitterInstances() {
  console.log('Fetching Nitter instance list...')

  // Keep the official instance first.
  const officialInstances = ['nitter.net']

  for (const source of INSTANCE_LIST_SOURCES) {
    try {
      console.log(`  Trying ${source.name}...`)
      const text = await simpleFetch(source.url)

      if (text) {
        const instances = source.parser(text)
        if (instances.length > 0) {
          console.log(
            `  ✓ Found ${instances.length} instances from ${source.name}`
          )
          // Put the official instance first, then add deduplicated community instances.
          const combined = [
            ...officialInstances,
            ...instances.filter(i => !officialInstances.includes(i))
          ]
          return combined.slice(0, 10) // Return at most 10 instances.
        }
      }
      console.log(`  ✗ No instances found from ${source.name}`)
    } catch (error) {
      console.log(`  ✗ Failed to fetch from ${source.name}: ${error.message}`)
    }
  }

  console.log('  Using fallback instance list')
  return FALLBACK_NITTER_INSTANCES
}

// Runtime instance list, initialized in main().
let NITTER_INSTANCES = []

/**
 * Read followed accounts from the text source (preferred).
 * Supported formats:
 * - Simple format: username
 * - Grouped format: username,group
 * - Comment lines starting with #
 * - Blank lines are ignored
 */
function loadFollowersFromText() {
  if (!fs.existsSync(FOLLOWERS_TXT_FILE)) {
    return null
  }

  try {
    const content = fs.readFileSync(FOLLOWERS_TXT_FILE, 'utf-8')
    const lines = content.split('\n')
    const followers = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Skip blank lines and comments.
      if (!line || line.startsWith('#')) {
        continue
      }

      // Support either username or username,group lines.
      // displayName is derived later from tweet data.
      const parts = line.split(',').map(p => p.trim())
      const username = parts[0]

      if (!username) {
        continue
      }

      const follower = {
        username: username
      }

      // Optional second field: group.
      if (parts[1]) {
        follower.group = parts[1]
      }

      followers.push(follower)
    }

    return followers.length > 0 ? followers : null
  } catch (error) {
    console.error(`Error reading ${FOLLOWERS_TXT_FILE}:`, error.message)
    return null
  }
}

/**
 * Read followed accounts from JSON (backward compatibility).
 */
function loadFollowersFromJson() {
  if (!fs.existsSync(FOLLOWERS_JSON_FILE)) {
    return null
  }

  try {
    const data = JSON.parse(fs.readFileSync(FOLLOWERS_JSON_FILE, 'utf-8'))
    if (!data.followers || !Array.isArray(data.followers)) {
      return null
    }

    // Validate each follower object.
    for (const follower of data.followers) {
      if (!follower.username) {
        throw new Error('Invalid follower: missing "username"')
      }
    }

    return data.followers
  } catch (error) {
    console.error(`Error reading ${FOLLOWERS_JSON_FILE}:`, error.message)
    return null
  }
}

/**
 * Load the follower list, preferring the text format.
 */
function loadFollowers() {
  // Prefer the text source.
  let followers = loadFollowersFromText()

  // Fall back to JSON if the text source is missing.
  if (!followers) {
    followers = loadFollowersFromJson()
  }

  // Fail if neither source exists.
  if (!followers || followers.length === 0) {
    console.error('Error: No followers found!')
    console.error(
      `Please create ${FOLLOWERS_TXT_FILE} with the following format:`
    )
    console.error('')
    console.error('# one username per line')
    console.error('elonmusk,Elon Musk,Tech')
    console.error('jack,Jack Dorsey,Tech')
    console.error('# or simple format')
    console.error('naval')
    console.error('VitalikButerin')
    process.exit(1)
  }

  return followers
}

// Load the follower list.
const FOLLOWERS = loadFollowers()

const FETCH_TIMEOUT = 30
// Maximum pages fetched per user (about 20-30 tweets per page).
const MAX_PAGES_PER_USER = Number(process.env.MAX_PAGES_PER_USER || 5)
const PAGE_DELAY_MS = Number(process.env.PAGE_DELAY_MS || 1500)
const USER_DELAY_MS = Number(process.env.USER_DELAY_MS || 2000)

/**
 * Fetch a page with curl to reduce bot detection issues.
 */
async function fetchWithCurl(url, timeout = FETCH_TIMEOUT) {
  try {
    // Send common browser headers to avoid simple bot checks.
    const headers = [
      '-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"',
      '-H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"',
      '-H "Accept-Language: en-US,en;q=0.9"',
      '-H "Accept-Encoding: gzip, deflate, br"',
      '-H "Cache-Control: no-cache"',
      '-H "Pragma: no-cache"',
      '-H "Sec-Fetch-Dest: document"',
      '-H "Sec-Fetch-Mode: navigate"',
      '-H "Sec-Fetch-Site: none"',
      '-H "Sec-Fetch-User: ?1"',
      '-H "Upgrade-Insecure-Requests: 1"'
    ].join(' ')

    const { stdout } = await execAsync(
      `curl -sL --compressed --connect-timeout ${timeout} --max-time ${timeout * 2} ${headers} "${url}"`,
      { maxBuffer: 10 * 1024 * 1024 }
    )
    return { ok: true, text: () => Promise.resolve(stdout) }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

/**
 * Decode Nitter media URLs.
 * Nitter format: /pic/https%3A%2F%2Fpbs.twimg.com%2F... or /pic/orig/media%2F...
 */
/**
 * Convert relative Nitter media URLs back to the original image URL,
 * preferring direct pbs.twimg.com links.
 */
function decodeNitterUrl(url, instance) {
  if (!url) {
    return url
  }

  try {
    const normalizedUrl = /^https?:\/\//i.test(url)
      ? url.replace(/^http:\/\//i, 'https://')
      : `https://${instance}${url}`
    const parsed = new URL(normalizedUrl)
    const match = parsed.pathname.match(/^\/pic\/(?:orig\/)?(.+)$/)
    if (!match) {
      return normalizedUrl
    }

    const decodedPath = decodeURIComponent(match[1])
    if (!decodedPath) {
      return normalizedUrl
    }

    if (/^https?:\/\//i.test(decodedPath)) {
      return decodedPath.replace(/^http:\/\//i, 'https://')
    }

    return `https://pbs.twimg.com/${decodedPath.replace(/^\/+/, '')}`
  } catch {
    return /^https?:\/\//i.test(url)
      ? url.replace(/^http:\/\//i, 'https://')
      : `https://${instance}${url}`
  }
}

/**
 * Extract plain text from HTML.
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
    .trim()
}

/**
 * Parse a tweet timestamp.
 */
function parseTime(timeStr) {
  // Format: "Dec 7, 2025 · 5:13 AM UTC"
  const match = timeStr.match(/(\w+ \d+, \d+)\s*·\s*(\d+:\d+ [AP]M)/)
  if (match) {
    const dateStr = `${match[1]} ${match[2]}`
    return new Date(dateStr + ' UTC')
  }
  const parsed = new Date(timeStr)
  if (!isNaN(parsed.getTime())) {
    return parsed
  }
  return new Date()
}

/**
 * Parse numbers from compact counter strings.
 */
function parseNumber(str) {
  const cleaned = str.replace(/,/g, '').trim()
  const match = cleaned.match(/([\d.]+)\s*([KMB])?/i)
  if (!match) return 0

  let num = parseFloat(match[1])
  const suffix = match[2]?.toUpperCase()

  if (suffix === 'K') num *= 1000
  else if (suffix === 'M') num *= 1000000
  else if (suffix === 'B') num *= 1000000000

  return Math.round(num)
}

/**
 * Parse tweets from Nitter HTML.
 */
function parseNitterHTML(html, instance, currentUser) {
  const tweets = []

  // Match all timeline items.
  const tweetRegex =
    /<div class="timeline-item[^"]*"[^>]*>([\s\S]*?)(?=<div class="timeline-item|<div class="show-more"|<div class="timeline-footer"|$)/g

  let match
  while ((match = tweetRegex.exec(html)) !== null) {
    try {
      const tweetHtml = match[1]

      // Extract the tweet ID.
      const idMatch = tweetHtml.match(/\/status\/(\d+)/)
      const id = idMatch ? idMatch[1] : ''
      if (!id) continue

      // Extract the username.
      const usernameMatch = tweetHtml.match(
        /<a class="username"[^>]*>@(\w+)<\/a>/
      )
      const username = usernameMatch ? usernameMatch[1] : ''
      if (!username) continue

      // Extract the display name.
      const fullnameMatch = tweetHtml.match(
        /<a class="fullname"[^>]*title="([^"]*)"[^>]*>/
      )
      const displayName = fullnameMatch ? fullnameMatch[1] : username

      // Extract the avatar.
      const avatarMatch = tweetHtml.match(
        /<img class="avatar[^"]*"[^>]*src="([^"]*)"[^>]*>/
      )
      let avatar = avatarMatch ? decodeNitterUrl(avatarMatch[1], instance) : ''

      // Extract the timestamp.
      const timeMatch = tweetHtml.match(
        /<span class="tweet-date"[^>]*>[\s\S]*?title="([^"]*)"[^>]*>/
      )
      const timeStr = timeMatch ? timeMatch[1] : ''
      const publishedAt = parseTime(timeStr)

      // Extract the content.
      const contentMatch = tweetHtml.match(
        /<div class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/
      )
      const contentHtml = contentMatch ? contentMatch[1] : ''
      const content = extractText(contentHtml)

      // Extract media, excluding media inside quote blocks.
      const media = []

      // Remove the quote block first to avoid picking up quoted media.
      let tweetHtmlWithoutQuote = tweetHtml
      const quoteBlockMatch = tweetHtml.match(
        /<div class="quote[^"]*"[^>]*>([\s\S]*?)(?=<div class="tweet-stats|<p class="tweet-published"|$)/
      )
      if (quoteBlockMatch) {
        tweetHtmlWithoutQuote = tweetHtml.replace(quoteBlockMatch[0], '')
      }

      // Images.
      const imgRegex = /<a[^>]*class="still-image"[^>]*href="([^"]*)"[^>]*>/g
      let imgMatch
      while ((imgMatch = imgRegex.exec(tweetHtmlWithoutQuote)) !== null) {
        const url = decodeNitterUrl(imgMatch[1], instance)
        media.push({ type: 'image', url })
      }

      // Video thumbnails.
      if (
        tweetHtmlWithoutQuote.includes('gallery-video') ||
        tweetHtmlWithoutQuote.includes('video-container')
      ) {
        const posterMatch = tweetHtmlWithoutQuote.match(/poster="([^"]*)"/)
        if (posterMatch) {
          const thumbnail = decodeNitterUrl(posterMatch[1], instance)
          media.push({ type: 'video', url: '', thumbnail })
        }
      }

      // Extract engagement counters.
      const stats = { replies: 0, retweets: 0, likes: 0 }
      const statsMatch = tweetHtml.match(
        /<div class="tweet-stat">([\s\S]*?)<\/div>/g
      )
      if (statsMatch) {
        for (const stat of statsMatch) {
          const numMatch = stat.match(/>(\d[\d,KMB]*)</i)
          if (!numMatch) continue
          const num = parseNumber(numMatch[1])
          if (stat.includes('comment')) stats.replies = num
          else if (stat.includes('retweet')) stats.retweets = num
          else if (stat.includes('heart')) stats.likes = num
        }
      }

      // Check whether this is a repost.
      // Nitter structure: <div class="retweet-header"><span><div class="icon-container">...</div> vitalik.eth retweeted</span></div>
      let retweet
      const retweetHeaderMatch = tweetHtml.match(
        /<div class="retweet-header"[^>]*>([\s\S]*?)<\/div>/
      )
      if (retweetHeaderMatch) {
        // Extract the "xxx retweeted" label.
        const headerText = retweetHeaderMatch[1].replace(/<[^>]*>/g, '').trim()
        const rtNameMatch = headerText.match(/(.+?)\s+retweeted/i)
        if (rtNameMatch) {
          const retweeterName = rtNameMatch[1].trim()
          retweet = {
            username: currentUser, // The reposting account is the current user.
            displayName: retweeterName
          }
        }
      }

      // Extract the quoted post if present.
      let quote
      const quoteMatch = tweetHtml.match(
        /<div class="quote[^"]*"[^>]*>([\s\S]*?)(?=<div class="tweet-stats|$)/
      )
      if (quoteMatch) {
        const quoteHtml = quoteMatch[1]

        // Extract the quoted username.
        const quoteUserMatch = quoteHtml.match(
          /<a class="username"[^>]*>@(\w+)<\/a>/
        )
        if (quoteUserMatch) {
          const quoteUsername = quoteUserMatch[1]

          // Extract the quoted display name.
          const quoteDisplayNameMatch = quoteHtml.match(
            /<a class="fullname"[^>]*title="([^"]*)"[^>]*>/
          )
          const quoteDisplayName = quoteDisplayNameMatch
            ? quoteDisplayNameMatch[1]
            : quoteUsername

          // Extract the quoted tweet ID.
          const quoteLinkMatch = quoteHtml.match(/href="\/[^/]+\/status\/(\d+)/)
          const quoteId = quoteLinkMatch ? quoteLinkMatch[1] : ''

          // Extract the quoted text.
          const quoteTextMatch = quoteHtml.match(
            /<div class="quote-text"[^>]*>([\s\S]*?)<\/div>/
          )
          const quoteContentHtml = quoteTextMatch ? quoteTextMatch[1] : ''
          const quoteContent = quoteTextMatch
            ? extractText(quoteContentHtml)
            : ''

          // Extract quoted media.
          const quoteMedia = []
          const quoteMediaMatch = quoteHtml.match(
            /<div class="quote-media-container">([\s\S]*?)<\/div>\s*<\/div>/
          )
          if (quoteMediaMatch) {
            const quoteMediaHtml = quoteMediaMatch[1]

            // Images.
            const quoteImgRegex =
              /<a[^>]*class="still-image"[^>]*href="([^"]*)"[^>]*>/g
            let quoteImgMatch
            while (
              (quoteImgMatch = quoteImgRegex.exec(quoteMediaHtml)) !== null
            ) {
              const url = decodeNitterUrl(quoteImgMatch[1], instance)
              quoteMedia.push({ type: 'image', url })
            }

            // Video thumbnails.
            if (
              quoteMediaHtml.includes('gallery-video') ||
              quoteMediaHtml.includes('video-container')
            ) {
              const quotePosterMatch = quoteMediaHtml.match(/poster="([^"]*)"/)
              if (quotePosterMatch) {
                const thumbnail = decodeNitterUrl(quotePosterMatch[1], instance)
                quoteMedia.push({ type: 'video', url: '', thumbnail })
              }
            }
          }

          quote = {
            username: quoteUsername,
            displayName: quoteDisplayName,
            content: quoteContent,
            contentHtml: quoteContentHtml || undefined,
            link: quoteId
              ? `https://x.com/${quoteUsername}/status/${quoteId}`
              : `https://x.com/${quoteUsername}`,
            media: quoteMedia.length > 0 ? quoteMedia : undefined
          }
        }
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
        stats
      })
    } catch (e) {
      console.error('[Parser] Failed to parse tweet:', e.message)
    }
  }

  return tweets
}

function normalizeMediaItem(media) {
  if (!media) {
    return media
  }

  return {
    ...media,
    url: decodeNitterUrl(media.url, 'nitter.net'),
    thumbnail: media.thumbnail
      ? decodeNitterUrl(media.thumbnail, 'nitter.net')
      : undefined
  }
}

function normalizeTweetRecord(tweet) {
  if (!tweet) {
    return tweet
  }

  return {
    ...tweet,
    avatar: tweet.avatar
      ? decodeNitterUrl(tweet.avatar, 'nitter.net')
      : tweet.avatar,
    media: tweet.media?.map(normalizeMediaItem),
    quote: tweet.quote
      ? {
          ...tweet.quote,
          media: tweet.quote.media?.map(normalizeMediaItem)
        }
      : undefined
  }
}

/**
 * Extract the next-page link from HTML.
 * Nitter pagination usually looks like: /{username}?cursor=... or /{username}/more?cursor=...
 */
function extractNextPageUrl(html, username, instance) {
  // Look for a "Show more" link.
  // Possible shapes:
  // 1. <a href="/{username}?cursor=...">Show more</a>
  // 2. <a href="/{username}/more?cursor=...">Show more</a>
  // 3. <div class="show-more"><a href="...">...</a></div>
  // 4. <a href="/{username}?cursor=..." class="show-more">...</a>

  // First try the dedicated show-more block.
  const showMoreBlockMatch = html.match(
    /<div[^>]*class="[^"]*show-more[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  )
  if (showMoreBlockMatch) {
    const showMoreBlock = showMoreBlockMatch[1]
    const linkMatch = showMoreBlock.match(/<a[^>]*href="([^"]*)"[^>]*>/i)
    if (linkMatch && linkMatch[1]) {
      const href = linkMatch[1]
      // Handle both relative and absolute URLs.
      if (href.startsWith('/')) {
        if (href.includes(username) || href.includes('cursor=')) {
          return `https://${instance}${href}`
        }
      } else if (href.startsWith('http')) {
        // Already a full URL.
        if (href.includes(username) || href.includes('cursor=')) {
          return href
        }
      }
    }
  }

  // Fall back to links containing "Show more" text.
  const showMoreTextPatterns = [
    /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?Show more/i,
    /<a[^>]*>[\s\S]*?Show more[\s\S]*?href="([^"]*)"/i
  ]

  for (const pattern of showMoreTextPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const href = match[1]
      if (href.startsWith('/')) {
        if (href.includes(username) || href.includes('cursor=')) {
          return `https://${instance}${href}`
        }
      } else if (href.startsWith('http')) {
        if (href.includes(username) || href.includes('cursor=')) {
          return href
        }
      }
    }
  }

  // Finally, look for any cursor link near the footer or show-more section.
  const cursorPatterns = [
    /href="(\/[^"]*\?cursor=[^"]*)"/i,
    /href="(\/[^"]*\/more\?cursor=[^"]*)"/i
  ]

  for (const pattern of cursorPatterns) {
    const matches = html.matchAll(new RegExp(pattern.source, 'gi'))
    for (const match of matches) {
      if (match[1]) {
        const href = match[1]
        // Make sure the link belongs to the current user.
        if (href.includes(username) || href.startsWith(`/${username}`)) {
          return `https://${instance}${href}`
        }
      }
    }
  }

  return null
}

/**
 * Fetch a single user page from a Nitter instance.
 */
async function fetchUserPageSingle(username, instance, cursor = null) {
  let url
  if (cursor) {
    // Use the pagination URL when a cursor is available.
    url = cursor.startsWith('http')
      ? cursor
      : `https://${instance}/${username}${cursor.startsWith('?') ? cursor : `?cursor=${cursor}`}`
  } else {
    url = `https://${instance}/${username}`
  }

  const response = await fetchWithCurl(url)

  if (!response.ok) {
    return { ok: false, error: response.error }
  }

  const html = await response.text()

  // Confirm that this looks like a valid user timeline page.
  if (html.includes('timeline-item') && html.includes('tweet-content')) {
    return { ok: true, html, instance }
  }

  // Detect error pages or bot challenges.
  if (html.includes('error-panel') || html.includes('User not found')) {
    return { ok: false, error: 'user not found' }
  }

  if (
    html.includes('Checking your browser') ||
    html.includes('challenge-platform') ||
    html.includes('not a bot')
  ) {
    return { ok: false, error: 'bot detection' }
  }

  return { ok: false, error: 'unexpected response' }
}

/**
 * Fetch tweets for a single user, including pagination.
 */
async function fetchUserTweets(username, maxPages = 5) {
  console.log(`\nFetching @${username}...`)

  const errors = []
  const allTweets = []
  const seenTweetIds = new Set()

  // Find the first working instance.
  for (const instance of NITTER_INSTANCES) {
    try {
      console.log(`  [${instance}] Fetching page 1...`)
      let result = await fetchUserPageSingle(username, instance)

      if (!result.ok) {
        console.log(`  [${instance}] Error: ${result.error}`)
        errors.push(`${instance}: ${result.error}`)
        continue
      }

      let currentPage = 1

      // Parse the first page.
      const pageTweets = parseNitterHTML(result.html, instance, username)
      for (const tweet of pageTweets) {
        if (!seenTweetIds.has(tweet.id)) {
          allTweets.push(tweet)
          seenTweetIds.add(tweet.id)
        }
      }
      console.log(
        `  [${instance}] Page ${currentPage}: ${pageTweets.length} tweets (total: ${allTweets.length})`
      )

      // Continue with additional pages when available.
      let nextPageUrl = extractNextPageUrl(result.html, username, instance)

      while (nextPageUrl && currentPage < maxPages) {
        currentPage++
        console.log(`  [${instance}] Fetching page ${currentPage}...`)

        // Pause briefly to avoid hitting rate limits.
        await new Promise(resolve => setTimeout(resolve, PAGE_DELAY_MS))

        result = await fetchUserPageSingle(username, instance, nextPageUrl)

        if (!result.ok) {
          console.log(
            `  [${instance}] Page ${currentPage} failed: ${result.error}`
          )
          break
        }

        // Parse tweets from the current page.
        const nextPageTweets = parseNitterHTML(result.html, instance, username)
        let newTweetsCount = 0
        for (const tweet of nextPageTweets) {
          if (!seenTweetIds.has(tweet.id)) {
            allTweets.push(tweet)
            seenTweetIds.add(tweet.id)
            newTweetsCount++
          }
        }
        console.log(
          `  [${instance}] Page ${currentPage}: ${nextPageTweets.length} tweets (${newTweetsCount} new, total: ${allTweets.length})`
        )

        // If a page yields no new tweets, we have probably reached the end.
        if (newTweetsCount === 0 && nextPageTweets.length > 0) {
          console.log(
            `  [${instance}] No new tweets on page ${currentPage}, stopping`
          )
          break
        }

        // Find the next page link.
        nextPageUrl = extractNextPageUrl(result.html, username, instance)

        if (!nextPageUrl) {
          console.log(`  [${instance}] No more pages`)
          break
        }
      }

      console.log(
        `  [${instance}] ✓ Success (${currentPage} page(s), ${allTweets.length} unique tweets)`
      )
      return allTweets
    } catch (error) {
      const msg = error.message || 'Unknown error'
      console.log(`  [${instance}] Error: ${msg}`)
      errors.push(`${instance}: ${msg}`)
    }
  }

  console.error(`  All instances failed: ${errors.join(', ')}`)
  return []
}

/**
 * Main entry point.
 */
async function main() {
  console.log('========================================')
  console.log('Tweet Fetcher')
  console.log('========================================')
  console.log(`Time: ${new Date().toISOString()}`)
  console.log(`Users: ${FOLLOWERS.map(f => '@' + f.username).join(', ')}`)

  // Dynamically discover working Nitter instances.
  NITTER_INSTANCES = await getNitterInstances()
  console.log(`Instances: ${NITTER_INSTANCES.join(', ')}`)

  // Ensure the data directory exists.
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  // Load existing data if it exists.
  let existingTweets = []
  if (fs.existsSync(EXISTING_TWEETS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(EXISTING_TWEETS_FILE, 'utf-8'))
      existingTweets = data.tweets || []
      console.log(`\nExisting tweets: ${existingTweets.length}`)
    } catch {
      console.log('\nNo existing data or invalid format')
    }
  }

  // Fetch tweets for every configured follower.
  const allTweets = []
  let successCount = 0
  let failCount = 0

  for (const follower of FOLLOWERS) {
    try {
      const tweets = await fetchUserTweets(
        follower.username,
        MAX_PAGES_PER_USER
      )
      if (tweets.length > 0) {
        allTweets.push(...tweets)
        successCount++
      } else {
        failCount++
      }
    } catch (error) {
      console.error(`  Error fetching @${follower.username}:`, error.message)
      failCount++
    }

    // Add spacing between requests to reduce throttling.
    await new Promise(resolve => setTimeout(resolve, USER_DELAY_MS))
  }

  // Track current followers so removed accounts are filtered out.
  const currentFollowerUsernames = new Set(
    FOLLOWERS.map(f => f.username.toLowerCase())
  )

  // Merge old and new data, deduplicated by tweet ID.
  const tweetMap = new Map()

  // Add existing tweets first, but only for current followers.
  for (const tweet of existingTweets) {
    // Keep only tweets from accounts that still exist in followers.txt.
    if (currentFollowerUsernames.has(tweet.username.toLowerCase())) {
      const normalizedTweet = normalizeTweetRecord(tweet)
      tweetMap.set(normalizedTweet.id, normalizedTweet)
    }
  }

  // Let newly fetched data override older records.
  for (const tweet of allTweets) {
    const normalizedTweet = normalizeTweetRecord(tweet)
    tweetMap.set(normalizedTweet.id, normalizedTweet)
  }

  // Sort newest first.
  const mergedTweets = Array.from(tweetMap.values())
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, 500) // Keep at most 500 tweets.

  // Save the merged output.
  const output = {
    lastUpdated: new Date().toISOString(),
    followers: FOLLOWERS,
    stats: {
      total: mergedTweets.length,
      newFetched: allTweets.length,
      successUsers: successCount,
      failedUsers: failCount
    },
    tweets: mergedTweets
  }

  fs.writeFileSync(TWEETS_FILE, JSON.stringify(output, null, 2))

  console.log('\n========================================')
  console.log('Summary')
  console.log('========================================')
  console.log(`Success: ${successCount}/${FOLLOWERS.length} users`)
  console.log(`New tweets: ${allTweets.length}`)
  console.log(`Total tweets: ${mergedTweets.length}`)
  console.log(`Saved to: ${TWEETS_FILE}`)

  // Exit with an error code if no tweets were fetched successfully.
  if (successCount === 0) {
    console.error('\nError: Failed to fetch any tweets!')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
