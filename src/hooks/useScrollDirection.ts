import { useEffect, useState } from 'react'

interface UseScrollDirectionOptions {
  threshold?: number
  initialDirection?: 'up' | 'down'
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 10, initialDirection = 'up' } = options
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>(
    initialDirection
  )
  const [isAtTop, setIsAtTop] = useState(true)

  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    const updateScrollDirection = () => {
      const scrollY = window.scrollY

      // Check whether the viewport is still near the top.
      setIsAtTop(scrollY < threshold)

      // Determine the current scroll direction.
      const direction = scrollY > lastScrollY ? 'down' : 'up'
      if (
        direction !== scrollDirection &&
        Math.abs(scrollY - lastScrollY) > threshold
      ) {
        setScrollDirection(direction)
      }
      lastScrollY = scrollY > 0 ? scrollY : 0
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    updateScrollDirection()

    return () => window.removeEventListener('scroll', onScroll)
  }, [scrollDirection, threshold])

  return { scrollDirection, isAtTop }
}
