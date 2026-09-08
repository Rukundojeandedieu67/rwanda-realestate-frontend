"use client"

import Link from 'next/link'
import { useState } from 'react'
import api from '../../../src/lib/api'

export default function SmtpTestPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function sendTest(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)

    try {
      const response = await api.superadmin.testEmail(email)
      setFeedback({ type: 'success', text: response.message })
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'SMTP test failed.' })
    } finally {
      setLoading(false)
    }
  }

  return <section className="max-w-2xl rounded-xl border border-amber-300/30 bg-slate-900 p-6"><p className="text-sm font-semibold uppercase tracking-wider text-amber-300">Diagnostics</p><h2 className="mt-2 text-2xl font-bold text-white">Send SMTP test email</h2><p className="mt-2 text-slate-400">This sends immediately using the SMTP settings saved in Site Settings. Use a real inbox you can check.</p>{feedback && <div role="status" className={`mt-5 rounded-lg border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-red-400/30 bg-red-400/10 text-red-200'}`}>{feedback.text}</div>}<form onSubmit={sendTest} className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-300">Recipient email</span><input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label><button type="submit" disabled={loading} className="rounded-lg bg-amber-300 px-5 py-2.5 font-bold text-slate-950 disabled:opacity-50">{loading ? 'Sending...' : 'Send test email'}</button></form><Link href="/superadmin/settings" className="mt-6 inline-block text-sm font-semibold text-amber-200 hover:underline">Back to Site Settings</Link></section>
}