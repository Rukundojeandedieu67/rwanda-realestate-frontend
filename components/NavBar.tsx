"use client"
import Link from 'next/link'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import useAuth from '../src/hooks/useAuth'
import api from '../src/lib/api'

export default function NavBar() {
  const { user, loading, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    async function loadPendingCount() {
      if (user?.role !== 'admin') {
        setPendingCount(0)
        return
      }

      try {
        const response = await fetch('http://localhost:8000/api/admin/reviews/pending-count', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })
        if (!response.ok) throw new Error()
        const data = await response.json()
        setPendingCount(data.pending_count || 0)
      } catch {
        setPendingCount(0)
      }
    }

    if (!loading) {
      void loadPendingCount()
    }
  }, [loading, user?.role])

  const navItems = (() => {
    if (!user) {
      return [
        { label: 'Browse Properties', href: '/properties' },
        { label: 'Login', href: '/login' },
        { label: 'Register', href: '/register' },
      ]
    }

    if (user.role === 'buyer_renter') {
      return [
        { label: 'Browse Properties', href: '/properties' },
        { label: 'My Favorites', href: '/dashboard' },
        { label: 'Dashboard', href: '/dashboard' },
      ]
    }

    if (user.role === 'owner' || user.role === 'agent') {
      return [
        { label: 'My Properties', href: '/dashboard' },
        { label: 'Add Property', href: '/dashboard/properties/new' },
        { label: 'Dashboard', href: '/dashboard' },
      ]
    }

    if (user.role === 'superadmin') {
      return [
        { label: 'Super Admin', href: '/superadmin' },
        { label: 'Site Settings', href: '/superadmin/settings' },
        { label: 'User Management', href: '/superadmin/users' },
      ]
    }

    if (user.role === 'admin') return [
      { label: 'Pending Reviews', href: '/dashboard/reviews', badge: pendingCount },
      { label: 'Dashboard', href: '/dashboard' },
    ]

    return []
  })()

  function renderLink(item: { label: string; href: string; badge?: number }, index: number) {
    const isBadgeItem = typeof item.badge === 'number'
    return (
      <Link
        key={`${item.label}-${index}`}
        href={item.href}
        className="relative inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-nzu-cream"
      >
        <span>{item.label}</span>
        {isBadgeItem && item.badge > 0 && (
          <span className="inline-flex min-w-[1.2rem] items-center justify-center rounded-full bg-nzu-terracotta px-1.5 text-[10px] font-bold text-white">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  const renderDesktop = (
    <div className="hidden items-center gap-2 md:flex">
      {navItems.map(renderLink)}
      {user && (
        <>
          <span className="ml-2 border-l border-white/20 pl-3 text-sm text-nzu-cream">{user.name}</span>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-lg px-2.5 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-nzu-cream"
          >
            Logout
          </button>
        </>
      )}
    </div>
  )

  const renderMobile = (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Toggle navigation"
        onClick={() => setMobileOpen(prev => !prev)}
        className="rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-white/90"
      >
        Menu
      </button>
      {mobileOpen && (
        <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-nzu-teal/90 p-3">
          {navItems.map(renderLink)}
          {user && (
            <button
              type="button"
              onClick={() => logout()}
              className="mt-2 block w-full rounded-lg border border-white/20 px-3 py-2 text-left text-sm font-medium text-white/90"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <nav className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
      <Link href="/" className="flex items-center gap-3 text-lg font-bold text-white hover:text-nzu-cream">
        <Image src="/nzulogo.jpg" alt="Nzu logo" width={36} height={36} className="h-9 w-auto rounded-md object-cover" />
        <span>Nzu</span>
      </Link>

      {renderDesktop}
      {renderMobile}
    </nav>
  )
}
