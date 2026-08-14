"use client"
import Link from 'next/link'
import React from 'react'
import useAuth from '../src/hooks/useAuth'

export default function NavBar() {
  const { user, loading, logout } = useAuth()

  return (
    <nav className="flex items-center justify-between py-4">
      <Link href="/" className="text-lg font-bold">Rwanda Realestate</Link>
      <div className="space-x-4 flex items-center">
        <Link href="/properties" className="text-sm text-gray-700">Properties</Link>
        {loading ? null : user ? (
          <>
            <span className="text-sm text-gray-600">{user.name}</span>
            <Link href="/dashboard" className="text-sm text-gray-700">Dashboard</Link>
            <button onClick={() => logout()} className="text-sm text-red-600">Logout</button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm text-gray-700">Login</Link>
            <Link href="/register" className="text-sm text-gray-700">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}
