import { useEffect, useMemo, useState, type ImgHTMLAttributes } from 'react'
import { buildImageFallbackChain } from '../utils/image'

interface SmartImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string
}

export function SmartImage({
  src,
  fallbackSrc,
  onError,
  ...props
}: SmartImageProps) {
  const fallbackChain = useMemo(
    () =>
      buildImageFallbackChain(
        typeof src === 'string' ? src : undefined,
        fallbackSrc
      ),
    [fallbackSrc, src]
  )
  const chainKey = fallbackChain.join('|')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    setCurrentIndex(0)
  }, [chainKey])

  const currentSrc = fallbackChain[currentIndex]

  return (
    <img
      {...props}
      src={currentSrc}
      onError={event => {
        if (currentIndex < fallbackChain.length - 1) {
          setCurrentIndex(currentIndex + 1)
        }
        onError?.(event)
      }}
    />
  )
}
