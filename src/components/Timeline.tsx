import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';
import { TweetCard } from './TweetCard';
import { TimelineSkeleton } from './TweetSkeleton';
import type { Tweet } from '../types';

interface TimelineProps {
  tweets: Tweet[];
  lastUpdated: Date | null;
  isLoading: boolean;
}

export function Timeline({ tweets, lastUpdated, isLoading }: TimelineProps) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">时间线</h2>
          {lastUpdated && (
            <span className="text-sm text-[var(--muted-foreground)]">
              更新于{' '}
              {formatDistanceToNow(lastUpdated, {
                addSuffix: true,
                locale: zhCN,
              })}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div>
        {isLoading ? (
          <TimelineSkeleton count={10} />
        ) : tweets.length === 0 ? (
          <div className="py-24 px-4 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-[var(--muted-foreground)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  暂无推文
                </h3>
                <p className="text-[var(--muted-foreground)] text-sm leading-6 max-w-md mx-auto">
                  请运行脚本获取数据
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-0">
              {tweets.map((tweet) => (
                <TweetCard key={tweet.id} tweet={tweet} />
              ))}
            </div>
            <div className="py-8 text-center">
              <p className="text-xs text-[var(--muted-foreground)]">
                已显示 {tweets.length} 条推文
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
