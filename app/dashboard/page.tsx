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

  if (authLoading) return <PageLoader label="Checking your session..." />
  if (!user) {
    router.push('/login')
    return null
  }

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

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (error) return <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome back, {user.name}!</p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">My Favorites ({favorites.length})</h2>
        {favorites.length === 0 ? (
          <EmptyState title="No favorites yet" description="Save homes you like to revisit them here." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map(fav => (
              <a key={fav.id} href={`/properties/${fav.property_id}`} className="bg-white border rounded shadow hover:shadow-lg">
                {fav.property?.images?.[0] && (
                  <img src={fav.property.images[0].url} alt={fav.property.title} className="w-full h-40 object-cover rounded-t" />
                )}
                <div className="p-3">
                  <h4 className="font-semibold line-clamp-2">{fav.property?.title || 'N/A'}</h4>
                  <p className="text-blue-600 font-bold">
                    {fav.property?.currency === 'RWF' ? 'RWF ' : '$'}
                    {fav.property?.price.toLocaleString()}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">My Inquiries ({inquiries.length})</h2>
        {inquiries.length === 0 ? (
          <EmptyState title="No inquiries yet" description="Your conversations with sellers and agents will appear here." />
        ) : (
          <div className="space-y-3">
            {inquiries.map(inq => (
              <div key={inq.id} className="bg-white border p-4 rounded">
                <p className="font-semibold">Property ID: {inq.property_id}</p>
                <p className="text-sm text-gray-600 mt-1">{inq.message}</p>
                {inq.response && (
                  <div className="bg-gray-50 p-2 mt-2 rounded text-sm">
                    <strong>Response:</strong> {inq.response}
                  </div>
                )}
                <span className={`text-xs mt-2 inline-block px-2 py-1 rounded ${
                  inq.status === 'answered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {inq.status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Payment History ({payments.length})</h2>
        {payments.length === 0 ? (
          <EmptyState title="No payment submissions yet" description="Once you submit a payment, your status and download links will appear here." />
        ) : (
          <div className="space-y-3">
            {payments.map(payment => (
              <div key={payment.id} className="bg-white border p-4 rounded">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-semibold">{payment.purpose}</p>
                    <p className="text-sm text-gray-600">Payer: {payment.payer_name}</p>
                    <p className="text-sm text-gray-600">Reference: {payment.reference_number}</p>
                    <p className="text-blue-600 font-bold mt-1">
                      {payment.currency === 'RWF' ? 'RWF ' : '$'}
                      {payment.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span className={`text-xs inline-block px-2 py-1 rounded ${
                      payment.status === 'approved' ? 'bg-green-100 text-green-800' :
                      payment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status || 'pending'}
                    </span>
                    {payment.status === 'approved' && (
                      <div className="flex flex-wrap gap-2">
                        {payment.receipt_id ? (
                          <button
                            onClick={() => handleDownload(payment, 'receipt')}
                            disabled={Boolean(downloading[`${payment.id}-receipt`])}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-60"
                          >
                            {downloading[`${payment.id}-receipt`] ? 'Preparing receipt...' : 'Download receipt'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">Receipt pending</span>
                        )}
                        {payment.contract_id ? (
                          <button
                            onClick={() => handleDownload(payment, 'contract')}
                            disabled={Boolean(downloading[`${payment.id}-contract`])}
                            className="px-3 py-1 bg-gray-800 text-white text-sm rounded hover:bg-black disabled:opacity-60"
                          >
                            {downloading[`${payment.id}-contract`] ? 'Preparing contract...' : 'Download contract'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">Contract pending</span>
                        )}
                      </div>
                    )}
                  </div>
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

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (error) return <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome back, {user.name}!</p>

      {actionError && (
        <div className="mb-4">
          <ErrorAlert message={actionError} actionLabel="Dismiss" onAction={() => setActionError(null)} />
        </div>
      )}

      {flashMessage && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {flashMessage}
        </div>
      )}

      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-2xl font-semibold">Leases</h2>
          <span className="text-sm text-slate-500">{leases.length} managed lease{leases.length === 1 ? '' : 's'}</span>
        </div>

        {leases.length === 0 ? (
          <EmptyState title="No leases yet" description="Create a lease from a verified property to manage tenant agreements here." />
        ) : (
          <div className="space-y-3">
            {leases.map(lease => {
              const property = properties.find(prop => prop.id === lease.property_id)
              return (
                <div key={lease.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-800">{property?.title || `Property #${lease.property_id}`}</div>
                      <div className="text-sm text-slate-600">Tenant: {lease.tenant?.name || lease.tenant_name || `User #${lease.tenant_id}`}</div>
                      <div className="text-sm text-slate-600">
                        {lease.currency === 'RWF' ? 'RWF ' : '$'}
                        {lease.rent_amount.toLocaleString()} · {lease.start_date}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        lease.status === 'active' ? 'bg-green-100 text-green-800' :
                        lease.status === 'ended' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {lease.status}
                      </span>
                      <select
                        value={lease.status}
                        onChange={e => handleLeaseStatusUpdate(lease.id, e.target.value as 'active' | 'ended' | 'cancelled')}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
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

      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-2xl font-semibold">Create Lease</h2>
        <form onSubmit={handleLeaseSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Property</span>
            <select
              value={leaseForm.property_id}
              onChange={e => setLeaseForm(prev => ({ ...prev, property_id: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Select a verified property</option>
              {properties
                .filter(prop => (prop.status === 'verified' || prop.status === 'pending') && (prop.owner?.id === user.id || prop.agent?.id === user.id))
                .map(prop => (
                  <option key={prop.id} value={prop.id}>{prop.title}</option>
                ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Tenant user ID</span>
            <input
              type="number"
              min="1"
              value={tenantId}
              onChange={e => setTenantId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="42"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Currency</span>
            <select
              value={leaseForm.currency}
              onChange={e => setLeaseForm(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="RWF">RWF</option>
              <option value="USD">USD</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Start Date</span>
            <input
              type="date"
              value={leaseForm.start_date}
              onChange={e => setLeaseForm(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Rent Amount</span>
            <input
              type="number"
              min="0"
              value={leaseForm.rent_amount}
              onChange={e => setLeaseForm(prev => ({ ...prev, rent_amount: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="500000"
            />
          </label>

          {leaseError && <div className="md:col-span-2 text-sm text-red-600">{leaseError}</div>}

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={leaseLoading}
              className="inline-flex rounded-lg bg-nzu-terracotta px-4 py-2 font-semibold text-white hover:bg-nzu-terracotta-dark disabled:opacity-60"
            >
              {leaseLoading ? 'Creating...' : 'Create Lease'}
            </button>
          </div>
        </form>
      </section>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">My Properties ({properties.length})</h2>
        <a href="/dashboard/properties/new" className="inline-flex rounded-lg bg-nzu-terracotta px-4 py-2 font-semibold text-white hover:bg-nzu-terracotta-dark">
          + Add Property
        </a>
      </div>

      {properties.length === 0 ? (
        <EmptyState title="No properties yet" description="Create your first listing to start receiving interest from buyers and renters." />
      ) : (
        <div className="space-y-3">
          {properties.map(prop => (
            <div key={prop.id} className="bg-white border p-4 rounded flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold">{prop.title}</h4>
                <p className="text-sm text-gray-600">{prop.district}, {prop.province}</p>
                <p className="text-blue-600 font-bold mt-1">
                  {prop.currency === 'RWF' ? 'RWF ' : '$'}
                  {prop.price.toLocaleString()}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`text-xs inline-block px-2 py-1 rounded ${
                    prop.status === 'verified' ? 'bg-green-100 text-green-800' :
                    prop.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {prop.status || 'unknown'}
                  </span>
                  {prop.status === 'rejected' && prop.rejection_reason && (
                    <span className="text-xs text-red-700">Reason: {prop.rejection_reason}</span>
                  )}
                </div>
                {prop.status === 'rejected' && (
                  <p className="mt-2 text-xs text-amber-700">Editing will resubmit this property for verification.</p>
                )}
              </div>
              <div className="flex gap-2">
                {canManageProperty(user, prop) && (
                  <>
                    <a href={`/dashboard/properties/${prop.id}/edit`} className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
                      Edit
                    </a>
                    <button onClick={() => handleDelete(prop.id)} className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600">
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminDashboard({ user }: { user: any }) {
  const [pendingProps, setPendingProps] = useState<Property[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await api.properties.list({ per_page: '100' })
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
      await api.properties.update(id, { status: 'verified' } as any)
      setPendingProps(pendingProps.filter(p => p.id !== id))
      alert('Property verified!')
    } catch (err: any) {
      alert(err.message || 'Failed to verify property')
    }
  }

  async function handleRejectProp(id: number) {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    try {
      await api.properties.update(id, { status: 'rejected', rejection_reason: reason } as any)
      setPendingProps(pendingProps.filter(p => p.id !== id))
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

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (error) return <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Pending Properties ({pendingProps.length})</h2>
        {pendingProps.length === 0 ? (
          <EmptyState title="No pending properties" description="New property submissions will appear here for review." />
        ) : (
          <div className="space-y-3">
            {pendingProps.map(prop => (
              <div key={prop.id} className="bg-white border p-4 rounded flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{prop.title}</h4>
                  <p className="text-sm text-gray-600">Owner: {prop.owner?.name || 'N/A'}</p>
                  <p className="text-blue-600 font-bold mt-1">
                    {prop.currency === 'RWF' ? 'RWF ' : '$'}
                    {prop.price.toLocaleString()}
                  </p>
                  {prop.possible_duplicate && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                        ⚠ Possible duplicate
                      </span>
                      {prop.duplicate_of_property_id && (
                        <a href={`/properties/${prop.duplicate_of_property_id}`} className="text-xs font-medium text-blue-600 hover:underline">
                          Compare with property #{prop.duplicate_of_property_id}
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleVerify(prop.id)} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                    Verify
                  </button>
                  <button onClick={() => handleRejectProp(prop.id)} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Payments Queue ({payments.length})</h2>
        {payments.length === 0 ? (
          <EmptyState title="No payments queued" description="Buyer payment submissions will appear here for approval." />
        ) : (
          <div className="space-y-3">
            {payments.map(payment => {
              const isOverdue = Boolean(payment.overdue)
              return (
                <div
                  key={payment.id}
                  className={`bg-white border p-4 rounded flex justify-between items-start ${
                    isOverdue ? 'border-red-300 bg-red-50 shadow-sm' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{payment.payer_name}</p>
                      {isOverdue && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Ref: {payment.reference_number}</p>
                    <p className="text-blue-600 font-bold mt-1">
                      {payment.currency === 'RWF' ? 'RWF ' : '$'}
                      {payment.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Purpose: {payment.purpose}</p>
                    {payment.sla_deadline && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        SLA deadline: {new Date(payment.sla_deadline).toLocaleString()}
                      </p>
                    )}
                    <span className={`text-xs mt-2 inline-block px-2 py-1 rounded ${
                      payment.status === 'approved' ? 'bg-green-100 text-green-800' :
                      payment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status || 'pending'}
                    </span>
                  </div>
                  {payment.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprovePayment(payment.id)} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                        Approve
                      </button>
                      <button onClick={() => handleRejectPayment(payment.id)} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
