#!/usr/bin/env node
/**
 * Convert followers.txt to followers.json.
 *
 * This script runs during builds and converts the editable text format
 * into JSON for the frontend.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT_DIR, 'data')
const FOLLOWERS_TXT_FILE = path.join(DATA_DIR, 'followers.txt')
const FOLLOWERS_JSON_FILE = path.join(DATA_DIR, 'followers.json')

function parseTextFile() {
  if (!fs.existsSync(FOLLOWERS_TXT_FILE)) {
    console.warn(`⚠️  ${FOLLOWERS_TXT_FILE} not found, skipping...`)
    return null
  }

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
}

function buildFollowersJson() {
  console.log('Building followers.json from followers.txt...\n')

  const followers = parseTextFile()

  if (!followers) {
    console.warn(
      '⚠️  No followers found in text file, keeping existing JSON if exists'
    )
    return
  }

  // Ensure the data directory exists.
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  // Build the JSON payload.
  const jsonData = {
    followers: followers
  }

  // Write the generated JSON file.
  fs.writeFileSync(
    FOLLOWERS_JSON_FILE,
    JSON.stringify(jsonData, null, 2) + '\n',
    'utf-8'
  )

  console.log(`✅ Generated ${FOLLOWERS_JSON_FILE}`)
  console.log(`   Total followers: ${followers.length}`)
  console.log(
    `   Groups: ${[...new Set(followers.map(f => f.group).filter(Boolean))].join(', ') || 'None'}`
  )
}

buildFollowersJson()
