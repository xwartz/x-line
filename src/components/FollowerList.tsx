import { useMemo } from 'react'
import { clsx } from 'clsx'
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
  const isAllSelected = selectedUsers.length === 0

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
      {/* Desktop: Title */}
      <h3 className="hidden lg:block text-sm font-semibold text-[var(--muted-foreground)] mb-4 uppercase tracking-wide lg:mb-6">
        关注者
      </h3>
      {/* Desktop: Vertical layout */}
      <div className="hidden lg:flex flex-col gap-2">
        {/* All button */}
        <button
          onClick={() => onToggleUser('')}
          className={clsx(
            'flex items-center gap-3 p-3 rounded-xl transition-all duration-150 text-left w-full',
            isAllSelected
              ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
              : 'hover:bg-[var(--muted)] text-[var(--muted-foreground)]'
          )}
        >
          <div
            className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-150 flex-shrink-0',
              isAllSelected
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
            )}
          >
            全
          </div>
          <span className="text-sm font-medium">全部</span>
          {isAllSelected && (
            <span className="ml-auto text-xs text-[var(--accent)]">
              {followers.length}
            </span>
          )}
        </button>

        {/* User avatars */}
        {followers.map(follower => {
          const isSelected = selectedUsers.includes(follower.username)
          return (
            <button
              key={follower.username}
              onClick={() => onToggleUser(follower.username)}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-xl transition-all duration-150 text-left w-full',
                isSelected ? 'bg-[var(--accent)]/10' : 'hover:bg-[var(--muted)]'
              )}
            >
              <div
                className={clsx(
                  'rounded-full transition-all duration-150 flex-shrink-0',
                  isSelected &&
                    'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)] shadow-sm'
                )}
              >
                <Avatar
                  src={getFollowerAvatar(follower)}
                  alt={follower.displayName || follower.username}
                  size="md"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {getFollowerDisplayName(follower)}
                </div>
                <div className="text-xs text-[var(--muted-foreground)] truncate">
                  @{follower.username}
                </div>
              </div>
              {isSelected && (
                <span className="text-xs text-[var(--accent)] flex-shrink-0 font-semibold">
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>
      {/* Mobile: Compact horizontal scroll layout */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2 lg:hidden snap-x snap-mandatory">
        {/* All button */}
        <button
          onClick={() => onToggleUser('')}
          className={clsx(
            'flex flex-col items-center gap-1 min-w-[52px] p-1.5 rounded-lg transition-all duration-150 flex-shrink-0 snap-start active:scale-95',
            isAllSelected
              ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
              : 'hover:bg-[var(--muted)] active:bg-[var(--muted)] text-[var(--muted-foreground)]'
          )}
        >
          <div
            className={clsx(
              'w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-150 flex-shrink-0',
              isAllSelected
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
            )}
          >
            全
          </div>
          <span className="text-[9px] font-medium truncate w-full text-center leading-tight">
            全部
          </span>
        </button>

        {/* User avatars */}
        {followers.map(follower => {
          const isSelected = selectedUsers.includes(follower.username)
          return (
            <button
              key={follower.username}
              onClick={() => onToggleUser(follower.username)}
              className={clsx(
                'flex flex-col items-center gap-1 min-w-[52px] p-1.5 rounded-lg transition-all duration-150 flex-shrink-0 snap-start active:scale-95',
                isSelected
                  ? 'bg-[var(--accent)]/10'
                  : 'hover:bg-[var(--muted)] active:bg-[var(--muted)]'
              )}
            >
              <div
                className={clsx(
                  'flex-shrink-0 transition-all duration-150 inline-flex items-center justify-center',
                  isSelected &&
                    'ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--background)] shadow-sm rounded-full'
                )}
              >
                <Avatar
                  src={getFollowerAvatar(follower)}
                  alt={follower.displayName || follower.username}
                  size="sm"
                />
              </div>
              <span className="text-[9px] font-medium truncate max-w-[52px] text-center leading-tight">
                {getFollowerDisplayName(follower)}
              </span>
              {isSelected && (
                <span className="text-[8px] text-[var(--accent)] font-bold mt-[-2px]">
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
