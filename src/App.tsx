import { useCallback, useMemo } from 'react'
import { Header } from './components/Header'
import { Timeline } from './components/Timeline'
import { FollowerList } from './components/FollowerList'
import { ScrollToTop } from './components/ScrollToTop'
import { useTweets } from './hooks/useTweets'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useScrollDirection } from './hooks/useScrollDirection'
import { followers } from './config/followers'
import { clsx } from 'clsx'

export function App() {
  const [selectedUsers, setSelectedUsers] = useLocalStorage<string[]>(
    'selectedUsers',
    []
  )
  const { tweets, lastUpdated, isLoading } = useTweets()
  const { scrollDirection, isAtTop } = useScrollDirection()
  const shouldShowFollowerList = isAtTop || scrollDirection === 'up'

  const handleToggleUser = useCallback(
    (username: string) => {
      if (!username) {
        setSelectedUsers([])
        return
      }

      setSelectedUsers(prev => {
        if (prev.includes(username)) {
          return prev.filter(u => u !== username)
        }
        return [...prev, username]
      })
    },
    [setSelectedUsers]
  )

  // 过滤推文
  const filteredTweets = useMemo(() => {
    if (selectedUsers.length === 0) {
      return tweets
    }
    const lowercaseSelected = selectedUsers.map(u => u.toLowerCase())
    return tweets.filter(tweet =>
      lowercaseSelected.includes(tweet.username.toLowerCase())
    )
  }, [tweets, selectedUsers])

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      {/* Left Sidebar - Fixed on desktop */}
      <aside className="hidden lg:block fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] border-r border-[var(--border)] bg-[var(--background)] overflow-y-auto z-10">
        <div className="p-4">
          <FollowerList
            followers={followers}
            selectedUsers={selectedUsers}
            onToggleUser={handleToggleUser}
            tweets={tweets}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="pt-16 lg:pl-64">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Follower filter - Fixed with scroll hide */}
          <div
            className={clsx(
              'lg:hidden fixed left-0 right-0 z-10 bg-[var(--background)]/95 backdrop-blur-md px-3 sm:px-4 pt-2 pb-1.5 border-b border-[var(--border)] transition-transform duration-300 ease-in-out',
              shouldShowFollowerList
                ? 'translate-y-0 top-16'
                : '-translate-y-full top-16'
            )}
          >
            <FollowerList
              followers={followers}
              selectedUsers={selectedUsers}
              onToggleUser={handleToggleUser}
              tweets={tweets}
            />
          </div>

          {/* Content with mobile top spacing */}
          <div className="lg:pt-4 pt-4 pb-8">
            {/* Timeline */}
            <Timeline
              tweets={filteredTweets}
              lastUpdated={lastUpdated}
              isLoading={isLoading}
            />

            {/* Footer */}
            <footer className="border-t border-[var(--border)] mt-8 mb-8 pt-8">
              <div className="text-center">
                <p className="text-sm text-[var(--muted-foreground)] mb-2">
                  一个简洁优雅的 X 时间线聚合器
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  数据来源于{' '}
                  <a
                    href="https://github.com/zedeus/nitter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:underline transition-colors"
                  >
                    Nitter
                  </a>{' '}
                  公开实例
                </p>
              </div>
            </footer>
          </div>
        </div>
      </main>

      {/* Scroll to top button */}
      <ScrollToTop />
    </div>
  )
}
