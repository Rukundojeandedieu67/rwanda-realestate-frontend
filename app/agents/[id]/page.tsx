"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import api from '../../../src/lib/api'
import useAuth from '../../../src/hooks/useAuth'
import type { Review, User } from '../../../src/types/index'
import { PageLoader, ErrorAlert } from '../../../components/StatusStates'

export default function AgentProfilePage() {
  const params = useParams()
  const agentId = Number(params.id)
  const { user } = useAuth()
  const [agent, setAgent] = useState<User | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState('5')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  async function loadAgentReviews() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.reviews.listForAgent(agentId)
      setReviews(Array.isArray(data) ? data : [])

      const agentInfo = Array.isArray(data) && data[0] && (data[0] as any).agent ? (data[0] as any).agent : null
      if (agentInfo) {
        setAgent(agentInfo)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load agent reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!Number.isNaN(agentId)) {
      loadAgentReviews()
    }
  }, [agentId])

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  }, [reviews])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) {
      setSubmitError('Please log in to leave a review.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      await api.reviews.create({
        agent_id: agentId,
        rating: Number(rating),
        comment: comment.trim() || undefined,
      })
      setComment('')
      setSubmitSuccess(true)
      await loadAgentReviews()
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageLoader label="Loading agent profile..." />
  if (error) return <ErrorAlert message={error} actionLabel="Retry" onAction={loadAgentReviews} />

  const displayAgent = agent || { id: agentId, name: `Agent #${agentId}`, email: '', role: 'agent' as const }

  return (
    <div className="mx-auto max-w-4xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-nzu-teal">Agent</p>
          <h1 className="text-3xl font-bold text-slate-900">{displayAgent.name}</h1>
        </div>
        <Link href="/properties" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Browse properties
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-slate-500">Average rating</p>
            <div className="mt-2 text-3xl font-bold text-nzu-teal">{averageRating ? averageRating.toFixed(1) : 'No ratings yet'}</div>
          </div>
          <div className="text-sm text-slate-600">
            {reviews.length > 0 ? `${reviews.length} review${reviews.length > 1 ? 's' : ''}` : 'No reviews yet'}
          </div>
        </div>
      </div>

      {user && user.role !== 'admin' && (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Leave a Review</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Rating</span>
              <select value={rating} onChange={e => setRating(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                {[5,4,3,2,1].map(value => (
                  <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Comment (optional)</span>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your experience with this agent..."
                className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            {submitError && <div className="text-sm text-red-600">{submitError}</div>}
            {submitSuccess && <div className="text-sm text-green-600">Your review was submitted.</div>}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-nzu-terracotta px-4 py-2 font-semibold text-white hover:bg-nzu-terracotta-dark disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Reviews</h2>
        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-600">
            No reviews yet for this agent.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="font-medium text-slate-800">{review.user?.name || 'Verified customer'}</div>
                  <div className="text-sm font-semibold text-amber-600">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                </div>
                {review.comment && <p className="text-sm text-slate-600">{review.comment}</p>}
                <div className="mt-2 text-xs text-slate-400">{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
