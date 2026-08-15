"use client"

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mb-6 text-6xl">⚠️</div>
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-nzu-teal">Nzu</p>
      <h1 className="mt-3 text-3xl font-bold text-slate-900">Something went wrong</h1>
      <p className="mt-4 text-slate-600">We hit an unexpected issue while loading this page. Please try again.</p>
      <button
        onClick={() => reset()}
        className="mt-6 inline-flex rounded-lg bg-nzu-terracotta px-4 py-2 font-semibold text-white hover:bg-nzu-terracotta-dark"
      >
        Try again
      </button>
      {process.env.NODE_ENV !== 'production' && (
        <pre className="mt-6 overflow-auto rounded-xl bg-red-50 p-3 text-left text-xs text-red-700">
          {error.message}
        </pre>
      )}
    </div>
  )
}
