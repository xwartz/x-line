import { useEffect, useMemo, useState } from 'react'
import tweetsData from '../../data/tweets.json'
import type { Tweet } from '../types'

interface TweetsDataType {
  lastUpdated: string
  tweets: Tweet[]
}

const FALLBACK_TWEETS_DATA = tweetsData as TweetsDataType
const REFRESH_INTERVAL_MS = 3 * 60 * 1000

export function useTweets() {
  const [remoteData, setRemoteData] = useState<TweetsDataType | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const data = remoteData || FALLBACK_TWEETS_DATA

  useEffect(() => {
    let isMounted = true

    async function loadTweets() {
      setIsRefreshing(true)

      try {
        const response = await fetch('/api/tweets', {
          headers: {
            Accept: 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to load tweets: ${response.status}`)
        }

        const nextData = (await response.json()) as TweetsDataType
        if (isMounted && Array.isArray(nextData.tweets)) {
          setRemoteData(nextData)
        }
      } catch {
        // Keep the bundled snapshot visible when runtime refresh fails.
      } finally {
        if (isMounted) {
          setIsRefreshing(false)
        }
      }
    }

    loadTweets()

    const refreshInterval = window.setInterval(loadTweets, REFRESH_INTERVAL_MS)

    return () => {
      isMounted = false
      window.clearInterval(refreshInterval)
    }
  }, [])

  const tweets = useMemo(() => {
    return data.tweets.map(tweet => ({
      ...tweet,
      publishedAt: new Date(tweet.publishedAt)
    }))
  }, [data.tweets])

  return {
    tweets,
    lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : null,
    isLoading: isRefreshing && data.tweets.length === 0
  }
}
