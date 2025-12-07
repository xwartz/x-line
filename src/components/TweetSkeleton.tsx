export function TweetSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6 border-b border-[var(--border)] animate-pulse">
      <div className="flex gap-4">
        {/* Avatar skeleton */}
        <div className="w-12 h-12 rounded-full skeleton flex-shrink-0" />

        <div className="flex-1 space-y-3">
          {/* Header skeleton */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-5 w-24 skeleton rounded" />
            <div className="h-5 w-20 skeleton rounded" />
            <div className="h-5 w-16 skeleton rounded" />
          </div>

          {/* Content skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-full skeleton rounded" />
            <div className="h-4 w-full skeleton rounded" />
            <div className="h-4 w-3/4 skeleton rounded" />
          </div>

          {/* Media skeleton (optional) */}
          <div className="h-48 w-full skeleton rounded-2xl" />

          {/* Actions skeleton */}
          <div className="flex items-center gap-8 mt-4">
            <div className="h-4 w-12 skeleton rounded" />
            <div className="h-4 w-12 skeleton rounded" />
            <div className="h-4 w-12 skeleton rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TimelineSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-[var(--border)]">
      {Array.from({ length: count }).map((_, i) => (
        <TweetSkeleton key={i} />
      ))}
    </div>
  );
}
