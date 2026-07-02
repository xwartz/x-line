# Follower Configuration

## Overview

The follower list is managed in `data/followers.txt` as editable text, then converted to `followers.json` by `build-followers.mjs` for frontend use.

## Data Flow

```
data/followers.txt (text format)
    ↓ scripts/build-followers.mjs
data/followers.json (generated JSON)
    ↓
api/tweets.js and scripts/fetch-tweets.mjs (read)
    ↓
src/hooks/useTweets.ts (loads /api/tweets, falls back to data/tweets.json)
src/config/followers.ts (imports followers.json)
```

## How to Use It

### Method 1: GitHub Web UI (Recommended)

1. Open [`data/followers.txt`](../../data/followers.txt)
2. Click the edit button
3. Update the text file with one username per line
4. After you commit the change, the deployed `/api/tweets` endpoint will use the updated follower list after the next deployment

### Method 2: GitHub Actions

1. Go to Actions → Manage Followers
2. Click Run workflow
3. Choose an action: `add` or `remove`
4. Enter the username and optional group
5. Run the workflow

### Method 3: Local Command Line

```bash
# Add a follower
pnpm run manage-followers add <username> [group]

# Remove a follower
pnpm run manage-followers remove <username>

# Validate the configuration
pnpm run validate-followers

# Build the generated JSON
pnpm run build-followers
```

## Text Format

`followers.txt` uses a simple text format:

```
# Comment lines start with # and are ignored
# Blank lines are ignored

# Simplest format (recommended)
username

# Grouped format (optional)
username,group

# Example
elonmusk
naval,Tech
VitalikButerin,Crypto
```

### Format Notes

- **Simple format**: `username` - username only
- **Grouped format**: `username,group` - username and group separated by a comma
- **Comments**: lines beginning with `#` are ignored
- **Blank lines**: ignored
- **displayName**: automatically derived from tweet data and does not need to be configured manually

## JSON Format

`followers.json` is generated automatically in this shape:

```json
{
  "followers": [
    {
      "username": "elonmusk"
    },
    {
      "username": "naval",
      "group": "Tech"
    }
  ]
}
```

### Field Reference

| Field         | Type   | Required | Description                              |
| ------------- | ------ | -------- | ---------------------------------------- |
| `username`    | string | ✅       | X username, without the `@` symbol       |
| `group`       | string | ❌       | Group name used for organization         |
| `displayName` | string | ❌       | Display name derived automatically       |

## GitHub Actions

### Runtime Tweet Refresh

The live site fetches tweet data from the Vercel `/api/tweets` function. The function keeps a short cache and merges newly fetched tweets with the bundled fallback snapshot.

### Fetch Tweets Workflow

The Fetch Tweets workflow is a manual fallback snapshot refresh. Use it when you want to update `data/tweets.json` in the repository, not for routine live refreshes.

- Manual run from the Actions page
- Updates `data/tweets.json` only when fetched data changes

### Manage Followers Workflow

Use this workflow to add or remove followers from the GitHub Web UI:

- Manual trigger: Actions → Manage Followers → Run workflow
- Action type: `add` or `remove`
- Automated steps: update the file, validate config, commit changes, and trigger tweet fetching

## Script Commands

```bash
# Manage followers
pnpm run manage-followers add <username> [group]
pnpm run manage-followers remove <username>

# Build followers.json
pnpm run build-followers

# Validate the configuration
pnpm run validate-followers

# Refresh the bundled fallback snapshot
pnpm run fetch-tweets
```

## Troubleshooting

### Format Errors

Run the validation script to inspect detailed errors:

```bash
pnpm run validate-followers
```

### GitHub Action Failures

1. Open the repository Actions page
2. Inspect the latest workflow run
3. Review the reported error details
