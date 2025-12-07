import { Github } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)] shadow-sm h-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-2.5 font-bold text-xl text-[var(--foreground)] hover:opacity-80 transition-opacity"
        >
          <Logo size={24} />
          <span className="sm:hidden">X</span>
        </a>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="https://github.com/xwartz/x-line"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors duration-150"
            title="GitHub"
          >
            <Github className="w-5 h-5 text-[var(--foreground)]" />
          </a>
        </div>
      </div>
    </header>
  );
}
