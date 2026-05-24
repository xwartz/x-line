// Tweet model
export interface Tweet {
  id: string
  username: string
  displayName: string
  avatar: string
  content: string
  contentHtml: string
  publishedAt: Date | string
  link: string

  // Attached media
  media?: TweetMedia[]

  // Repost metadata
  retweet?: {
    username: string
    displayName: string
  }

  // Quoted post
  quote?: {
    username: string
    displayName: string
    content: string
    contentHtml?: string
    link: string
    media?: TweetMedia[]
  }

  // Engagement metrics
  stats?: {
    replies: number
    retweets: number
    likes: number
  }
}

export interface TweetMedia {
  type: 'image' | 'video' | 'gif'
  url: string
  thumbnail?: string
  alt?: string
}

// Followed account configuration
export interface Follower {
  username: string
  displayName?: string
  avatar?: string
  group?: string
}
