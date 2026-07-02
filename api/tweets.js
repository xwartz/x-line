import { execFile } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, '..')
const STATIC_TWEETS_FILE = path.join(ROOT_DIR, 'data', 'tweets.json')
const SCRIPT_FILE = path.join(ROOT_DIR, 'scripts', 'fetch-tweets.mjs')
const RUNTIME_TWEETS_FILE = '/tmp/x-line-tweets.json'

const CACHE_TTL_MS = 3 * 60 * 1000
const FETCH_TIMEOUT_MS = 110 * 1000

let cachedPayload = null
let cachedAt = 0
let inFlightRefresh = null

function readJsonFile(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

function readFallbackPayload() {
  if (cachedPayload) {
    return cachedPayload
  }

  if (fs.existsSync(RUNTIME_TWEETS_FILE)) {
    return readJsonFile(RUNTIME_TWEETS_FILE)
  }

  return readJsonFile(STATIC_TWEETS_FILE)
}

async function refreshTweets() {
  const existingFile = fs.existsSync(RUNTIME_TWEETS_FILE)
    ? RUNTIME_TWEETS_FILE
    : STATIC_TWEETS_FILE

  await execFileAsync('node', [SCRIPT_FILE], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      MAX_PAGES_PER_USER: process.env.MAX_PAGES_PER_USER || '1',
      PAGE_DELAY_MS: process.env.PAGE_DELAY_MS || '250',
      USER_DELAY_MS: process.env.USER_DELAY_MS || '250',
      TWEETS_EXISTING_FILE: existingFile,
      TWEETS_OUTPUT_FILE: RUNTIME_TWEETS_FILE
    },
    maxBuffer: 20 * 1024 * 1024,
    timeout: FETCH_TIMEOUT_MS
  })

  const payload = readJsonFile(RUNTIME_TWEETS_FILE)
  cachedPayload = payload
  cachedAt = Date.now()
  return payload
}

async function getTweets(forceRefresh) {
  const isFresh = cachedPayload && Date.now() - cachedAt < CACHE_TTL_MS
  if (isFresh && !forceRefresh) {
    return cachedPayload
  }

  if (!inFlightRefresh) {
    inFlightRefresh = refreshTweets().finally(() => {
      inFlightRefresh = null
    })
  }

  return inFlightRefresh
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const forceRefresh = request.query?.refresh === '1'

  response.setHeader(
    'Cache-Control',
    'public, max-age=0, s-maxage=180, stale-while-revalidate=600'
  )

  try {
    const payload = await getTweets(forceRefresh)
    response.status(200).json(payload)
  } catch (error) {
    const fallbackPayload = readFallbackPayload()
    response.setHeader('X-X-Line-Fallback', '1')
    response.status(200).json({
      ...fallbackPayload,
      runtimeError:
        error instanceof Error ? error.message : 'Unable to refresh tweets'
    })
  }
}
