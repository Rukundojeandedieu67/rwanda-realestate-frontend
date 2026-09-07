"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import api from '../../../../src/lib/api'
import useAuth from '../../../../src/hooks/useAuth'
import type { Property, Payment, PaymentMethod } from '../../../../src/types/index'
import PaymentMethodCards from '../../../../components/PaymentMethodCards'

const PAYMENT_SLA_HOURS = 3

export default function PropertyPayPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = Number(params.id)
  const { user, loading: authLoading } = useAuth()

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittedPayment, setSubmittedPayment] = useState<Payment | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true)

  const [payerName, setPayerName] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [durationUnit, setDurationUnit] = useState<'days' | 'hours'>('days')
  const [durationQuantity, setDurationQuantity] = useState('1')
  const [stayStartAt, setStayStartAt] = useState('')
  const [contractDetails, setContractDetails] = useState({
    lessor_full_name: '', lessor_id_number: '', lessor_address: '',
    lessee_full_name: '', lessee_id_number: '', lessee_address: '',
    property_description: '', upi: '', size: '', boundaries: '', tenure_type: '',
    lease_term: '', renewal_terms: '', payment_schedule: 'Monthly in advance', late_payment_consequences: '',
    security_deposit: '', notice_period: '30 days', maintenance_terms: '',
    subletting_terms: '', dispute_resolution: 'Good-faith negotiation, then competent Rwandan courts.',
  })

  useEffect(() => {
    async function loadProperty() {
      setLoading(true)
      setError(null)
      setNotFound(false)
      try {
        const prop = await api.properties.get(propertyId)
        setProperty(prop)
      } catch (err: any) {
        const status = Number(err?.status)
        const message = String(err?.message || '')
        if (status === 404 || /No query results|not found/i.test(message)) {
          setNotFound(true)
          return
        }

        setError('We couldn’t load this property right now. Please try again shortly.')
      } finally {
        setLoading(false)
      }
    }

    if (!Number.isNaN(propertyId)) {
      loadProperty()
    }
  }, [propertyId])

  useEffect(() => {
    api.paymentMethods.public().then(methods => {
      setPaymentMethods(methods)
      setPaymentMethodId(methods[0] ? String(methods[0].id) : '')
    }).catch(() => {}).finally(() => setPaymentMethodsLoading(false))
  }, [])

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

    if (!referenceNumber.trim() || !payerName.trim() || !paymentMethodId) {
      setSubmitError('Payment method, payer name, and reference number are required.')
      return
    }

    if (property?.listing_type === 'short_stay' && (!stayStartAt || Number(durationQuantity) < 1)) {
      setSubmitError('Choose a start time and specify at least one day or hour.')
      return
    }

    setSubmitLoading(true)
    setSubmitError(null)

    try {
      const formData = new FormData()
      formData.append('payment_method_id', paymentMethodId)
      formData.append('payer_name', payerName)
      formData.append('reference_number', referenceNumber)
      formData.append('contract_details', JSON.stringify(contractDetails))
      if (property.listing_type === 'short_stay') {
        formData.append('duration_unit', durationUnit)
        formData.append('duration_quantity', durationQuantity)
        formData.append('stay_start_at', new Date(stayStartAt).toISOString())
      }
      if (screenshot) {
        formData.append('screenshot', screenshot)
      }

      const payment = await api.properties.initiateTransaction(propertyId, formData)
      setSubmittedPayment(payment)
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

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <div className="mb-6 text-7xl font-black tracking-tight text-nzu-teal">404</div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-nzu-teal">Nzu</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Property not found</h1>
        <p className="mt-4 text-slate-600">This property is unavailable or no longer exists.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/properties" className="inline-flex rounded-lg bg-nzu-terracotta px-4 py-2 font-semibold text-white hover:bg-nzu-terracotta-dark">
            Browse properties
          </Link>
          <Link href="/" className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">
            Go home
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="bg-red-50 text-red-700 p-4 rounded">We couldn’t load this property right now. Please try again shortly.</div>
  }

  if (!property) {
    return <div className="text-center py-12">Property not found</div>
  }

  const transactionType = property.listing_type === 'sale' ? 'Purchase' : property.listing_type === 'short_stay' ? 'Short stay' : 'Rent'
  const isShortStay = property.listing_type === 'short_stay'
  const totalAmount = isShortStay ? property.price * Math.max(1, Number(durationQuantity) || 1) : property.price
  const isOwnListing = Boolean(user && (Number(property.owner_id ?? property.owner?.id) === Number(user.id) || Number(property.agent_id ?? property.agent?.id) === Number(user.id)))

  if (isOwnListing || property.is_available_for_transaction === false) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Transaction unavailable</h1>
        <p className="mt-3 text-slate-600">{isOwnListing ? 'This is your listing.' : 'This property has already been rented/sold.'}</p>
        <Link href={`/properties/${property.id}`} className="mt-6 inline-flex rounded-lg bg-nzu-teal px-4 py-2 font-semibold text-white">Back to property</Link>
      </div>
    )
  }

  if (submittedPayment) {
    return (
      <div className="max-w-2xl mx-auto bg-white border rounded shadow p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✅</div>
          <h1 className="text-3xl font-bold">Your {transactionType.toLowerCase()} payment is submitted</h1>
        </div>

        <div className="bg-green-50 border border-green-200 rounded p-4 mb-6 text-sm text-green-900">
          Your payment is submitted and will be reviewed within {PAYMENT_SLA_HOURS} hours, by <strong>{slaDeadline}</strong>. You&apos;ll be able to download your receipt and contract once approved.
        </div>

        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>Property:</strong> {property.title}</p>
          <p><strong>Amount:</strong> {property.currency === 'RWF' ? 'RWF ' : '$'}{property.price.toLocaleString()}</p>
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
          <h1 className="text-3xl font-bold mb-4">{transactionType} {property.title}</h1>
          <div className="mb-6 rounded-xl border border-nzu-terracotta/30 bg-nzu-terracotta/5 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-nzu-terracotta">Transaction summary</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{transactionType} transaction</p>
            <p className="mt-1 text-sm text-slate-600">{property.title}</p>
            <p className="mt-3 text-2xl font-black text-nzu-teal">{property.currency === 'RWF' ? 'RWF ' : '$'}{totalAmount.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-500">{isShortStay ? `Price per ${durationUnit}. Total updates as you change the stay length.` : 'The amount and currency are locked to the verified property listing.'}</p>
          </div>
          {isShortStay && <div className="mb-6 rounded-xl border border-nzu-teal/20 bg-nzu-teal/5 p-4">
            <h2 className="font-semibold text-slate-900">Stay duration</h2>
            <p className="mt-1 text-sm text-slate-600">Choose when the stay starts and whether you need days or hours.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">Start date and time
                <input type="datetime-local" value={stayStartAt} onChange={e => setStayStartAt(e.target.value)} min={new Date().toISOString().slice(0, 16)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" required />
              </label>
              <label className="text-sm font-medium text-slate-700">Unit
                <select value={durationUnit} onChange={e => setDurationUnit(e.target.value as 'days' | 'hours')} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2">
                  <option value="days">Days</option>
                  <option value="hours">Hours</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Number of {durationUnit}
                <input type="number" min="1" max="365" value={durationQuantity} onChange={e => setDurationQuantity(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" required />
              </label>
            </div>
          </div>}
          <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-6">
            <h2 className="font-semibold mb-2">Payment method</h2>
            {paymentMethodsLoading ? <p className="text-sm text-gray-700">Loading payment methods...</p> : <PaymentMethodCards value={paymentMethodId} onChange={setPaymentMethodId} />}
          </div>

          <div className="space-y-3 text-sm text-gray-700">
            <p><strong>Property:</strong> {property.title}</p>
            <p><strong>Payment SLA:</strong> admin review within {PAYMENT_SLA_HOURS} hours.</p>
          </div>
        </section>

        <section className="bg-gray-50 border rounded shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Submit payment proof</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {property.listing_type === 'rent' && <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
              <div><h2 className="text-lg font-bold text-slate-900">Legal agreement details</h2><p className="mt-1 text-sm text-slate-600">These details are saved with the transaction and used to prepare the bilingual lease. Leave unknown items blank; the PDF will mark them for completion.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">Lessor full name<input value={contractDetails.lessor_full_name} onChange={e => setContractDetails(v => ({ ...v, lessor_full_name: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="[TO BE COMPLETED]" /></label>
                <label className="text-sm font-semibold text-slate-700">Lessor ID/passport<input value={contractDetails.lessor_id_number} onChange={e => setContractDetails(v => ({ ...v, lessor_id_number: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="[TO BE COMPLETED]" /></label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Lessor address<input value={contractDetails.lessor_address} onChange={e => setContractDetails(v => ({ ...v, lessor_address: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="[TO BE COMPLETED]" /></label>
                <label className="text-sm font-semibold text-slate-700">Lessee full name<input value={contractDetails.lessee_full_name} onChange={e => setContractDetails(v => ({ ...v, lessee_full_name: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder={user?.name || '[TO BE COMPLETED]'} /></label>
                <label className="text-sm font-semibold text-slate-700">Lessee ID/passport<input value={contractDetails.lessee_id_number} onChange={e => setContractDetails(v => ({ ...v, lessee_id_number: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="[TO BE COMPLETED]" /></label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Lessee address<input value={contractDetails.lessee_address} onChange={e => setContractDetails(v => ({ ...v, lessee_address: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="[TO BE COMPLETED]" /></label>
              </div>
              <div className="border-t border-slate-200 pt-4"><h3 className="mb-3 font-semibold text-slate-900">Property and tenure</h3><div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Property description<input value={contractDetails.property_description} onChange={e => setContractDetails(v => ({ ...v, property_description: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder={property.title} /></label>
                <label className="text-sm font-semibold text-slate-700">UPI / parcel identifier<input value={contractDetails.upi} onChange={e => setContractDetails(v => ({ ...v, upi: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="[TO BE COMPLETED]" /></label>
                <label className="text-sm font-semibold text-slate-700">Size<input value={contractDetails.size} onChange={e => setContractDetails(v => ({ ...v, size: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="[TO BE COMPLETED]" /></label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Boundaries<input value={contractDetails.boundaries} onChange={e => setContractDetails(v => ({ ...v, boundaries: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="North / South / East / West: [TO BE COMPLETED]" /></label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Tenure type<input value={contractDetails.tenure_type} onChange={e => setContractDetails(v => ({ ...v, tenure_type: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Freehold, emphyteutic lease, condominium, or [TO BE COMPLETED]" /></label>
              </div></div>
              <div className="border-t border-slate-200 pt-4"><h3 className="mb-3 font-semibold text-slate-900">Lease terms</h3><div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">Duration<input value={contractDetails.lease_term} onChange={e => setContractDetails(v => ({ ...v, lease_term: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="e.g. 12 months" /></label>
                <label className="text-sm font-semibold text-slate-700">Security deposit<input value={contractDetails.security_deposit} onChange={e => setContractDetails(v => ({ ...v, security_deposit: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Amount or [TO BE COMPLETED]" /></label>
                <label className="text-sm font-semibold text-slate-700">Payment schedule<input value={contractDetails.payment_schedule} onChange={e => setContractDetails(v => ({ ...v, payment_schedule: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
                <label className="text-sm font-semibold text-slate-700">Late payment consequences<input value={contractDetails.late_payment_consequences} onChange={e => setContractDetails(v => ({ ...v, late_payment_consequences: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="[TO BE COMPLETED]" /></label>
                <label className="text-sm font-semibold text-slate-700">Notice period<input value={contractDetails.notice_period} onChange={e => setContractDetails(v => ({ ...v, notice_period: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Renewal terms<textarea value={contractDetails.renewal_terms} onChange={e => setContractDetails(v => ({ ...v, renewal_terms: e.target.value }))} className="mt-1 h-20 w-full rounded-lg border px-3 py-2" placeholder="Automatic renewal applies if the tenant remains without objection after expiry, unless proper notice is given." /></label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Maintenance and repairs<textarea value={contractDetails.maintenance_terms} onChange={e => setContractDetails(v => ({ ...v, maintenance_terms: e.target.value }))} className="mt-1 h-20 w-full rounded-lg border px-3 py-2" placeholder="[TO BE COMPLETED]" /></label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Subletting rules<textarea value={contractDetails.subletting_terms} onChange={e => setContractDetails(v => ({ ...v, subletting_terms: e.target.value }))} className="mt-1 h-20 w-full rounded-lg border px-3 py-2" placeholder="No subletting without written consent. Agricultural/forestry subleases over 5 years require registration." /></label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Dispute resolution<textarea value={contractDetails.dispute_resolution} onChange={e => setContractDetails(v => ({ ...v, dispute_resolution: e.target.value }))} className="mt-1 h-20 w-full rounded-lg border px-3 py-2" /></label>
              </div></div>
            </div>}

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
