import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Check window scroll position
      if (window.scrollY > 400) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    // Listen to window scroll
    window.addEventListener('scroll', toggleVisibility, { passive: true })

    // Initial check
    toggleVisibility()

    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-5 right-4 z-50 flex h-11 w-11 items-center justify-center border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] transition-colors duration-200 hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-2 sm:bottom-8 sm:right-8"
      aria-label="滚动到顶部"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}
