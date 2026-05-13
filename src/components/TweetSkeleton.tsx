export function TweetSkeleton() {
  return (
    <div className="animate-pulse px-0 py-6 first:pt-8 sm:py-7">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-full skeleton flex-shrink-0" />

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-5 w-24 skeleton" />
            <div className="h-5 w-20 skeleton" />
            <div className="h-5 w-16 skeleton" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-full skeleton" />
            <div className="h-4 w-full skeleton" />
            <div className="h-4 w-3/4 skeleton" />
          </div>

          <div className="h-48 w-full skeleton" />

          <div className="flex items-center gap-8 mt-4">
            <div className="h-4 w-12 skeleton" />
            <div className="h-4 w-12 skeleton" />
            <div className="h-4 w-12 skeleton" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function TimelineSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-[var(--border)]">
      {Array.from({ length: count }).map((_, i) => (
        <TweetSkeleton key={i} />
      ))}
    </div>
  )
}
