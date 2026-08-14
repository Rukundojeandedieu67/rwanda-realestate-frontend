"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '../../src/hooks/useAuth'
import type { Favorite, Inquiry, Property, Payment } from '../../src/types/index'
import api from '../../src/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  if (authLoading) return <div className="text-center py-12">Loading...</div>
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
    if (!targetId) {
      return
    }

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
          <p className="text-gray-600">No favorited properties yet.</p>
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
          <p className="text-gray-600">No inquiries sent yet.</p>
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
          <p className="text-gray-600">No payment submissions yet.</p>
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await api.properties.list({ per_page: '50' })
        setProperties(result.data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load properties')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this property?')) return
    try {
      await api.properties.delete(id)
      setProperties(properties.filter(p => p.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete property')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (error) return <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome back, {user.name}!</p>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Properties ({properties.length})</h2>
        <a href="/dashboard/properties/new" className="px-4 py-2 bg-nzu-terracotta text-white rounded font-semibold hover:bg-nzu-terracotta-dark">
          + Add Property
        </a>
      </div>

      {properties.length === 0 ? (
        <p className="text-gray-600">No properties yet. <a href="/dashboard/properties/new" className="text-blue-600 hover:underline">Create one</a>.</p>
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
                <span className={`text-xs mt-2 inline-block px-2 py-1 rounded ${
                  prop.status === 'verified' ? 'bg-green-100 text-green-800' :
                  prop.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {prop.status || 'unknown'}
                </span>
              </div>
              <div className="flex gap-2">
                <a href={`/dashboard/properties/${prop.id}/edit`} className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
                  Edit
                </a>
                <button onClick={() => handleDelete(prop.id)} className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600">
                  Delete
                </button>
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
      await api.properties.update(id, { status: 'rejected' } as any)
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
          <p className="text-gray-600">No pending properties.</p>
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
          <p className="text-gray-600">No payments.</p>
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
