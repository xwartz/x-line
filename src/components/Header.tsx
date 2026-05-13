import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-[var(--border)] bg-[var(--background-elevated)] backdrop-blur-sm">
      <div className="h-1 bg-[var(--foreground)] sm:h-2" />
      <div className="mx-auto grid h-14 max-w-[1400px] grid-cols-[auto_1fr_auto] items-center px-4 sm:h-[4.5rem] sm:grid-cols-[1fr_auto_1fr] sm:px-6 lg:px-8">
        <div className="hidden sm:block">
          <span className="[font-family:var(--font-sans)] text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            Editorial Feed
          </span>
        </div>

        <a href="/" className="justify-self-center no-underline">
          <span className="[font-family:var(--font-display)] text-[24px] font-normal tracking-[-0.05em] text-[var(--foreground)] sm:text-[34px]">
            X-Line
          </span>
        </a>

        <div className="flex items-center justify-self-end gap-2 sm:gap-3">
          <ThemeToggle />
          <a
            href="https://github.com/xwartz/x-line"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-10 min-w-10 items-center justify-center border border-[var(--foreground)] bg-[var(--background)] px-3 transition-colors duration-150 hover:bg-[var(--muted)] sm:flex"
            title="GitHub"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5 fill-[var(--foreground)]"
            >
              <path d="M12 0.5C5.372 0.5 0 5.873 0 12.5c0 5.303 3.438 9.8 8.205 11.387 0.6 0.111 0.82-0.26 0.82-0.577 0-0.285-0.01-1.04-0.016-2.04-3.338 0.725-4.042-1.61-4.042-1.61-0.546-1.386-1.333-1.755-1.333-1.755-1.09-0.745 0.082-0.729 0.082-0.729 1.204 0.085 1.838 1.236 1.838 1.236 1.07 1.835 2.807 1.305 3.492 0.998 0.108-0.775 0.418-1.305 0.762-1.605-2.665-0.303-5.467-1.332-5.467-5.93 0-1.31 0.468-2.382 1.235-3.222-0.123-0.304-0.535-1.524 0.117-3.176 0 0 1.008-0.322 3.3 1.23 0.957-0.266 1.983-0.399 3.003-0.404 1.02 0.005 2.046 0.138 3.004 0.404 2.29-1.552 3.296-1.23 3.296-1.23 0.654 1.652 0.242 2.872 0.12 3.176 0.77 0.84 1.233 1.912 1.233 3.222 0 4.61-2.807 5.624-5.48 5.921 0.43 0.37 0.814 1.103 0.814 2.222 0 1.605-0.014 2.898-0.014 3.293 0 0.32 0.216 0.694 0.825 0.576C20.565 22.296 24 17.8 24 12.5 24 5.873 18.627 0.5 12 0.5z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  )
}
