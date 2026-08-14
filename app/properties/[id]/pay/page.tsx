"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import api from '../../../../src/lib/api'
import useAuth from '../../../../src/hooks/useAuth'
import type { Property, Payment } from '../../../../src/types/index'

const PAYMENT_SLA_HOURS = 24

export default function PropertyPayPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = Number(params.id)
  const { user, loading: authLoading } = useAuth()

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittedPayment, setSubmittedPayment] = useState<Payment | null>(null)

  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('RWF')
  const [purpose, setPurpose] = useState('deposit')
  const [payerName, setPayerName] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)

  useEffect(() => {
    async function loadProperty() {
      setLoading(true)
      setError(null)
      try {
        const prop = await api.properties.get(propertyId)
        setProperty(prop)
        setAmount(String(prop.price || ''))
      } catch (err: any) {
        setError(err.message || 'Failed to load property')
      } finally {
        setLoading(false)
      }
    }

    if (!Number.isNaN(propertyId)) {
      loadProperty()
    }
  }, [propertyId])

  const slaDeadline = useMemo(() => {
    const date = new Date()
    date.setHours(date.getHours() + PAYMENT_SLA_HOURS)
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, router, user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) {
      setSubmitError('Please log in to submit a payment.')
      return
    }

    if (!amount || !referenceNumber.trim() || !payerName.trim()) {
      setSubmitError('Amount, payer name, and reference number are required.')
      return
    }

    setSubmitLoading(true)
    setSubmitError(null)

    try {
      const formData = new FormData()
      formData.append('property_id', String(propertyId))
      formData.append('amount', String(amount))
      formData.append('currency', currency)
      formData.append('purpose', purpose)
      formData.append('payer_name', payerName)
      formData.append('reference_number', referenceNumber)
      if (screenshot) {
        formData.append('screenshot', screenshot)
      }

      const payment = await api.payments.submit(formData)
      setSubmittedPayment(payment)
      setPurpose('deposit')
      setReferenceNumber('')
      setPayerName('')
      setScreenshot(null)
    } catch (err: any) {
      setSubmitError(err.message || 'Payment submission failed')
    } finally {
      setSubmitLoading(false)
    }
  }

  if (authLoading || loading) {
    return <div className="text-center py-12">Loading payment page...</div>
  }

  if (error) {
    return <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>
  }

  if (!property) {
    return <div className="text-center py-12">Property not found</div>
  }

  if (submittedPayment) {
    return (
      <div className="max-w-2xl mx-auto bg-white border rounded shadow p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✅</div>
          <h1 className="text-3xl font-bold">Payment submitted</h1>
        </div>

        <div className="bg-green-50 border border-green-200 rounded p-4 mb-6 text-sm text-green-900">
          Your payment request was received and is now pending admin review. We aim to confirm it within the SLA deadline of <strong>{slaDeadline}</strong>.
        </div>

        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>Property:</strong> {property.title}</p>
          <p><strong>Amount:</strong> {property.currency === 'RWF' ? 'RWF ' : '$'}{submittedPayment.amount.toLocaleString()}</p>
          <p><strong>Reference:</strong> {submittedPayment.reference_number}</p>
          <p><strong>Status:</strong> {submittedPayment.status || 'pending'}</p>
        </div>

        <div className="mt-6 flex gap-3 flex-wrap">
          <Link href={`/properties/${property.id}`} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Back to property
          </Link>
          <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            View dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href={`/properties/${property.id}`} className="text-blue-600 hover:underline">← Back to property</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border rounded shadow p-6">
          <h1 className="text-3xl font-bold mb-4">Pay for {property.title}</h1>
          <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-6">
            <h2 className="font-semibold mb-2">MoMo payment instructions</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              <li>Dial *182# on your MTN or Airtel Money line.</li>
              <li>Select <strong>Pay Bill</strong> or <strong>Send Money</strong>.</li>
              <li>Use merchant number: <strong>0788 000 000</strong>.</li>
              <li>Enter the exact amount: <strong>{property.currency === 'RWF' ? 'RWF ' : '$'}{Number(amount || property.price).toLocaleString()}</strong>.</li>
              <li>Use reference: <strong>{referenceNumber || 'YOUR_REFERENCE_NUMBER'}</strong>.</li>
              <li>Confirm the transaction and keep the confirmation SMS.</li>
            </ul>
          </div>

          <div className="space-y-3 text-sm text-gray-700">
            <p><strong>Property:</strong> {property.title}</p>
            <p><strong>Price:</strong> {property.currency === 'RWF' ? 'RWF ' : '$'}{property.price.toLocaleString()}</p>
            <p><strong>Payment SLA:</strong> confirmation expected within 24 hours.</p>
          </div>
        </section>

        <section className="bg-gray-50 border rounded shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Submit payment proof</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-gray-700">
                Amount
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full border rounded p-2"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Currency
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 w-full border rounded p-2"
                >
                  <option value="RWF">RWF</option>
                  <option value="USD">USD</option>
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium text-gray-700">
              Purpose
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="mt-1 w-full border rounded p-2"
              >
                <option value="deposit">deposit</option>
                <option value="purchase">purchase</option>
                <option value="rent">rent</option>
              </select>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-gray-700">
                Payer name
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="mt-1 w-full border rounded p-2"
                  placeholder="Your full name"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Reference number
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="mt-1 w-full border rounded p-2"
                  placeholder="MoMo reference"
                  required
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-gray-700">
              Screenshot upload (optional)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                className="mt-1 w-full border rounded p-2"
              />
            </label>

            {submitError && <div className="text-red-600 text-sm">{submitError}</div>}

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full px-4 py-3 bg-nzu-terracotta text-white rounded font-semibold hover:bg-nzu-terracotta-dark disabled:opacity-60"
            >
              {submitLoading ? 'Submitting payment...' : 'Submit payment'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
