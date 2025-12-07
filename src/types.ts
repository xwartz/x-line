// 推文类型
export interface Tweet {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  content: string;
  contentHtml: string;
  publishedAt: Date | string;
  link: string;

  // 媒体内容
  media?: TweetMedia[];

  // 转推信息
  retweet?: {
    username: string;
    displayName: string;
  };

  // 引用推文
  quote?: {
    username: string;
    displayName: string;
    content: string;
    link: string;
    media?: TweetMedia[];
  };

  // 统计数据
  stats?: {
    replies: number;
    retweets: number;
    likes: number;
  };
}

export interface TweetMedia {
  type: 'image' | 'video' | 'gif';
  url: string;
  thumbnail?: string;
  alt?: string;
}

// 关注者配置
export interface Follower {
  username: string;
  displayName?: string;
  avatar?: string;
  group?: string;
}
