import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="text-6xl mb-4">404</div>
      <h1 className="text-3xl font-bold mb-2">Page not found</h1>
      <p className="text-gray-600 mb-6">The page you’re looking for doesn’t exist or may have been moved.</p>
      <Link href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Go home
      </Link>
    </div>
  )
}
