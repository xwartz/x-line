import { useEffect, useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { Filter, X } from 'lucide-react'
import { Avatar } from './Avatar'
import type { Follower, Tweet } from '../types'

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
  tweets = [],
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

  // 从推文数据中提取每个关注者的最新头像和显示名称
  const followerData = useMemo(() => {
    const avatarMap = new Map<string, string>()
    const displayNameMap = new Map<string, string>()

    // 按时间排序推文（最新的在前），为每个用户名记录最新的头像和显示名称
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

    // 遍历推文，为每个用户名记录最新的头像和显示名称
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

  // 获取关注者的头像，优先使用推文中的头像
  const getFollowerAvatar = (follower: Follower): string | undefined => {
    if (follower.avatar) {
      return follower.avatar
    }
    return followerData.avatarMap.get(follower.username.toLowerCase())
  }

  // 获取关注者的显示名称，优先使用配置中的，否则从推文中获取
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
    <div>
      <div className="hidden border-b border-[var(--border)] pb-4 xl:block">
        <div>
          <h3 className="[font-family:var(--font-sans)] text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            Sources
          </h3>
          <p className="mt-2 [font-family:var(--font-serif)] text-[18px] leading-7 text-[var(--foreground)]">
            按作者筛选时间线
          </p>
        </div>
      </div>

      <div className="mt-3 hidden [font-family:var(--font-sans)] text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] xl:block">
        {isAllSelected ? `全部 ${selectedCount}` : `已选 ${selectedCount}`}
      </div>

      <div className="hidden xl:block border-y border-[var(--border)] mt-4">
        <button
          onClick={() => onToggleUser('')}
          className={clsx(
            'flex w-full items-center gap-3 border-b border-[var(--border)] px-3 py-3 text-left transition-colors duration-150',
            isAllSelected
              ? 'bg-[var(--foreground)] text-[var(--background)]'
              : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]'
          )}
        >
          <div
            className={clsx(
              'flex h-11 w-11 flex-shrink-0 items-center justify-center border text-xs font-bold uppercase tracking-[0.16em] transition-colors duration-150 [font-family:var(--font-sans)]',
              isAllSelected
                ? 'border-[var(--background)] text-[var(--background)]'
                : 'border-[var(--border)] text-[var(--muted-foreground)]'
            )}
          >
            全
          </div>
          <div className="min-w-0 flex-1">
            <div className="[font-family:var(--font-sans)] text-sm font-bold uppercase tracking-[0.12em]">
              全部
            </div>
            <div
              className={clsx(
                '[font-family:var(--font-sans)] text-xs',
                isAllSelected
                  ? 'text-white/72'
                  : 'text-[var(--muted-foreground)]'
              )}
            >
              显示所有关注者的推文
            </div>
          </div>
          {isAllSelected && (
            <span className="ml-auto [font-family:var(--font-sans)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--background)]">
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
                'flex w-full items-center gap-3 border-b border-[var(--border)] px-3 py-3 text-left transition-colors duration-150 last:border-b-0',
                isSelected
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-[var(--background)] hover:bg-[var(--muted)]'
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
                <div className="truncate [font-family:var(--font-sans)] text-sm font-bold uppercase tracking-[0.1em]">
                  {getFollowerDisplayName(follower)}
                </div>
                <div
                  className={clsx(
                    'truncate [font-family:var(--font-sans)] text-xs',
                    isSelected
                      ? 'text-white/72'
                      : 'text-[var(--muted-foreground)]'
                  )}
                >
                  @{follower.username}
                </div>
              </div>
              {isSelected && (
                <span className="flex-shrink-0 [font-family:var(--font-sans)] text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--background)]">
                  已选
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
          className="fixed bottom-4 left-4 z-40 inline-flex h-12 items-center gap-2 border border-[var(--foreground)] bg-[var(--background)] px-4 [font-family:var(--font-sans)] text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)] shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-colors duration-150 hover:bg-[var(--muted)]"
          aria-label="打开作者筛选"
        >
          <Filter className="h-4 w-4" />
          <span>来源</span>
          <span className="border-l border-[var(--border)] pl-2 text-[var(--muted-foreground)]">
            {isAllSelected ? `全部 ${selectedCount}` : `已选 ${selectedCount}`}
          </span>
        </button>

        {isMobileDrawerOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]"
              onClick={() => setIsMobileDrawerOpen(false)}
              aria-label="关闭作者筛选"
            />

            <div className="fixed inset-x-0 bottom-0 z-[60] max-h-[78vh] overflow-hidden border-t border-[var(--foreground)] bg-[var(--background)]">
              <div className="mx-auto mt-3 h-1.5 w-12 bg-[var(--border)]" />

              <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-4 pb-4 pt-4">
                <div>
                  <div className="[font-family:var(--font-sans)] text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                    Sources
                  </div>
                  <div className="mt-2 [font-family:var(--font-serif)] text-[22px] leading-none text-[var(--foreground)]">
                    筛选作者
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex h-10 w-10 items-center justify-center border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  aria-label="关闭筛选抽屉"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 [font-family:var(--font-sans)] text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                <span>
                  {isAllSelected
                    ? `全部 ${selectedCount}`
                    : `已选 ${selectedCount}`}
                </span>
                {!isAllSelected && (
                  <button
                    type="button"
                    onClick={() => onToggleUser('')}
                    className="text-[var(--foreground)]"
                  >
                    清空
                  </button>
                )}
              </div>

              <div className="max-h-[calc(78vh-9.5rem)] overflow-y-auto px-4 pb-6 pt-3">
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleUser('')}
                    className={clsx(
                      'flex w-full items-center gap-3 border px-3 py-3 text-left transition-colors duration-150',
                      isAllSelected
                        ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                        : 'border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                    )}
                  >
                    <div
                      className={clsx(
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center border [font-family:var(--font-sans)] text-[11px] font-bold uppercase tracking-[0.14em]',
                        isAllSelected
                          ? 'border-[var(--background)] text-[var(--background)]'
                          : 'border-[var(--border)] text-[var(--muted-foreground)]'
                      )}
                    >
                      全
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="[font-family:var(--font-sans)] text-[11px] font-bold uppercase tracking-[0.14em]">
                        全部
                      </div>
                      <div
                        className={clsx(
                          'mt-1 [font-family:var(--font-sans)] text-xs',
                          isAllSelected
                            ? 'text-white/72'
                            : 'text-[var(--muted-foreground)]'
                        )}
                      >
                        显示所有来源
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
                          'flex w-full items-center gap-3 border px-3 py-3 text-left transition-colors duration-150',
                          isSelected
                            ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                            : 'border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]'
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
                          <div className="truncate [font-family:var(--font-sans)] text-[11px] font-bold uppercase tracking-[0.12em]">
                            {getFollowerDisplayName(follower)}
                          </div>
                          <div
                            className={clsx(
                              'mt-1 truncate [font-family:var(--font-sans)] text-xs',
                              isSelected
                                ? 'text-white/72'
                                : 'text-[var(--muted-foreground)]'
                            )}
                          >
                            @{follower.username}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="[font-family:var(--font-sans)] text-[11px] font-bold uppercase tracking-[0.14em]">
                            已选
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
