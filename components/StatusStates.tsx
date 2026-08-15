export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center py-12" aria-live="polite">
      <div className="flex items-center gap-3 rounded-full border border-nzu-teal/20 bg-white px-4 py-3 text-sm font-medium text-nzu-teal shadow-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-nzu-teal/30 border-t-nzu-teal" />
        {label}
      </div>
    </div>
  )
}

export function ErrorAlert({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium">{message}</p>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 font-medium text-white transition hover:bg-red-700"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
      <p className="text-lg font-semibold text-slate-700">{title}</p>
      <p className="mt-2 text-sm">{description}</p>
    </div>
  )
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-48 animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  )
}

export function DashboardSectionSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
      <div className="h-20 animate-pulse rounded bg-slate-100" />
      <div className="h-20 animate-pulse rounded bg-slate-100" />
    </div>
  )
}
