#!/usr/bin/env node
/**
 * 验证关注者列表 JSON 文件格式
 *
 * 使用方式:
 *   node scripts/validate-followers.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const FOLLOWERS_TXT_FILE = path.join(ROOT_DIR, 'data', 'followers.txt');
const FOLLOWERS_JSON_FILE = path.join(ROOT_DIR, 'data', 'followers.json');

function parseTextFile() {
  if (!fs.existsSync(FOLLOWERS_TXT_FILE)) {
    return null;
  }

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
}

function parseJsonFile() {
  if (!fs.existsSync(FOLLOWERS_JSON_FILE)) {
    return null;
  }

  const data = JSON.parse(fs.readFileSync(FOLLOWERS_JSON_FILE, 'utf-8'));
  if (!data.followers || !Array.isArray(data.followers)) {
    return null;
  }

  return data.followers;
}

function validateFollowers() {
  console.log('Validating followers configuration...\n');

  // 优先使用文本格式
  let followers = parseTextFile();
  const sourceFile = followers ? FOLLOWERS_TXT_FILE : FOLLOWERS_JSON_FILE;
  const sourceType = followers ? 'text' : 'JSON';

  // 如果文本格式不存在，尝试 JSON 格式（向后兼容）
  if (!followers) {
    try {
      followers = parseJsonFile();
    } catch (error) {
      console.error(`❌ Error: Invalid JSON format in ${FOLLOWERS_JSON_FILE}`);
      console.error(`   ${error.message}`);
      process.exit(1);
    }
  }

  // 检查文件是否存在
  if (!followers || followers.length === 0) {
    console.error(`❌ Error: No followers found!`);
    console.error(`\nPlease create ${FOLLOWERS_TXT_FILE} with the following format:`);
    console.error('');
    console.error('# 每行一个用户名');
    console.error('elonmusk,Elon Musk,Tech');
    console.error('jack,Jack Dorsey,Tech');
    console.error('# 或者简单格式');
    console.error('naval');
    console.error('VitalikButerin');
    process.exit(1);
  }

  // 验证每个关注者
  const errors = [];
  const usernames = new Set();

  followers.forEach((follower, index) => {
    if (!follower.username) {
      errors.push(`Follower at index ${index}: missing "username"`);
      return;
    }

    if (typeof follower.username !== 'string' || follower.username.trim() === '') {
      errors.push(`Follower at index ${index}: invalid "username"`);
      return;
    }

    // 检查重复用户名
    const username = follower.username.toLowerCase();
    if (usernames.has(username)) {
      errors.push(`Duplicate username: ${follower.username}`);
    }
    usernames.add(username);

    // 验证可选字段
    if (follower.displayName && typeof follower.displayName !== 'string') {
      errors.push(`Follower "${follower.username}": "displayName" must be a string`);
    }

    if (follower.group && typeof follower.group !== 'string') {
      errors.push(`Follower "${follower.username}": "group" must be a string`);
    }
  });

  if (errors.length > 0) {
    console.error('❌ Validation errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }

  // 成功
  console.log(`✅ ${sourceFile} is valid! (${sourceType} format)`);
  console.log(`\n   Total followers: ${followers.length}`);
  const groups = [...new Set(followers.map(f => f.group).filter(Boolean))];
  console.log(`   Groups: ${groups.length > 0 ? groups.join(', ') : 'None'}`);
  console.log(`\n   Followers:`);
  followers.forEach(f => {
    const group = f.group ? ` [${f.group}]` : '';
    console.log(`   - @${f.username}${group}`);
  });
  console.log(`\n   Note: displayName will be automatically fetched from tweet data`);
}

validateFollowers();
