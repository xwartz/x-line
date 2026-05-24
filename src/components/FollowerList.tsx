import { clsx } from 'clsx'
import { Filter, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Follower, Tweet } from '../types'
import { Avatar } from './Avatar'

interface FollowerListProps {
  followers: Follower[]
  selectedUsers: string[]
  onToggleUser: (username: string) => void
  tweets?: Tweet[]
}

export function FollowerList({
  followers,
  selectedUsers,
  onToggleUser,
  tweets = []
}: FollowerListProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const isAllSelected = selectedUsers.length === 0
  const selectedCount = isAllSelected ? followers.length : selectedUsers.length

  useEffect(() => {
    if (!isMobileDrawerOpen) {
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [isMobileDrawerOpen])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1280px)')
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMobileDrawerOpen(false)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Derive the latest avatar and display name for each followed account.
  const followerData = useMemo(() => {
    const avatarMap = new Map<string, string>()
    const displayNameMap = new Map<string, string>()

    // Sort newest first so the freshest profile metadata wins.
    const sortedTweets = [...tweets].sort((a, b) => {
      const dateA =
        typeof a.publishedAt === 'string'
          ? new Date(a.publishedAt)
          : a.publishedAt
      const dateB =
        typeof b.publishedAt === 'string'
          ? new Date(b.publishedAt)
          : b.publishedAt
      return dateB.getTime() - dateA.getTime()
    })

    // Store the first avatar and display name seen for each username.
    for (const tweet of sortedTweets) {
      const username = tweet.username.toLowerCase()
      if (!avatarMap.has(username) && tweet.avatar) {
        avatarMap.set(username, tweet.avatar)
      }
      if (!displayNameMap.has(username) && tweet.displayName) {
        displayNameMap.set(username, tweet.displayName)
      }
    }

    return { avatarMap, displayNameMap }
  }, [tweets])

  // Prefer the configured avatar, then fall back to tweet-derived profile data.
  const getFollowerAvatar = (follower: Follower): string | undefined => {
    if (follower.avatar) {
      return follower.avatar
    }
    return followerData.avatarMap.get(follower.username.toLowerCase())
  }

  // Prefer the configured display name, then fall back to tweet-derived data.
  const getFollowerDisplayName = (follower: Follower): string => {
    if (follower.displayName) {
      return follower.displayName
    }
    return (
      followerData.displayNameMap.get(follower.username.toLowerCase()) ||
      follower.username
    )
  }

  return (
    <div className="xl:fixed xl:left-[max(2rem,calc(50vw-700px+2rem))] xl:top-28 xl:w-[280px] xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto xl:overscroll-contain">
      <div className="hidden border-b border-[var(--border)] pb-4 xl:block">
        <div>
          <h3 className="[font-family:var(--font-sans)] text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            Sources
          </h3>
          <p className="mt-2 [font-family:var(--font-serif)] text-[18px] leading-7 text-[var(--foreground)]">
            Filter the timeline by source
          </p>
        </div>
      </div>

      <div className="mt-3 hidden [font-family:var(--font-sans)] text-xs tracking-[0.14em] text-[var(--muted-foreground)] xl:block">
        {isAllSelected ? `All ${selectedCount}` : `Selected ${selectedCount}`}
      </div>

      <div className="hidden xl:block border-y border-[var(--border)] mt-4">
        <button
          onClick={() => onToggleUser('')}
          className={clsx(
            'interactive-control flex w-full items-center gap-3 border-b border-[var(--border)] px-3 py-3 text-left transition-colors duration-150',
            isAllSelected
              ? 'bg-[var(--foreground)] text-[var(--background)]'
              : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
          )}
        >
          <div
            className={clsx(
              'flex h-11 w-11 flex-shrink-0 items-center justify-center border text-xs font-bold tracking-[0.16em] transition-colors duration-150 [font-family:var(--font-sans)]',
              isAllSelected
                ? 'border-[var(--background)] text-[var(--background)]'
                : 'border-[var(--border)] text-[var(--muted-foreground)]'
            )}
          >
            All
          </div>
          <div className="min-w-0 flex-1">
            <div className="[font-family:var(--font-sans)] text-sm font-bold tracking-[0.12em]">
              All
            </div>
            <div
              className={clsx(
                '[font-family:var(--font-sans)] text-xs',
                isAllSelected
                  ? 'text-[var(--inverted-muted-foreground)]'
                  : 'text-[var(--muted-foreground)]'
              )}
            >
              Show tweets from every source
            </div>
          </div>
          {isAllSelected && (
            <span className="ml-auto [font-family:var(--font-sans)] text-xs font-bold tracking-[0.14em] text-[var(--background)]">
              {followers.length}
            </span>
          )}
        </button>

        {followers.map(follower => {
          const isSelected = selectedUsers.includes(follower.username)
          return (
            <button
              key={follower.username}
              onClick={() => onToggleUser(follower.username)}
              className={clsx(
                'interactive-control flex w-full items-center gap-3 border-b border-[var(--border)] px-3 py-3 text-left transition-colors duration-150 last:border-b-0',
                isSelected
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-[var(--background)] hover:bg-[var(--surface-hover)]'
              )}
            >
              <div className="flex-shrink-0">
                <Avatar
                  src={getFollowerAvatar(follower)}
                  alt={follower.displayName || follower.username}
                  size="md"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate [font-family:var(--font-sans)] text-sm font-bold tracking-[0.1em]">
                  {getFollowerDisplayName(follower)}
                </div>
                <div
                  className={clsx(
                    'truncate [font-family:var(--font-sans)] text-xs',
                    isSelected
                      ? 'text-[var(--inverted-muted-foreground)]'
                      : 'text-[var(--muted-foreground)]'
                  )}
                >
                  @{follower.username}
                </div>
              </div>
              {isSelected && (
                <span className="flex-shrink-0 [font-family:var(--font-sans)] text-[11px] font-bold tracking-[0.14em] text-[var(--background)]">
                  Selected
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="xl:hidden">
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="interactive-control fixed bottom-4 left-4 z-40 inline-flex h-12 items-center gap-2 border border-[var(--foreground)] bg-[var(--background-elevated)] px-4 [font-family:var(--font-sans)] text-[11px] font-bold tracking-[0.16em] text-[var(--foreground)] backdrop-blur-sm transition-colors duration-150 hover:bg-[var(--surface-hover)]"
          aria-label="Open source filters"
        >
          <Filter className="h-4 w-4" />
          <span>Sources</span>
          <span className="border-l border-[var(--border)] pl-2 text-[var(--muted-foreground)]">
            {isAllSelected
              ? `All ${selectedCount}`
              : `Selected ${selectedCount}`}
          </span>
        </button>

        {isMobileDrawerOpen && (
          <>
            <button
              type="button"
              className="animate-fade-in fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-[2px]"
              onClick={() => setIsMobileDrawerOpen(false)}
              aria-label="Close source filters"
            />

            <div className="animate-panel-in fixed inset-x-0 bottom-0 z-[60] max-h-[78vh] overflow-hidden border-t border-[var(--foreground)] bg-[var(--background)]">
              <div className="mx-auto mt-3 h-1.5 w-12 bg-[var(--border)]" />

              <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-4 pb-4 pt-4">
                <div>
                  <div className="[font-family:var(--font-sans)] text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Sources
                  </div>
                  <div className="mt-2 [font-family:var(--font-serif)] text-[22px] leading-none text-[var(--foreground)]">
                    Filter sources
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="interactive-control flex h-10 w-10 items-center justify-center border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                  aria-label="Close source filter drawer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 [font-family:var(--font-sans)] text-[11px] font-bold tracking-[0.14em] text-[var(--muted-foreground)]">
                <span>
                  {isAllSelected
                    ? `All ${selectedCount}`
                    : `Selected ${selectedCount}`}
                </span>
                {!isAllSelected && (
                  <button
                    type="button"
                    onClick={() => onToggleUser('')}
                    className="interactive-link text-[var(--foreground)] underline-offset-4 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="max-h-[calc(78vh-9.5rem)] overflow-y-auto px-4 pb-6 pt-3">
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleUser('')}
                    className={clsx(
                      'interactive-control flex w-full items-center gap-3 border px-3 py-3 text-left transition-colors duration-150',
                      isAllSelected
                        ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                        : 'border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                    )}
                  >
                    <div
                      className={clsx(
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center border [font-family:var(--font-sans)] text-[11px] font-bold tracking-[0.14em]',
                        isAllSelected
                          ? 'border-[var(--background)] text-[var(--background)]'
                          : 'border-[var(--border)] text-[var(--muted-foreground)]'
                      )}
                    >
                      All
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="[font-family:var(--font-sans)] text-[11px] font-bold tracking-[0.14em]">
                        All
                      </div>
                      <div
                        className={clsx(
                          'mt-1 [font-family:var(--font-sans)] text-xs',
                          isAllSelected
                            ? 'text-[var(--inverted-muted-foreground)]'
                            : 'text-[var(--muted-foreground)]'
                        )}
                      >
                        Show all sources
                      </div>
                    </div>
                  </button>

                  {followers.map(follower => {
                    const isSelected = selectedUsers.includes(follower.username)
                    return (
                      <button
                        key={follower.username}
                        type="button"
                        onClick={() => onToggleUser(follower.username)}
                        className={clsx(
                          'interactive-control flex w-full items-center gap-3 border px-3 py-3 text-left transition-colors duration-150',
                          isSelected
                            ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                            : 'border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                        )}
                      >
                        <div className="flex-shrink-0">
                          <Avatar
                            src={getFollowerAvatar(follower)}
                            alt={follower.displayName || follower.username}
                            size="sm"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate [font-family:var(--font-sans)] text-[11px] font-bold tracking-[0.12em]">
                            {getFollowerDisplayName(follower)}
                          </div>
                          <div
                            className={clsx(
                              'mt-1 truncate [font-family:var(--font-sans)] text-xs',
                              isSelected
                                ? 'text-[var(--inverted-muted-foreground)]'
                                : 'text-[var(--muted-foreground)]'
                            )}
                          >
                            @{follower.username}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="[font-family:var(--font-sans)] text-[11px] font-bold tracking-[0.14em]">
                            Selected
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
