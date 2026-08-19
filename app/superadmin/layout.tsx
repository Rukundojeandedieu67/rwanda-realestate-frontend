"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import useAuth from '../../src/hooks/useAuth'
import { PageLoader } from '../../components/StatusStates'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && user?.role !== 'superadmin') router.replace('/login')
  }, [loading, user, router])

  if (loading) return <PageLoader label="Checking Super Admin access..." />
  if (user?.role !== 'superadmin') return null

  return (
    <div className="-mx-4 min-h-[calc(100vh-5rem)] bg-slate-950 px-4 py-6 text-slate-100 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 border-b border-amber-300/20 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">Restricted area</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Super Admin</h1>
            <p className="mt-1 text-sm text-slate-400">Site-wide controls and delegation</p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm" aria-label="Super Admin navigation">
            {[['/superadmin', 'Overview'], ['/superadmin/settings', 'Site Settings'], ['/superadmin/users', 'User Management']].map(([href, label]) => (
              <Link key={href} href={href} className={`rounded-lg px-3 py-2 font-semibold transition ${pathname === href ? 'bg-amber-300 text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
        {children}
      </div>
    </div>
  )
}