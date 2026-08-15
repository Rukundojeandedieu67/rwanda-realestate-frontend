import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <div className="mb-6 text-7xl font-black tracking-tight text-nzu-teal">404</div>
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-nzu-teal">Nzu</p>
      <h1 className="mt-3 text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-4 text-slate-600">The page you’re looking for doesn’t exist or may have moved.</p>
      <Link href="/" className="mt-6 inline-flex rounded-lg bg-nzu-terracotta px-4 py-2 font-semibold text-white hover:bg-nzu-terracotta-dark">
        Go home
      </Link>
    </div>
  )
}
