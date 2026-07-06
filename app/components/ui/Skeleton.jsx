export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
}

export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-5 space-y-3">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function QuoteCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-8 w-28" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 max-w-3xl mx-auto px-4 py-10">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  )
}
