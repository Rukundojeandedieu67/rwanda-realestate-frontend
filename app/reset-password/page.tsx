"use client"

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '../../src/lib/api'

function ResetPasswordForm() {
  const params = useSearchParams()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await api.auth.resetPassword({ email: params.get('email') || '', token: params.get('token') || '', password, password_confirmation: confirmation })
      setMessage(response.message)
      setTimeout(() => router.push('/login'), 1200)
    } catch (requestError: any) {
      setError(requestError.message || 'Could not reset your password.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-nzu-bg px-4 py-8"><section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200/50"><h1 className="text-2xl font-bold text-slate-900">Set a new password</h1>{message && <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}{error && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}<form onSubmit={submit} className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">New password</span><input required minLength={8} type="password" value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5" /></label><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Confirm password</span><input required minLength={8} type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5" /></label><button disabled={loading} className="w-full rounded-lg bg-nzu-terracotta px-4 py-2.5 font-semibold text-white disabled:opacity-60">{loading ? 'Resetting...' : 'Reset password'}</button></form></section></main>
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-nzu-bg">Loading...</main>}><ResetPasswordForm /></Suspense>
}