import { SunMoon, Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = [
      'light',
      'dark',
      'system'
    ]
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  return (
    <button
      onClick={cycleTheme}
      className="flex h-10 w-10 items-center justify-center border border-[var(--foreground)] bg-[var(--background)] transition-colors hover:bg-[var(--muted)]"
      aria-label={`Current theme: ${theme}`}
      title={`Theme: ${theme}`}
    >
      {theme === 'light' && <Sun className="w-5 h-5" />}
      {theme === 'dark' && <Moon className="w-5 h-5" />}
      {theme === 'system' && <SunMoon className="w-5 h-5" />}
    </button>
  )
}
