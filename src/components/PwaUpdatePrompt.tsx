import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import { Button } from './Button'

export function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(
      _swUrl: string,
      registration: ServiceWorkerRegistration | undefined
    ) {
      if (!registration) {
        return
      }

      window.setInterval(
        () => {
          void registration.update()
        },
        60 * 60 * 1000
      )
    }
  })

  if (!offlineReady && !needRefresh) {
    return null
  }

  return (
    <div className="animate-panel-in fixed inset-x-4 bottom-20 z-50 mx-auto max-w-sm border border-[var(--foreground)] bg-[var(--background-elevated)] p-4 backdrop-blur-sm sm:bottom-6 sm:left-1/2 sm:w-full sm:-translate-x-1/2 sm:inset-x-auto">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]">
          <RefreshCw className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="[font-family:var(--font-sans)] text-[11px] font-bold tracking-[0.16em] text-[var(--muted-foreground)]">
            {needRefresh ? 'Update Ready' : 'Offline Ready'}
          </div>
          <p className="mt-2 text-[16px] leading-7 text-[var(--foreground)]">
            {needRefresh
              ? 'Refresh to apply the latest cached version.'
              : 'This version is now available offline.'}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {needRefresh ? (
              <Button size="sm" onClick={() => updateServiceWorker(true)}>
                Refresh now
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setOfflineReady(false)}
              >
                Dismiss
              </Button>
            )}

            {needRefresh && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setNeedRefresh(false)}
              >
                Later
              </Button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setOfflineReady(false)
            setNeedRefresh(false)
          }}
          className="interactive-control flex h-8 w-8 items-center justify-center border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          aria-label="Close PWA prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
