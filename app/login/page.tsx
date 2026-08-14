"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, setToken } from '../../lib/api'
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
        setToken(data.token)
        try { await refreshUser() } catch {}
        router.push('/dashboard')
      } else {
        setError('Invalid login response')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow border border-nzu-teal/10">
      <h2 className="text-2xl font-bold mb-2 text-nzu-teal">Welcome to Nzu</h2>
      <p className="text-sm text-slate-600 mb-4">Find home. Build community.</p>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">Email
          <input className="w-full border p-2 mt-1" value={email} onChange={e=>setEmail(e.target.value)} />
        </label>
        <label className="block mb-2">Password
          <input type="password" className="w-full border p-2 mt-1" value={password} onChange={e=>setPassword(e.target.value)} />
        </label>
        <button className="mt-3 px-4 py-2 bg-nzu-terracotta text-white rounded hover:bg-nzu-terracotta-dark" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
    </div>
  )
}
