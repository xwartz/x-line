import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { MessageSquare } from 'lucide-react'
import type { Tweet } from '../types'
import { TweetCard } from './TweetCard'
import { TimelineSkeleton } from './TweetSkeleton'

interface TimelineProps {
  tweets: Tweet[]
  lastUpdated: Date | null
  isLoading: boolean
}

export function Timeline({ tweets, lastUpdated, isLoading }: TimelineProps) {
  return (
    <section className="w-full border-t border-[var(--foreground)]">
      <div className="flex flex-col gap-2 border-b border-[var(--border)] py-3 sm:flex-row sm:items-end sm:justify-between sm:py-4">
        <div>
          <p className="hidden [font-family:var(--font-sans)] text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)] sm:block">
            Timeline
          </p>
          <h2 className="[font-family:var(--font-display)] text-[24px] font-normal leading-none tracking-[-0.04em] sm:mt-2 sm:text-[32px]">
            Timeline
          </h2>
        </div>
        {lastUpdated && (
          <span className="[font-family:var(--font-sans)] text-xs tracking-[0.14em] text-[var(--muted-foreground)] sm:text-sm sm:normal-case sm:tracking-normal">
            <span className="sm:hidden">
              {formatDistanceToNow(lastUpdated, {
                addSuffix: true,
                locale: enUS
              })}
            </span>
            <span className="hidden sm:inline">
              Updated{' '}
              {formatDistanceToNow(lastUpdated, {
                addSuffix: true,
                locale: enUS
              })}
            </span>
          </span>
        )}
      </div>

      <div>
        {isLoading ? (
          <TimelineSkeleton count={10} />
        ) : tweets.length === 0 ? (
          <div className="px-4 py-20 text-center sm:px-0">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center border border-[var(--border)] bg-[var(--muted)]">
                <MessageSquare className="h-7 w-7 text-[var(--muted-foreground)]" />
              </div>
              <div>
                <h3 className="[font-family:var(--font-display)] text-2xl font-normal text-[var(--foreground)]">
                  No tweets yet
                </h3>
                <p className="mx-auto mt-2 max-w-md [font-family:var(--font-sans)] text-sm leading-6 text-[var(--muted-foreground)]">
                  Run the fetch script to load data.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--border)]">
              {tweets.map(tweet => (
                <TweetCard key={tweet.id} tweet={tweet} />
              ))}
            </div>
            <div className="border-t border-[var(--border)] py-4 text-center">
              <span className="[font-family:var(--font-sans)] text-xs tracking-[0.14em] text-[var(--muted-foreground)]">
                {tweets.length} tweets total
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
