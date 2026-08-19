"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { register, ApiError } from '../../lib/api'
import { setToken } from '../../src/lib/auth'
import useAuth from '../../src/hooks/useAuth'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [role, setRole] = useState<'buyer_renter' | 'owner' | 'agent'>('buyer_renter')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const router = useRouter()
  const { refreshUser } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})
    try {
      const body = { name, email, phone, password, password_confirmation: passwordConfirm, role }
      const data = await register(body)
      if (data && data.token) {
        setToken(data.token)
        try { await refreshUser() } catch {}
        router.push('/dashboard')
      } else {
        setError('Invalid register response')
      }
    } catch (err: any) {
      if (err && (err as any).errors) {
        setFieldErrors((err as any).errors || {})
        setError((err as any).message || 'Validation failed')
      } else if (err instanceof ApiError) {
        setError(err.message || 'Register failed')
      } else {
        setError(err?.message || String(err) || 'Register failed')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-nzu-bg px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200/50">
        {/* Logo/Branding */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-nzu-teal/10">
            <span className="text-lg font-bold text-nzu-teal">Nzu</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm text-slate-600">Find home. Build community.</p>
        </div>

        {/* Error Alerts */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </div>
        )}
        {Object.keys(fieldErrors).length > 0 && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 space-y-1">
            {Object.entries(fieldErrors).map(([field, msgs]) => (
              <div key={field} className="text-sm text-red-800">
                <span className="font-medium capitalize">{field}:</span> {msgs.join(' ')}
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 transition focus:border-nzu-teal focus:outline-none focus:ring-2 focus:ring-nzu-teal/20"
              placeholder="Your name"
            />
          </label>

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
            <span className="mb-2 block text-sm font-semibold text-slate-700">Phone number</span>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 transition focus:border-nzu-teal focus:outline-none focus:ring-2 focus:ring-nzu-teal/20"
              placeholder="+250 ..."
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Account type</span>
            <select
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 transition focus:border-nzu-teal focus:outline-none focus:ring-2 focus:ring-nzu-teal/20"
            >
              <option value="buyer_renter">Buyer / Renter</option>
              <option value="owner">Property Owner</option>
              <option value="agent">Real Estate Agent</option>
            </select>
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

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Confirm password</span>
            <input
              type="password"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 transition focus:border-nzu-teal focus:outline-none focus:ring-2 focus:ring-nzu-teal/20"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-nzu-terracotta px-4 py-2.5 font-semibold text-white transition hover:bg-nzu-terracotta-dark disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-500">Already a member?</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Login Link */}
        <a
          href="/login"
          className="block w-full rounded-lg border border-nzu-teal/20 bg-nzu-teal/5 px-4 py-2.5 text-center font-medium text-nzu-teal transition hover:bg-nzu-teal/10"
        >
          Sign In
        </a>
      </div>
    </div>
  )
}
