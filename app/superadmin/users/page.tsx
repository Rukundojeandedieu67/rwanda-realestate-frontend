"use client"

import React, { useEffect, useState } from 'react'
import api from '../../../src/lib/api'
import type { ManagedUser } from '../../../src/types/index'
import { PageLoader } from '../../../components/StatusStates'

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  async function loadUsers() {
    setLoading(true)
    try { setUsers(await api.superadmin.users({ search: query, role })) } catch (err: any) { setError(err.message || 'Could not load users.') } finally { setLoading(false) }
  }

  useEffect(() => { void loadUsers() }, [role])

  async function act(user: ManagedUser, action: 'promote' | 'demote' | 'deactivate') {
    const labels = { promote: 'promote this user to Admin', demote: 'demote this user', deactivate: 'deactivate this user' }
    if (!window.confirm(`Are you sure you want to ${labels[action]}? This action is consequential.`)) return
    setBusyId(user.id)
    setError(null)
    try {
      const updated = action === 'deactivate' ? await api.superadmin.deactivateUser(user.id) : await api.superadmin.updateUserRole(user.id, action === 'promote' ? 'admin' : 'user')
      setUsers(current => current.map(item => item.id === user.id ? { ...item, ...updated } : item))
    } catch (err: any) { setError(err.message || 'Could not update this user.') } finally { setBusyId(null) }
  }

  const visibleUsers = users.filter(user => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase()))

  return <div className="space-y-5">
    <div><h2 className="text-2xl font-bold text-white">User Management</h2><p className="mt-1 text-sm text-slate-400">Role and access changes require confirmation.</p></div>
    <div className="flex flex-col gap-3 sm:flex-row"><input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void loadUsers() }} placeholder="Search name or email" className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" /><select value={role} onChange={event => setRole(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"><option value="">All roles</option><option value="admin">Admin</option><option value="user">User</option><option value="superadmin">Super Admin</option></select><button type="button" onClick={() => void loadUsers()} className="rounded-lg border border-slate-600 px-4 py-2 font-semibold text-slate-200 hover:bg-white/10">Search</button></div>
    {error && <div role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
    {loading ? <PageLoader label="Loading users..." /> : <div className="overflow-x-auto rounded-xl border border-slate-700"><table className="min-w-full divide-y divide-slate-700 text-left text-sm"><thead className="bg-slate-900 text-xs uppercase tracking-wider text-slate-400"><tr>{['Name', 'Email', 'Role', 'Status', 'Joined', 'Last changed', 'Actions'].map(header => <th key={header} className="px-4 py-3">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-800 bg-slate-950">{visibleUsers.map(user => <tr key={user.id}><td className="whitespace-nowrap px-4 py-3 font-semibold text-white">{user.name}</td><td className="whitespace-nowrap px-4 py-3 text-slate-300">{user.email}</td><td className="px-4 py-3 text-slate-300">{user.role}</td><td className="px-4 py-3"><span className={user.is_active === false ? 'text-red-300' : 'text-emerald-300'}>{user.is_active === false ? 'Inactive' : 'Active'}</span></td><td className="whitespace-nowrap px-4 py-3 text-slate-400">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td><td className="whitespace-nowrap px-4 py-3 text-slate-400">{user.last_changed_by ? `${user.last_changed_by.name} / ${user.last_changed_at ? new Date(user.last_changed_at).toLocaleDateString() : '—'}` : '—'}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-2">{user.role !== 'admin' && user.role !== 'superadmin' && <button type="button" disabled={busyId === user.id} onClick={() => void act(user, 'promote')} className="rounded border border-emerald-400/40 px-2 py-1 text-xs font-semibold text-emerald-200 disabled:opacity-50">Promote to Admin</button>}{user.role === 'admin' && <button type="button" disabled={busyId === user.id} onClick={() => void act(user, 'demote')} className="rounded border border-amber-300/40 px-2 py-1 text-xs font-semibold text-amber-200 disabled:opacity-50">Demote</button>}{user.is_active !== false && user.role !== 'superadmin' && <button type="button" disabled={busyId === user.id} onClick={() => void act(user, 'deactivate')} className="rounded border border-red-400/40 px-2 py-1 text-xs font-semibold text-red-200 disabled:opacity-50">Deactivate</button>}</div></td></tr>)}</tbody></table>{visibleUsers.length === 0 && <p className="px-4 py-8 text-center text-slate-400">No users match this search.</p>}</div>}
  </div>
}