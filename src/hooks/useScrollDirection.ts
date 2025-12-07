import { useState, useEffect } from 'react'

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

      // 检查是否在顶部
      setIsAtTop(scrollY < threshold)

      // 计算滚动方向
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

