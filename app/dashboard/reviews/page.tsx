'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '../../../src/hooks/useAuth'
import { getToken } from '../../../src/lib/auth'
import { PageLoader, ErrorAlert, EmptyState } from '../../../components/StatusStates'

interface Review {
  id: number
  agent_id: number
  user_id: number
  rating: number
  comment?: string
  approved_at?: string
  rejected_at?: string
  rejection_reason?: string
  created_at?: string
  agent?: { id: number; name: string; email: string }
  user?: { id: number; name: string; email: string }
}

export default function ReviewsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    loadReviews()
  }, [authLoading, user, statusFilter])

  async function loadReviews() {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      const response = await fetch(
        `http://localhost:8000/api/admin/reviews?status=${statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()
      setReviews(data.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: number) {
    try {
      const token = getToken()
      const response = await fetch(
        `http://localhost:8000/api/admin/reviews/${id}/approve`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      if (!response.ok) throw new Error('Failed to approve review')
      setReviews(reviews.filter(r => r.id !== id))
      alert('Review approved!')
    } catch (err: any) {
      alert(err.message || 'Failed to approve review')
    }
  }

  async function handleReject(id: number, reason: string) {
    if (!reason.trim()) return
    try {
      const token = getToken()
      const response = await fetch(
        `http://localhost:8000/api/admin/reviews/${id}/reject`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: reason.trim() }),
        }
      )
      if (!response.ok) throw new Error('Failed to reject review')
      setRejectingId(null)
      setRejectReason('')
      setReviews(reviews.filter(r => r.id !== id))
      alert('Review rejected!')
    } catch (err: any) {
      alert(err.message || 'Failed to reject review')
    }
  }

  if (authLoading) return <PageLoader label="Checking your session..." />
  if (!user) return null
  if (loading) return <PageLoader label="Loading reviews..." />
  if (error) return <ErrorAlert message={error} actionLabel="Retry" onAction={() => loadReviews()} />

  const pendingCount = reviews.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Pending Reviews</h1>
        <p className="mt-2 text-slate-600">Review and approve agent ratings from users.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 font-medium transition ${
            statusFilter === 'pending'
              ? 'border-b-2 border-nzu-teal text-nzu-teal'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`px-4 py-2 font-medium transition ${
            statusFilter === 'approved'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-4 py-2 font-medium transition ${
            statusFilter === 'rejected'
              ? 'border-b-2 border-red-600 text-red-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Reviews Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {statusFilter === 'pending' ? 'Pending Reviews' : statusFilter === 'approved' ? 'Approved Reviews' : 'Rejected Reviews'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{pendingCount} review{pendingCount === 1 ? '' : 's'}</p>
          </div>
          {statusFilter === 'pending' && pendingCount > 0 && (
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 text-amber-800 font-bold text-sm">
              {pendingCount}
            </span>
          )}
        </div>

        {reviews.length === 0 ? (
          <EmptyState
            title={`No ${statusFilter} reviews`}
            description={
              statusFilter === 'pending'
                ? 'All agent reviews have been processed!'
                : `There are no ${statusFilter} reviews yet.`
            }
          />
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <div
                key={review.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left: Review Info */}
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {review.user?.name || `User #${review.user_id}`} →{' '}
                          {review.agent?.name || `Agent #${review.agent_id}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {review.user?.email && `${review.user.email}`}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg font-bold text-nzu-teal">{review.rating}</span>
                      <span className="text-sm text-slate-600">
                        {'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </span>
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <div className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-700 border border-slate-200">
                        {review.comment}
                      </div>
                    )}

                    {/* Rejection Reason (if rejected) */}
                    {review.rejection_reason && (
                      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        <div className="font-semibold mb-1">Rejection reason</div>
                        {review.rejection_reason}
                      </div>
                    )}

                    <p className="mt-2 text-xs text-slate-500">
                      Submitted {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'recently'}
                    </p>
                  </div>

                  {/* Right: Actions (only for pending) */}
                  {statusFilter === 'pending' && (
                    <div className="flex flex-col gap-2 lg:items-end">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(review.id)}
                          className="inline-flex rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(review.id)
                            setRejectReason('')
                          }}
                          className="inline-flex rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          ✗ Reject
                        </button>
                      </div>

                      {rejectingId === review.id && (
                        <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
                          <label className="block font-medium text-red-800">
                            Rejection reason
                            <textarea
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              rows={3}
                              className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-400 focus:outline-none"
                              placeholder="Explain why this review is being rejected..."
                            />
                          </label>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleReject(review.id, rejectReason)}
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
