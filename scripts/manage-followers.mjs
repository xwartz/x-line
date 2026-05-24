#!/usr/bin/env node
/**
 * Script for managing followed accounts.
 *
 * Usage:
 *   node scripts/manage-followers.mjs add <username> [group]
 *   node scripts/manage-followers.mjs remove <username>
 *
 * Adds or removes followed accounts and updates followers.txt.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT_DIR, 'data')
const FOLLOWERS_TXT_FILE = path.join(DATA_DIR, 'followers.txt')

/**
 * Read the current follower list.
 */
function readFollowers() {
  if (!fs.existsSync(FOLLOWERS_TXT_FILE)) {
    return {
      header: [],
      followers: []
    }
  }

  const content = fs.readFileSync(FOLLOWERS_TXT_FILE, 'utf-8')
  const lines = content.split('\n')
  const header = []
  const followers = []

  let lineIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Collect leading comments and blank lines.
    if (i < 20 && (trimmed.startsWith('#') || trimmed === '')) {
      header.push(line)
      continue
    }

    // Preserve group header comments.
    if (trimmed.startsWith('#') && trimmed.length > 1) {
      header.push(line)
      continue
    }

    // Keep blank lines intact.
    if (trimmed === '') {
      header.push(line)
      continue
    }

    // Parse follower entries.
    if (!trimmed.startsWith('#')) {
      const parts = trimmed.split(',').map(p => p.trim())
      const username = parts[0]

      if (username) {
        followers.push({
          username: username.toLowerCase(),
          originalUsername: username, // Preserve original casing.
          group: parts[1] || null,
          lineIndex: lineIndex++
        })
      }
    }
  }

  return { header, followers }
}

/**
 * Write the follower list back to disk.
 */
function writeFollowers(header, followers) {
  // Ensure the data directory exists.
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  const lines = [...header]
  const groupedFollowers = {}

  // Organize followers by group.
  followers.forEach(f => {
    const group = f.group || 'default'
    if (!groupedFollowers[group]) {
      groupedFollowers[group] = []
    }
    groupedFollowers[group].push(f)
  })

  // Write groups and followers.
  const groups = Object.keys(groupedFollowers).sort()
  groups.forEach(group => {
    const groupFollowers = groupedFollowers[group]

    // Add a group title if needed.
    if (group !== 'default' && groupFollowers.length > 0) {
      const groupComment = `# ${group}`
      if (!lines.some(l => l.trim() === groupComment)) {
        if (lines.length > 0 && lines[lines.length - 1].trim() !== '') {
          lines.push('')
        }
        lines.push(groupComment)
      }
    }

    // Write the followers in this group.
    groupFollowers.forEach(f => {
      if (f.group) {
        lines.push(`${f.originalUsername},${f.group}`)
      } else {
        lines.push(f.originalUsername)
      }
    })
  })

  // Ensure the file ends with a trailing newline.
  const content = lines.join('\n') + '\n'
  fs.writeFileSync(FOLLOWERS_TXT_FILE, content, 'utf-8')
}

/**
 * Add a follower.
 */
function addFollower(username, group = null) {
  if (!username || typeof username !== 'string') {
    throw new Error('Username is required')
  }

  const usernameLower = username.toLowerCase().trim()
  const { header, followers } = readFollowers()

  // Check whether the account already exists.
  const existing = followers.find(f => f.username === usernameLower)
  if (existing) {
    // Update the group if a different one was provided.
    if (group && existing.group !== group) {
      existing.group = group
      console.log(`✅ Updated @${username} group to "${group}"`)
    } else {
      console.log(`⚠️  @${username} already exists in the list`)
      return false
    }
  } else {
    // Add a new follower.
    followers.push({
      username: usernameLower,
      originalUsername: username.trim(),
      group: group || null,
      lineIndex: followers.length
    })
    console.log(`✅ Added @${username}${group ? ` to group "${group}"` : ''}`)
  }

  writeFollowers(header, followers)
  return true
}

/**
 * Remove a follower.
 */
function removeFollower(username) {
  if (!username || typeof username !== 'string') {
    throw new Error('Username is required')
  }

  const usernameLower = username.toLowerCase().trim()
  const { header, followers } = readFollowers()

  const index = followers.findIndex(f => f.username === usernameLower)
  if (index === -1) {
    console.log(`⚠️  @${username} not found in the list`)
    return false
  }

  followers.splice(index, 1)
  console.log(`✅ Removed @${username} from the list`)

  writeFollowers(header, followers)
  return true
}

/**
 * Main entry point.
 */
function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('Usage:')
    console.error('  node scripts/manage-followers.mjs add <username> [group]')
    console.error('  node scripts/manage-followers.mjs remove <username>')
    process.exit(1)
  }

  const action = args[0].toLowerCase()
  const username = args[1]
  const group = args[2] || null

  try {
    let changed = false

    if (action === 'add') {
      changed = addFollower(username, group)
    } else if (action === 'remove') {
      changed = removeFollower(username)
    } else {
      console.error(`❌ Unknown action: ${action}`)
      console.error('Supported actions: add, remove')
      process.exit(1)
    }

    if (changed) {
      console.log(`\n✅ Successfully updated ${FOLLOWERS_TXT_FILE}`)
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
}

main()
