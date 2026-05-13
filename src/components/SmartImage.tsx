import { type ImgHTMLAttributes, useMemo, useState } from 'react'
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
  const [imageState, setImageState] = useState(() => ({
    chainKey,
    currentIndex: 0
  }))

  const currentIndex =
    imageState.chainKey === chainKey ? imageState.currentIndex : 0

  const currentSrc = fallbackChain[currentIndex]

  return (
    <img
      {...props}
      src={currentSrc}
      onError={event => {
        setImageState(previousState => {
          const nextIndex =
            previousState.chainKey === chainKey ? previousState.currentIndex : 0

          return {
            chainKey,
            currentIndex:
              nextIndex < fallbackChain.length - 1 ? nextIndex + 1 : nextIndex
          }
        })

        onError?.(event)
      }}
    />
  )
}
