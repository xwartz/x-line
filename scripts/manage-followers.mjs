#!/usr/bin/env node
/**
 * 管理关注者列表脚本
 *
 * 使用方式:
 *   node scripts/manage-followers.mjs add <username> [group]
 *   node scripts/manage-followers.mjs remove <username>
 *
 * 此脚本用于添加或删除关注者，更新 followers.txt 文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const FOLLOWERS_TXT_FILE = path.join(DATA_DIR, 'followers.txt');

/**
 * 读取现有的关注者列表
 */
function readFollowers() {
  if (!fs.existsSync(FOLLOWERS_TXT_FILE)) {
    return {
      header: [],
      followers: [],
      comments: {},
    };
  }

  const content = fs.readFileSync(FOLLOWERS_TXT_FILE, 'utf-8');
  const lines = content.split('\n');
  const header = [];
  const followers = [];
  const comments = {};

  let currentSection = null;
  let lineIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 收集头部注释和空行
    if (i < 20 && (trimmed.startsWith('#') || trimmed === '')) {
      header.push(line);
      continue;
    }

    // 处理分组注释
    if (trimmed.startsWith('#') && trimmed.length > 1) {
      currentSection = trimmed.substring(1).trim();
      header.push(line);
      continue;
    }

    // 跳过空行
    if (trimmed === '') {
      header.push(line);
      continue;
    }

    // 解析关注者行
    if (!trimmed.startsWith('#')) {
      const parts = trimmed.split(',').map(p => p.trim());
      const username = parts[0];

      if (username) {
        followers.push({
          username: username.toLowerCase(),
          originalUsername: username, // 保留原始大小写
          group: parts[1] || null,
          lineIndex: lineIndex++,
        });

        // 记录分组注释
        if (currentSection) {
          comments[username.toLowerCase()] = currentSection;
        }
      }
    }
  }

  return { header, followers, comments };
}

/**
 * 写入关注者列表到文件
 */
function writeFollowers(header, followers, comments) {
  // 确保 data 目录存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const lines = [...header];
  const groupedFollowers = {};

  // 按分组组织关注者
  followers.forEach(f => {
    const group = f.group || 'default';
    if (!groupedFollowers[group]) {
      groupedFollowers[group] = [];
    }
    groupedFollowers[group].push(f);
  });

  // 写入分组和关注者
  const groups = Object.keys(groupedFollowers).sort();
  groups.forEach(group => {
    const groupFollowers = groupedFollowers[group];

    // 如果有分组注释，添加分组标题
    if (group !== 'default' && groupFollowers.length > 0) {
      const groupComment = `# ${group}`;
      if (!lines.some(l => l.trim() === groupComment)) {
        if (lines.length > 0 && lines[lines.length - 1].trim() !== '') {
          lines.push('');
        }
        lines.push(groupComment);
      }
    }

    // 写入该分组的关注者
    groupFollowers.forEach(f => {
      if (f.group) {
        lines.push(`${f.originalUsername},${f.group}`);
      } else {
        lines.push(f.originalUsername);
      }
    });
  });

  // 确保文件末尾有换行
  const content = lines.join('\n') + '\n';
  fs.writeFileSync(FOLLOWERS_TXT_FILE, content, 'utf-8');
}

/**
 * 添加关注者
 */
function addFollower(username, group = null) {
  if (!username || typeof username !== 'string') {
    throw new Error('Username is required');
  }

  const usernameLower = username.toLowerCase().trim();
  const { header, followers, comments } = readFollowers();

  // 检查是否已存在
  const existing = followers.find(f => f.username === usernameLower);
  if (existing) {
    // 如果提供了分组且不同，更新分组
    if (group && existing.group !== group) {
      existing.group = group;
      console.log(`✅ Updated @${username} group to "${group}"`);
    } else {
      console.log(`⚠️  @${username} already exists in the list`);
      return false;
    }
  } else {
    // 添加新关注者
    followers.push({
      username: usernameLower,
      originalUsername: username.trim(),
      group: group || null,
      lineIndex: followers.length,
    });
    console.log(`✅ Added @${username}${group ? ` to group "${group}"` : ''}`);
  }

  writeFollowers(header, followers, comments);
  return true;
}

/**
 * 删除关注者
 */
function removeFollower(username) {
  if (!username || typeof username !== 'string') {
    throw new Error('Username is required');
  }

  const usernameLower = username.toLowerCase().trim();
  const { header, followers, comments } = readFollowers();

  const index = followers.findIndex(f => f.username === usernameLower);
  if (index === -1) {
    console.log(`⚠️  @${username} not found in the list`);
    return false;
  }

  followers.splice(index, 1);
  console.log(`✅ Removed @${username} from the list`);

  writeFollowers(header, followers, comments);
  return true;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage:');
    console.error('  node scripts/manage-followers.mjs add <username> [group]');
    console.error('  node scripts/manage-followers.mjs remove <username>');
    process.exit(1);
  }

  const action = args[0].toLowerCase();
  const username = args[1];
  const group = args[2] || null;

  try {
    let changed = false;

    if (action === 'add') {
      changed = addFollower(username, group);
    } else if (action === 'remove') {
      changed = removeFollower(username);
    } else {
      console.error(`❌ Unknown action: ${action}`);
      console.error('Supported actions: add, remove');
      process.exit(1);
    }

    if (changed) {
      console.log(`\n✅ Successfully updated ${FOLLOWERS_TXT_FILE}`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
