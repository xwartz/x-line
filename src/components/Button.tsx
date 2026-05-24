import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'interactive-control inline-flex items-center justify-center border [font-family:var(--font-sans)] font-bold uppercase tracking-[0.16em] transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-2 focus:ring-offset-[var(--background)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]':
            variant === 'primary',
          'border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]':
            variant === 'secondary',
          'border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:border-[var(--foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]':
            variant === 'ghost',
          'h-10 px-4 text-[11px]': size === 'sm',
          'h-11 px-5 text-xs': size === 'md',
          'h-12 px-6 text-sm': size === 'lg'
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
