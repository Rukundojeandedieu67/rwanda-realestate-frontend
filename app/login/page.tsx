"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, setToken } from '../../lib/api'
import { setCurrentUser } from '../../src/lib/auth'
import useAuth from '../../src/hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { refreshUser } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await login(email, password)
      
      if (data && data.token) {
        // Save token first
        setToken(data.token)
        
        // Save user data to localStorage immediately
        if (data.user) {
          try {
            setCurrentUser(data.user)
          } catch (err) {
            // Silently fail - user will be restored from token if needed
          }
        }
        
        // Navigate to dashboard
        router.push('/dashboard')
      } else {
        setError('Invalid login response')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-nzu-bg px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200/50">
        {/* Logo/Branding */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-nzu-teal/10">
            <span className="text-lg font-bold text-nzu-teal">Nzu</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome to Nzu</h1>
          <p className="mt-2 text-sm text-slate-600">Find home. Build community.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 transition focus:border-nzu-teal focus:outline-none focus:ring-2 focus:ring-nzu-teal/20"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 transition focus:border-nzu-teal focus:outline-none focus:ring-2 focus:ring-nzu-teal/20"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-nzu-terracotta px-4 py-2.5 font-semibold text-white transition hover:bg-nzu-terracotta-dark disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-500">New to Nzu?</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Register Link */}
        <a
          href="/register"
          className="block w-full rounded-lg border border-nzu-teal/20 bg-nzu-teal/5 px-4 py-2.5 text-center font-medium text-nzu-teal transition hover:bg-nzu-teal/10"
        >
          Create an account
        </a>
      </div>
    </div>
  )
}
