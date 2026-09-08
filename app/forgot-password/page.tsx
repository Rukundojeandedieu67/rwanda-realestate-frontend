"use client"

import { useState } from 'react'
import Link from 'next/link'
import api from '../../src/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      const response = await api.auth.forgotPassword(email)
      setMessage(response.message)
    } catch (requestError: any) {
      setError(requestError.message || 'Could not send the reset email.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-nzu-bg px-4 py-8"><section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200/50"><h1 className="text-2xl font-bold text-slate-900">Forgot your password?</h1><p className="mt-2 text-sm text-slate-600">Enter your email and we will send a reset link.</p>{message && <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}{error && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}<form onSubmit={submit} className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span><input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5" /></label><button disabled={loading} className="w-full rounded-lg bg-nzu-terracotta px-4 py-2.5 font-semibold text-white disabled:opacity-60">{loading ? 'Sending...' : 'Send reset link'}</button></form><Link href="/login" className="mt-6 block text-center text-sm font-semibold text-nzu-teal">Back to login</Link></section></main>
}