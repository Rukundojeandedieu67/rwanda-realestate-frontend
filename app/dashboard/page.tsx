"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '../../src/hooks/useAuth'
import type { Favorite, Inquiry, Property, Payment, Lease } from '../../src/types/index'
import api from '../../src/lib/api'
import { PageLoader, ErrorAlert, EmptyState } from '../../components/StatusStates'

function canManageProperty(user: any, property?: Partial<Property> | null) {
  if (!user || !property) return false
  if (user.role === 'admin') return true

  const ownerId = property.owner_id ?? property.owner?.id ?? null
  const agentId = property.agent_id ?? property.agent?.id ?? null

  return Number(ownerId) === Number(user.id) || Number(agentId) === Number(user.id)
}

function getPermissionMessage(err?: any, fallback = 'Failed to perform this action') {
  if (Number(err?.status) === 403 || /forbidden|permission/i.test(String(err?.message || ''))) {
    return "You don't have permission to modify this property"
  }

  return err?.message || fallback
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Redirect to login if user is not authenticated (but only after checking auth)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  if (authLoading) return <PageLoader label="Checking your session..." />
  if (!user) return null

  if (user.role === 'buyer_renter') {
    return <BuyerRenterDashboard user={user} />
  } else if (user.role === 'owner' || user.role === 'agent') {
    return <OwnerAgentDashboard user={user} />
  } else if (user.role === 'admin') {
    return <AdminDashboard user={user} />
  }

  return <div className="text-center py-12">Unknown role: {user.role}</div>
}

function BuyerRenterDashboard({ user }: { user: any }) {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [favs, inqs, pay] = await Promise.all([
          api.favorites.list(),
          api.inquiries.list(),
          api.payments.list(),
        ])
        setFavorites(favs || [])
        setInquiries(inqs || [])
        setPayments(pay || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleDownload(payment: Payment, type: 'receipt' | 'contract') {
    const idKey = `${payment.id}-${type}`
    const targetId = type === 'receipt' ? payment.receipt_id : payment.contract_id
    if (!targetId) return

    try {
      setDownloading(prev => ({ ...prev, [idKey]: true }))
      const blob = type === 'receipt'
        ? await api.receipts.download(targetId)
        : await api.contracts.download(targetId)

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${type}-${payment.id}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || `Failed to download ${type}`)
    } finally {
      setDownloading(prev => ({ ...prev, [idKey]: false }))
    }
  }

  if (loading) return <PageLoader label="Loading your dashboard..." />
  if (error) return <ErrorAlert message={error} actionLabel="Retry" onAction={() => window.location.reload()} />

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">Welcome back, <span className="font-semibold text-slate-900">{user.name}</span>!</p>
      </div>

      {/* My Favorites Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">My Favorites</h2>
            <p className="mt-1 text-sm text-slate-600">{favorites.length} saved {favorites.length === 1 ? 'property' : 'properties'}</p>
          </div>
          <div className="text-3xl">❤️</div>
        </div>

        {favorites.length === 0 ? (
          <EmptyState title="No favorites yet" description="Explore properties and save your favorites to view them here." />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map(fav => (
              <a
                key={fav.id}
                href={`/properties/${fav.property_id}`}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {fav.property?.images?.[0] && (
                  <img
                    src={fav.property.images[0].url}
                    alt={fav.property.title}
                    className="h-48 w-full object-cover transition group-hover:scale-105"
                  />
                )}
                <div className="p-4">
                  <h4 className="line-clamp-2 font-semibold text-slate-900">{fav.property?.title || 'N/A'}</h4>
                  <p className="mt-2 text-sm text-slate-600">{fav.property?.district}, {fav.property?.province}</p>
                  <p className="mt-3 text-lg font-bold text-nzu-teal">
                    {fav.property?.currency === 'RWF' ? 'RWF ' : '$'}
                    {fav.property?.price.toLocaleString()}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* My Inquiries Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">My Inquiries</h2>
            <p className="mt-1 text-sm text-slate-600">{inquiries.length} {inquiries.length === 1 ? 'inquiry' : 'inquiries'}</p>
          </div>
          <div className="text-3xl">💬</div>
        </div>

        {inquiries.length === 0 ? (
          <EmptyState title="No inquiries yet" description="Your conversations with sellers and agents will appear here." />
        ) : (
          <div className="space-y-3">
            {inquiries.map(inq => (
              <div key={inq.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{inq.property?.title || `Property #${inq.property_id}`}</h4>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">{inq.message}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                    inq.status === 'answered' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {inq.status === 'answered' ? '✓ Answered' : '⏱ Pending'}
                  </span>
                </div>

                {inq.response && (
                  <div className="rounded-lg border-l-2 border-nzu-teal bg-nzu-teal/5 p-3 text-sm">
                    <p className="font-medium text-nzu-teal">Response</p>
                    <p className="mt-1 text-slate-700">{inq.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Payment History Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Payment History</h2>
            <p className="mt-1 text-sm text-slate-600">{payments.length} {payments.length === 1 ? 'payment' : 'payments'}</p>
          </div>
          <div className="text-3xl">💳</div>
        </div>
        {payments.length === 0 ? (
          <EmptyState title="No payment submissions yet" description="Once you submit a payment, your status and download links will appear here." />
        ) : (
          <div className="space-y-3">
            {payments.map(payment => (
              <div
                key={payment.id}
                className={`rounded-lg border p-4 transition ${
                  payment.status === 'rejected'
                    ? 'border-red-200 bg-red-50'
                    : payment.status === 'approved'
                      ? 'border-green-200 bg-green-50'
                      : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900">{payment.payer_name}</h4>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        payment.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : payment.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {payment.status === 'approved' && '✓'} {payment.status || 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{payment.purpose}</p>
                    <p className="text-sm text-slate-600">Ref: {payment.reference_number}</p>
                    <p className="mt-2 text-lg font-bold text-nzu-teal">
                      {payment.currency === 'RWF' ? 'RWF ' : '$'}
                      {payment.amount.toLocaleString()}
                    </p>
                  </div>

                  {payment.status === 'approved' && (
                    <div className="flex flex-col gap-2 md:items-end">
                      {payment.receipt_id ? (
                        <button
                          onClick={() => handleDownload(payment, 'receipt')}
                          disabled={Boolean(downloading[`${payment.id}-receipt`])}
                          className="inline-flex items-center rounded-lg border border-nzu-teal bg-nzu-teal/5 px-3 py-2 text-sm font-medium text-nzu-teal transition hover:bg-nzu-teal/10 disabled:opacity-60"
                        >
                          📄 {downloading[`${payment.id}-receipt`] ? 'Preparing...' : 'Download Receipt'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">Receipt pending</span>
                      )}
                      {payment.contract_id ? (
                        <button
                          onClick={() => handleDownload(payment, 'contract')}
                          disabled={Boolean(downloading[`${payment.id}-contract`])}
                          className="inline-flex items-center rounded-lg border border-slate-400 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                        >
                          📋 {downloading[`${payment.id}-contract`] ? 'Preparing...' : 'Download Contract'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">Contract pending</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function OwnerAgentDashboard({ user }: { user: any }) {
  const [properties, setProperties] = useState<Property[]>([])
  const [leases, setLeases] = useState<Lease[]>([])
  const [leaseForm, setLeaseForm] = useState({ property_id: '', start_date: '', rent_amount: '', currency: 'RWF' })
  const [tenantId, setTenantId] = useState('')
  const [leaseLoading, setLeaseLoading] = useState(false)
  const [leaseError, setLeaseError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [flashMessage, setFlashMessage] = useState<string | null>(null)

  function getStatusBadgeClass(status?: string) {
    if (status === 'verified') return 'bg-green-100 text-green-800 border border-green-200'
    if (status === 'rejected') return 'bg-red-100 text-red-800 border border-red-200'
    return 'bg-amber-100 text-amber-800 border border-amber-200'
  }

  function getStatusLabel(status?: string) {
    if (status === 'verified') return 'Live'
    if (status === 'rejected') return 'Rejected'
    return 'Pending Review'
  }

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [props, leasesResult] = await Promise.all([
        api.properties.list({ per_page: '50' }),
        api.leases.list(),
      ])

      const allProps = props.data || []
      const ownedProps = allProps.filter(prop => canManageProperty(user, prop))
      setProperties(ownedProps)

      const userPropertyIds = ownedProps.map(prop => prop.id)

      setLeases((leasesResult || []).filter(lease => userPropertyIds.includes(lease.property_id)))
    } catch (err: any) {
      setError(err.message || 'Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const savedMessage = sessionStorage.getItem('property_created_notice')
    if (savedMessage) {
      setFlashMessage(savedMessage)
      sessionStorage.removeItem('property_created_notice')
    }

    void loadData()

    const handleFocus = () => {
      void loadData()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user.id])

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this property?')) return
    try {
      setActionError(null)
      await api.properties.delete(id)
      setProperties(properties.filter(p => p.id !== id))
      setLeases(leases.filter(lease => lease.property_id !== id))
    } catch (err: any) {
      setActionError(getPermissionMessage(err, 'Failed to delete property'))
    }
  }

  async function handleLeaseSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!leaseForm.property_id || !leaseForm.start_date || !leaseForm.rent_amount || !tenantId) {
      setLeaseError('Please complete all lease fields, including a tenant ID.')
      return
    }

    setLeaseLoading(true)
    setLeaseError(null)
    try {
      await api.leases.create({
        property_id: Number(leaseForm.property_id),
        tenant_id: Number(tenantId),
        start_date: leaseForm.start_date,
        rent_amount: Number(leaseForm.rent_amount),
        currency: leaseForm.currency,
      })
      setLeaseForm({ property_id: '', start_date: '', rent_amount: '', currency: 'RWF' })
      setTenantId('')
      await loadData()
    } catch (err: any) {
      setLeaseError(err.message || 'Failed to create lease.')
    } finally {
      setLeaseLoading(false)
    }
  }

  async function handleLeaseStatusUpdate(id: number, status: 'active' | 'ended' | 'cancelled') {
    try {
      await api.leases.update(id, { status })
      setLeases(prev => prev.map(lease => lease.id === id ? { ...lease, status } : lease))
    } catch (err: any) {
      setActionError(err.message || 'Failed to update lease status')
    }
  }

  if (loading) return <PageLoader label="Loading your dashboard..." />
  if (error) return <ErrorAlert message={error} actionLabel="Retry" onAction={() => window.location.reload()} />

  // Calculate stats
  const verifiedCount = properties.filter(p => p.status === 'verified').length
  const pendingCount = properties.filter(p => p.status === 'pending').length

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">Welcome back, <span className="font-semibold text-slate-900">{user.name}</span>!</p>
      </div>

      {/* Action Alerts */}
      {actionError && (
        <ErrorAlert message={actionError} actionLabel="Dismiss" onAction={() => setActionError(null)} />
      )}

      {flashMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {flashMessage}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Total Properties</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{properties.length}</div>
          <p className="mt-1 text-xs text-slate-500">{verifiedCount} live · {pendingCount} pending</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Active Leases</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{leases.filter(l => l.status === 'active').length}</div>
          <p className="mt-1 text-xs text-slate-500">{leases.length} total managed</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Status</div>
          <div className="mt-2">
            <p className="text-sm font-semibold text-slate-900">
              {pendingCount > 0 ? '⏱ Review in progress' : '✓ All live'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {pendingCount > 0 ? 'Some listings awaiting approval' : 'Your listings are published'}
            </p>
          </div>
        </div>
      </div>

      {/* My Properties Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">My Properties</h2>
            <p className="mt-1 text-sm text-slate-600">{properties.length} listing{properties.length === 1 ? '' : 's'}</p>
          </div>
          <a
            href="/dashboard/properties/new"
            className="inline-flex items-center gap-2 rounded-lg bg-nzu-terracotta px-4 py-2.5 font-semibold text-white transition hover:bg-nzu-terracotta-dark"
          >
            + Add Property
          </a>
        </div>

        {properties.length === 0 ? (
          <EmptyState
            title="No properties yet"
            description="Create your first listing to start receiving interest from buyers and renters."
          />
        ) : (
          <div className="space-y-3">
            {properties.map(prop => (
              <div
                key={prop.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left: Image + Info */}
                  <div className="flex gap-4 flex-1">
                    {prop.images?.[0]?.url && (
                      <img
                        src={prop.images[0].url}
                        alt={prop.title}
                        className="h-24 w-24 rounded-lg object-cover border border-slate-200"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-slate-900 truncate">{prop.title}</h4>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          prop.status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : prop.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {prop.status === 'verified' ? '✓ Live' : prop.status === 'pending' ? '⏱ Pending' : '✗ Rejected'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{prop.district}, {prop.province}</p>
                      <p className="mt-2 text-lg font-bold text-nzu-teal">
                        {prop.currency === 'RWF' ? 'RWF ' : '$'}
                        {prop.price.toLocaleString()}
                      </p>

                      {prop.status === 'pending' && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          Awaiting admin review — typically reviewed within 24 hours.
                        </div>
                      )}

                      {prop.status === 'rejected' && (
                        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                          <div className="mb-1 font-semibold">Rejection reason</div>
                          <p>{prop.rejection_reason || 'No reason provided yet.'}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  {canManageProperty(user, prop) && (
                    <div className="flex gap-2 lg:flex-col lg:items-end">
                      {prop.status === 'rejected' ? (
                        <a
                          href={`/dashboard/properties/${prop.id}/edit`}
                          className="inline-flex rounded-lg bg-nzu-terracotta px-4 py-2 text-sm font-medium text-white transition hover:bg-nzu-terracotta-dark"
                        >
                          Edit & Resubmit
                        </a>
                      ) : (
                        <a
                          href={`/dashboard/properties/${prop.id}/edit`}
                          className="inline-flex rounded-lg border border-nzu-teal bg-nzu-teal/5 px-4 py-2 text-sm font-medium text-nzu-teal transition hover:bg-nzu-teal/10"
                        >
                          Edit
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(prop.id)}
                        className="inline-flex rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Leases Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Active Leases</h2>
            <p className="mt-1 text-sm text-slate-600">{leases.length} lease{leases.length === 1 ? '' : 's'}</p>
          </div>
          <div className="text-3xl">🏠</div>
        </div>

        {leases.length === 0 ? (
          <EmptyState title="No leases yet" description="Create a lease from a verified property to manage tenant agreements here." />
        ) : (
          <div className="space-y-3">
            {leases.map(lease => {
              const property = properties.find(prop => prop.id === lease.property_id)
              return (
                <div key={lease.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{property?.title || `Property #${lease.property_id}`}</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Tenant: {lease.tenant?.name || lease.tenant_name || `User #${lease.tenant_id}`}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {lease.currency === 'RWF' ? 'RWF ' : '$'}
                        {lease.rent_amount.toLocaleString()} · Started {lease.start_date}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                        lease.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : lease.status === 'ended'
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {lease.status}
                      </span>
                      <select
                        value={lease.status}
                        onChange={e =>
                          handleLeaseStatusUpdate(lease.id, e.target.value as 'active' | 'ended' | 'cancelled')
                        }
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm transition focus:border-nzu-teal focus:outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="ended">Ended</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Create Lease Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Create New Lease</h2>
        <form onSubmit={handleLeaseSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Property *</span>
            <select
              value={leaseForm.property_id}
              onChange={e => setLeaseForm(prev => ({ ...prev, property_id: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 transition focus:border-nzu-teal focus:outline-none"
            >
              <option value="">Select a verified property</option>
              {properties
                .filter(
                  prop =>
                    (prop.status === 'verified' || prop.status === 'pending') &&
                    (prop.owner?.id === user.id || prop.agent?.id === user.id)
                )
                .map(prop => (
                  <option key={prop.id} value={prop.id}>
                    {prop.title}
                  </option>
                ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Tenant user ID *</span>
            <input
              type="number"
              min="1"
              value={tenantId}
              onChange={e => setTenantId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 transition focus:border-nzu-teal focus:outline-none"
              placeholder="42"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Currency *</span>
            <select
              value={leaseForm.currency}
              onChange={e => setLeaseForm(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 transition focus:border-nzu-teal focus:outline-none"
            >
              <option value="RWF">RWF</option>
              <option value="USD">USD</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Start Date *</span>
            <input
              type="date"
              value={leaseForm.start_date}
              onChange={e => setLeaseForm(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 transition focus:border-nzu-teal focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Rent Amount *</span>
            <input
              type="number"
              min="0"
              value={leaseForm.rent_amount}
              onChange={e => setLeaseForm(prev => ({ ...prev, rent_amount: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 transition focus:border-nzu-teal focus:outline-none"
              placeholder="500000"
            />
          </label>

          {leaseError && <div className="md:col-span-2 text-sm font-medium text-red-600">{leaseError}</div>}

          <div className="md:col-span-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setLeaseForm({ property_id: '', start_date: '', rent_amount: '', currency: 'RWF' })
                setTenantId('')
              }}
              className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={leaseLoading}
              className="rounded-lg bg-nzu-terracotta px-4 py-2.5 font-semibold text-white transition hover:bg-nzu-terracotta-dark disabled:opacity-60"
            >
              {leaseLoading ? 'Creating Lease...' : 'Create Lease'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function AdminDashboard({ user }: { user: any }) {
  const [pendingProps, setPendingProps] = useState<Property[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await api.properties.adminList({ per_page: '100' })
        setPendingProps((result.data || []).filter(p => p.status === 'pending'))

        const paymentsResult = await api.payments.adminList()
        setPayments(paymentsResult || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleVerify(id: number) {
    try {
      const property = pendingProps.find(p => p.id === id)
      await api.properties.verify(id)
      setPendingProps(pendingProps.filter(p => p.id !== id))
      if (property?.title) {
        sessionStorage.setItem('property_status_notice', `Property verified and now live: ${property.title}`)
      }
      alert('Property verified!')
    } catch (err: any) {
      alert(err.message || 'Failed to verify property')
    }
  }

  async function handleRejectProp(id: number, reason: string) {
    if (!reason.trim()) return
    try {
      await api.properties.reject(id, reason.trim())
      setPendingProps(pendingProps.filter(p => p.id !== id))
      setRejectingId(null)
      setRejectReason('')
      alert('Property rejected!')
    } catch (err: any) {
      alert(err.message || 'Failed to reject property')
    }
  }

  async function handleApprovePayment(id: number) {
    try {
      await api.payments.approve(id)
      setPayments(payments.map(p => p.id === id ? { ...p, status: 'approved' } : p))
      alert('Payment approved! Download links available.')
    } catch (err: any) {
      alert(err.message || 'Failed to approve payment')
    }
  }

  async function handleRejectPayment(id: number) {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    try {
      await api.payments.reject(id, reason)
      setPayments(payments.map(p => p.id === id ? { ...p, status: 'rejected' } : p))
      alert('Payment rejected!')
    } catch (err: any) {
      alert(err.message || 'Failed to reject payment')
    }
  }

  if (loading) return <PageLoader label="Loading admin dashboard..." />
  if (error) return <ErrorAlert message={error} actionLabel="Retry" onAction={() => window.location.reload()} />

  const duplicateCount = pendingProps.filter(prop => prop.possible_duplicate).length
  const pendingPaymentCount = payments.filter(payment => payment.status !== 'approved' && payment.status !== 'rejected').length
  const overdueCount = payments.filter(payment => Boolean(payment.overdue)).length

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-slate-600">Manage property submissions, payments, and platform integrity.</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Properties Awaiting Review</div>
              <div className="mt-3 text-3xl font-bold text-amber-900">{pendingProps.length}</div>
              <p className="mt-2 text-xs text-amber-800">{duplicateCount} possible duplicates flagged</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-red-700">Payments Pending</div>
              <div className="mt-3 text-3xl font-bold text-red-900">{pendingPaymentCount}</div>
              <p className="mt-2 text-xs text-red-800">
                {overdueCount > 0 ? `${overdueCount} overdue — urgent!` : 'On track'}
              </p>
            </div>
            <div className="text-4xl">💳</div>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">Platform Status</div>
              <div className="mt-3 text-lg font-bold text-blue-900">
                {pendingPaymentCount === 0 && pendingProps.length === 0 ? '✓ All Clear' : '⚠ Action needed'}
              </div>
              <p className="mt-2 text-xs text-blue-800">
                {pendingPaymentCount + pendingProps.length} items need attention
              </p>
            </div>
            <div className="text-4xl">{pendingPaymentCount === 0 && pendingProps.length === 0 ? '✅' : '⚠️'}</div>
          </div>
        </div>
      </div>

      {/* Pending Properties Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Pending Properties</h2>
            <p className="mt-1 text-sm text-slate-600">{pendingProps.length} submission{pendingProps.length === 1 ? '' : 's'} awaiting review</p>
          </div>
          {pendingProps.length > 0 && (
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 text-amber-800 font-bold text-sm">
              {pendingProps.length}
            </span>
          )}
        </div>

        {pendingProps.length === 0 ? (
          <EmptyState title="No pending properties" description="New property submissions will appear here for review." />
        ) : (
          <div className="space-y-3">
            {pendingProps.map(prop => (
              <div key={prop.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left: Image + Info */}
                  <div className="flex gap-4 flex-1">
                    {prop.images?.[0]?.url && (
                      <img
                        src={prop.images[0].url}
                        alt={prop.title}
                        className="h-24 w-24 rounded-lg object-cover border border-slate-200"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900">{prop.title}</h4>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="inline-block rounded-full bg-slate-200 px-2 py-0.5">{prop.category}</span>
                        <span className="inline-block rounded-full bg-slate-200 px-2 py-0.5">{prop.listing_type}</span>
                        <span>{prop.district || 'N/A'}, {prop.province || 'N/A'}</span>
                      </div>
                      <p className="mt-2 text-lg font-bold text-nzu-teal">
                        {prop.currency === 'RWF' ? 'RWF ' : '$'}
                        {prop.price.toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Submitted {prop.created_at ? new Date(prop.created_at).toLocaleDateString() : 'recently'}
                      </p>

                      {prop.possible_duplicate && (
                        <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                          <div className="mb-1 flex items-center gap-2 font-semibold">
                            <span>⚠ Possible duplicate listing</span>
                          </div>
                          <p className="mb-2">This entry may overlap with an existing listing.</p>
                          {prop.duplicate_of_property_id && (
                            <a
                              href={`/properties/${prop.duplicate_of_property_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900"
                            >
                              Compare with property #{prop.duplicate_of_property_id}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 lg:items-end">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerify(prop.id)}
                        className="inline-flex rounded-lg bg-nzu-terracotta px-4 py-2 text-sm font-semibold text-white transition hover:bg-nzu-terracotta-dark"
                      >
                        ✓ Verify
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(prop.id)
                          setRejectReason('')
                        }}
                        className="inline-flex rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        ✗ Reject
                      </button>
                    </div>

                    {rejectingId === prop.id && (
                      <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
                        <label className="block font-medium text-red-800">
                          Rejection reason
                          <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            rows={3}
                            className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-400 focus:outline-none"
                            placeholder="Explain why this listing is being rejected..."
                          />
                        </label>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleRejectProp(prop.id, rejectReason)}
                            className="rounded-lg bg-red-600 px-3 py-2 font-semibold text-white transition hover:bg-red-700"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingId(null)
                              setRejectReason('')
                            }}
                            className="rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Payments Queue Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Payments Queue</h2>
            <p className="mt-1 text-sm text-slate-600">{pendingPaymentCount} payment{pendingPaymentCount === 1 ? '' : 's'} pending review</p>
          </div>
          {overdueCount > 0 && (
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-100 text-red-700 font-bold text-sm animate-pulse">
              {overdueCount}
            </span>
          )}
        </div>

        {payments.length === 0 ? (
          <EmptyState title="No payments queued" description="Buyer payment submissions will appear here for approval." />
        ) : (
          <div className="space-y-3">
            {payments.map(payment => {
              const isOverdue = Boolean(payment.overdue)
              const isPending = payment.status === 'pending'

              return (
                <div
                  key={payment.id}
                  className={`rounded-lg border p-4 transition ${
                    isOverdue
                      ? 'border-red-300 bg-red-50 shadow-md'
                      : isPending
                        ? 'border-slate-200 bg-slate-50'
                        : payment.status === 'approved'
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900">{payment.payer_name}</p>
                        {isOverdue && (
                          <span className="inline-flex animate-pulse items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-red-700">
                            🔴 Overdue
                          </span>
                        )}
                        {!isOverdue && !isPending && (
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            payment.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {payment.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 md:grid-cols-4">
                        <div>
                          <p className="text-xs font-medium text-slate-500">Amount</p>
                          <p className="font-bold text-nzu-teal">
                            {payment.currency === 'RWF' ? 'RWF ' : '$'}
                            {payment.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">Reference</p>
                          <p className="font-mono text-xs">{payment.reference_number}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">Purpose</p>
                          <p>{payment.purpose}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">Submitted</p>
                          <p>{payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>

                      {payment.sla_deadline && (
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          SLA deadline: {new Date(payment.sla_deadline).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex flex-col gap-2 lg:items-end">
                        <button
                          onClick={() => handleApprovePayment(payment.id)}
                          className="inline-flex rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleRejectPayment(payment.id)}
                          className="inline-flex rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
