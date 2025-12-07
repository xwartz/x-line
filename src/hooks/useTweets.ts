import { useMemo } from 'react';
import tweetsData from '../../data/tweets.json';
import type { Tweet } from '../types';

interface TweetsDataType {
  lastUpdated: string;
  tweets: Tweet[];
}

export function useTweets() {
  const data = tweetsData as TweetsDataType;

  const tweets = useMemo(() => {
    return data.tweets.map((tweet) => ({
      ...tweet,
      publishedAt: new Date(tweet.publishedAt),
    }));
  }, [data.tweets]);

  return {
    tweets,
    lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : null,
    isLoading: false,
  };
}
