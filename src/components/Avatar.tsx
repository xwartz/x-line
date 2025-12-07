import { clsx } from 'clsx'

interface AvatarProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
}

const defaultAvatar =
  'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const dimension = sizeMap[size]
  const imageSrc = src || defaultAvatar

  return (
    <div
      className={clsx(
        'relative rounded-full overflow-hidden bg-[var(--muted)] avatar-hover flex-shrink-0',
        className
      )}
      style={{
        width: dimension,
        height: dimension,
        minWidth: dimension,
        minHeight: dimension,
      }}
    >
      <img
        src={imageSrc}
        alt={alt}
        width={dimension}
        height={dimension}
        className="object-cover w-full h-full block"
        loading="lazy"
        onError={e => {
          // Fallback to default avatar if image fails to load
          const target = e.target as HTMLImageElement
          if (target.src !== defaultAvatar) {
            target.src = defaultAvatar
          }
        }}
      />
    </div>
  )
}
