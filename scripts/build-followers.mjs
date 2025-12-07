#!/usr/bin/env node
/**
 * 将 followers.txt 转换为 followers.json
 *
 * 此脚本在构建时自动运行，将简单的文本格式转换为 JSON 格式
 * 以便前端代码使用
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const FOLLOWERS_TXT_FILE = path.join(DATA_DIR, 'followers.txt');
const FOLLOWERS_JSON_FILE = path.join(DATA_DIR, 'followers.json');

function parseTextFile() {
  if (!fs.existsSync(FOLLOWERS_TXT_FILE)) {
    console.warn(`⚠️  ${FOLLOWERS_TXT_FILE} not found, skipping...`);
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

function buildFollowersJson() {
  console.log('Building followers.json from followers.txt...\n');

  const followers = parseTextFile();

  if (!followers) {
    console.warn('⚠️  No followers found in text file, keeping existing JSON if exists');
    return;
  }

  // 确保 data 目录存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 生成 JSON
  const jsonData = {
    followers: followers,
  };

  // 写入 JSON 文件
  fs.writeFileSync(
    FOLLOWERS_JSON_FILE,
    JSON.stringify(jsonData, null, 2) + '\n',
    'utf-8'
  );

  console.log(`✅ Generated ${FOLLOWERS_JSON_FILE}`);
  console.log(`   Total followers: ${followers.length}`);
  console.log(`   Groups: ${[...new Set(followers.map(f => f.group).filter(Boolean))].join(', ') || 'None'}`);
}

buildFollowersJson();
