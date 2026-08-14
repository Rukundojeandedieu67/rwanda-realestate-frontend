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
      console.debug('Register payload', body)
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
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow border border-nzu-teal/10">
      <h2 className="text-2xl font-bold mb-2 text-nzu-teal">Create your Nzu account</h2>
      <p className="text-sm text-slate-600 mb-4">Find home. Build community.</p>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {Object.keys(fieldErrors).length > 0 && (
        <div className="mb-2">
          {Object.entries(fieldErrors).map(([field, msgs]) => (
            <div key={field} className="text-sm text-red-600">
              <strong>{field}:</strong> {msgs.join(' ')}
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">Name
          <input className="w-full border p-2 mt-1" value={name} onChange={e=>setName(e.target.value)} />
        </label>
        <label className="block mb-2">Email
          <input className="w-full border p-2 mt-1" value={email} onChange={e=>setEmail(e.target.value)} />
        </label>
        <label className="block mb-2">Phone
          <input className="w-full border p-2 mt-1" value={phone} onChange={e=>setPhone(e.target.value)} />
        </label>
        <label className="block mb-2">Role
          <select value={role} onChange={e=>setRole(e.target.value as any)} className="w-full border p-2 mt-1">
            <option value="buyer_renter">Buyer / Renter</option>
            <option value="owner">Owner</option>
            <option value="agent">Agent</option>
          </select>
        </label>
        <label className="block mb-2">Password
          <input type="password" className="w-full border p-2 mt-1" value={password} onChange={e=>setPassword(e.target.value)} />
        </label>
        <label className="block mb-2">Confirm Password
          <input type="password" className="w-full border p-2 mt-1" value={passwordConfirm} onChange={e=>setPasswordConfirm(e.target.value)} />
        </label>
        <button className="mt-3 px-4 py-2 bg-nzu-terracotta text-white rounded hover:bg-nzu-terracotta-dark" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
      </form>
    </div>
  )
}
