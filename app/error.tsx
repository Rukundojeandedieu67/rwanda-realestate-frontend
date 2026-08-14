"use client"

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="text-5xl mb-4">⚠️</div>
      <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
      <p className="text-gray-600 mb-6">We hit an unexpected error while loading this page.</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try again
      </button>
      {process.env.NODE_ENV !== 'production' && (
        <pre className="mt-6 text-left text-xs bg-red-50 text-red-700 p-3 rounded overflow-auto">
          {error.message}
        </pre>
      )}
    </div>
  )
}
