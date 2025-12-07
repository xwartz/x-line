import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  MessageCircle,
  Repeat2,
  Heart,
  ExternalLink,
} from 'lucide-react';
import { Avatar } from './Avatar';
import type { Tweet } from '../types';

interface TweetCardProps {
  tweet: Tweet;
}

export function TweetCard({ tweet }: TweetCardProps) {
  const publishedDate = new Date(tweet.publishedAt);
  const timeAgo = formatDistanceToNow(publishedDate, {
    addSuffix: true,
    locale: zhCN,
  });

  // 格式化具体时间：年-月-日 时:分:秒 +时区
  const formattedTime = format(publishedDate, 'yyyy-MM-dd HH:mm:ss XX');

  return (
    <article className="px-4 py-6 sm:px-6 border-b border-[var(--border)] card-hover animate-fade-in transition-colors duration-150">
      {/* Retweet indicator */}
      {tweet.retweet && (
        <div className="flex items-center gap-2 mb-3 ml-14 text-xs text-[var(--muted-foreground)]">
          <Repeat2 className="w-3.5 h-3.5" />
          <span>{tweet.retweet.displayName} 转推了</span>
        </div>
      )}

      <div className="flex gap-4">
        {/* Avatar */}
        <a
          href={`https://x.com/${tweet.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0"
        >
          <Avatar src={tweet.avatar} alt={tweet.displayName} size="md" />
        </a>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <a
              href={`https://x.com/${tweet.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--foreground)] hover:underline truncate text-base leading-5"
            >
              {tweet.displayName}
            </a>
            <span className="text-[var(--muted-foreground)] text-sm leading-5">
              @{tweet.username}
            </span>
            <span className="text-[var(--muted-foreground)] text-sm leading-5">·</span>
            <a
              href={tweet.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--muted-foreground)] hover:text-[var(--accent)] text-sm leading-5 transition-colors"
              title={timeAgo}
            >
              {formattedTime}
            </a>
          </div>

          {/* Content */}
          <div className="mt-2 mb-3 tweet-content text-[var(--foreground)] text-[15px] leading-6">
            {tweet.content}
          </div>

          {/* Media */}
          {tweet.media && tweet.media.length > 0 && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--muted)]">
              <div
                className={`grid gap-1 ${
                  tweet.media.length === 1
                    ? 'grid-cols-1'
                    : tweet.media.length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-2'
                }`}
              >
                {tweet.media.slice(0, 4).map((media, index) => (
                  <a
                    key={index}
                    href={media.url || tweet.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`relative block overflow-hidden ${
                      tweet.media!.length === 3 && index === 0
                        ? 'row-span-2'
                        : ''
                    }`}
                  >
                    <img
                      src={media.thumbnail || media.url}
                      alt={media.alt || 'Tweet media'}
                      className="w-full h-full object-cover hover:opacity-95 transition-opacity duration-200"
                      style={{
                        maxHeight: tweet.media!.length === 1 ? '500px' : '200px',
                      }}
                      loading="lazy"
                    />
                    {(media.type === 'video' || media.type === 'gif') && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
                          <span className="text-white text-xs font-medium">
                            {media.type === 'video' ? '▶ Video' : 'GIF'}
                          </span>
                        </div>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Quote tweet */}
          {tweet.quote && (
            <a
              href={tweet.quote.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block p-4 border border-[var(--border)] rounded-2xl hover:bg-[var(--muted)] transition-colors duration-150"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm text-[var(--foreground)]">
                  {tweet.quote.displayName}
                </span>
                <span className="text-[var(--muted-foreground)] text-sm">
                  @{tweet.quote.username}
                </span>
              </div>
              {tweet.quote.content && (
                <p className="text-sm text-[var(--foreground)] leading-5 line-clamp-3">
                  {tweet.quote.content}
                </p>
              )}

              {/* Quote tweet media */}
              {tweet.quote.media && tweet.quote.media.length > 0 && (
                <div className="mt-3 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)]">
                  <div
                    className={`grid gap-1 ${
                      tweet.quote.media.length === 1
                        ? 'grid-cols-1'
                        : tweet.quote.media.length === 2
                        ? 'grid-cols-2'
                        : tweet.quote.media.length === 3
                        ? 'grid-cols-2'
                        : 'grid-cols-2'
                    }`}
                  >
                    {tweet.quote.media.map((media, i) => (
                      <div
                        key={i}
                        className={`relative ${
                          tweet.quote!.media!.length === 3 && i === 0 ? 'row-span-2' : ''
                        }`}
                        style={{
                          maxHeight: tweet.quote!.media!.length === 1 ? '300px' : '150px',
                        }}
                      >
                        <img
                          src={media.thumbnail || media.url}
                          alt={media.alt || ''}
                          className="w-full h-full object-cover"
                          style={{
                            maxHeight: tweet.quote!.media!.length === 1 ? '300px' : '150px',
                          }}
                          loading="lazy"
                        />
                        {(media.type === 'video' || media.type === 'gif') && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                              <span className="text-white text-xs font-medium">
                                {media.type === 'video' ? '▶' : 'GIF'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </a>
          )}

          {/* Actions */}
          <div className="flex items-center gap-8 mt-4 text-[var(--muted-foreground)]">
            {tweet.stats && (
              <>
                <button className="flex items-center gap-2 hover:text-[var(--accent)] transition-colors duration-150 group">
                  <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {tweet.stats.replies > 0 && (
                    <span className="text-sm">
                      {formatNumber(tweet.stats.replies)}
                    </span>
                  )}
                </button>
                <button className="flex items-center gap-2 hover:text-[var(--accent)] transition-colors duration-150 group">
                  <Repeat2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {tweet.stats.retweets > 0 && (
                    <span className="text-sm">
                      {formatNumber(tweet.stats.retweets)}
                    </span>
                  )}
                </button>
                <button className="flex items-center gap-2 hover:text-[var(--accent)] transition-colors duration-150 group">
                  <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {tweet.stats.likes > 0 && (
                    <span className="text-sm">
                      {formatNumber(tweet.stats.likes)}
                    </span>
                  )}
                </button>
              </>
            )}
            <a
              href={tweet.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[var(--accent)] transition-colors duration-150 ml-auto group"
            >
              <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
