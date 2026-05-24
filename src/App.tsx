import { useCallback, useMemo } from 'react'
import { FollowerList } from './components/FollowerList'
import { Header } from './components/Header'
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt'
import { ScrollToTop } from './components/ScrollToTop'
import { Timeline } from './components/Timeline'
import { followers } from './config/followers'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useTweets } from './hooks/useTweets'

export function App() {
  const [selectedUsers, setSelectedUsers] = useLocalStorage<string[]>(
    'selectedUsers',
    []
  )
  const { tweets, lastUpdated, isLoading } = useTweets()

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

  // Filter tweets based on the selected sources.
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header />

      <main className="pb-24 pt-[4.75rem] sm:pb-16 sm:pt-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:gap-8 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-10">
            <aside className="xl:self-start">
              <FollowerList
                followers={followers}
                selectedUsers={selectedUsers}
                onToggleUser={handleToggleUser}
                tweets={tweets}
              />
            </aside>

            <div className="min-w-0">
              <Timeline
                tweets={filteredTweets}
                lastUpdated={lastUpdated}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 bg-[var(--footer-background)] text-[var(--footer-foreground-base)] sm:mt-16">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] lg:px-8 lg:py-12">
          <div>
            <p className="[font-family:var(--font-display)] text-3xl font-normal tracking-[-0.04em] sm:text-4xl">
              X-Line
            </p>
            <p className="mt-3 max-w-xl [font-family:var(--font-sans)] text-sm leading-6 text-[var(--footer-foreground)]">
              Data is aggregated from public Nitter instances, with the reading
              experience tuned for article links, quote context, and media.
            </p>
          </div>

          <div className="grid gap-2 [font-family:var(--font-sans)] text-sm leading-6 text-[var(--footer-foreground)]">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--footer-foreground-strong)]">
              Notes
            </span>
            <a
              href="https://github.com/zedeus/nitter"
              target="_blank"
              rel="noopener noreferrer"
              className="interactive-link w-fit text-[var(--footer-foreground-base)] transition-colors hover:text-[var(--footer-foreground)]"
            >
              Data source: Nitter
            </a>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      <ScrollToTop />
      <PwaUpdatePrompt />
    </div>
  )
}
