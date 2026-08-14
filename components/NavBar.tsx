"use client"
import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import useAuth from '../src/hooks/useAuth'

export default function NavBar() {
  const { user, loading, logout } = useAuth()

  return (
    <nav className="flex items-center justify-between py-3">
      <Link href="/" className="flex items-center gap-3 text-lg font-bold text-white hover:text-nzu-cream">
        <Image src="/nzulogo.jpg" alt="Nzu logo" width={36} height={36} className="h-9 w-auto rounded-md object-cover" />
        <span>Nzu</span>
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/properties" className="text-white/90 hover:text-nzu-cream transition-colors">Properties</Link>
        {loading ? null : user ? (
          <>
            <span className="text-nzu-cream">{user.name}</span>
            <Link href="/dashboard" className="text-white/90 hover:text-nzu-cream transition-colors">Dashboard</Link>
            <button onClick={() => logout()} className="text-white/90 hover:text-nzu-cream transition-colors">Logout</button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-white/90 hover:text-nzu-cream transition-colors">Login</Link>
            <Link href="/register" className="text-white/90 hover:text-nzu-cream transition-colors">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}
