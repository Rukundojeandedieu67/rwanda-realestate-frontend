"use client"

import { useEffect, useState } from 'react'
import api from '../src/lib/api'
import type { PaymentMethod } from '../src/types/index'

export default function PaymentMethodCards({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.paymentMethods.public().then(setMethods).catch(() => setMethods([])).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-slate-600">Loading payment methods...</p>
  if (!methods.length) return <p className="text-sm text-slate-600">No payment methods are currently available.</p>

  return <div className="grid gap-3 sm:grid-cols-2">{methods.map(method => <button type="button" key={method.id} onClick={() => onChange(String(method.id))} className={`text-left rounded-xl border p-4 transition ${value === String(method.id) ? 'border-nzu-terracotta bg-nzu-terracotta/5 ring-2 ring-nzu-terracotta/20' : 'border-slate-200 bg-white hover:border-nzu-teal'}`}><div className="flex items-center justify-between gap-2"><strong className="text-slate-900">{method.name}</strong><span className="text-xs uppercase text-slate-500">{method.type}</span></div><p className="mt-2 text-sm text-slate-700">{method.account_number}</p><p className="text-sm text-slate-600">{method.account_name}</p>{method.instructions && <p className="mt-2 text-xs leading-5 text-slate-500">{method.instructions}</p>}</button>)}</div>
}