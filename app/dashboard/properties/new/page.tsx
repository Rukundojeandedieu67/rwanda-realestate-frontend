"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '../../../../src/lib/api'
import useAuth from '../../../../src/hooks/useAuth'
import PropertyForm, { type PropertyFormValues } from '../../../../components/PropertyForm'

export default function NewPropertyPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  if (authLoading || !user) {
    return null
  }

  async function handleSubmit(form: PropertyFormValues) {
    setSaving(true)
    setError(null)
    try {
      const payload: Record<string, any> = {
        title: form.title,
        description: form.description,
        category: form.category,
        listing_type: form.listing_type,
        price: Number(form.price),
        currency: form.currency,
        province: form.province || undefined,
        district: form.district || undefined,
        sector: form.sector || undefined,
        cell: form.cell || undefined,
        village: form.village || undefined,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        size_sqm: form.size_sqm ? Number(form.size_sqm) : null,
      }

      // The backend derives owner_id / agent_id from the authenticated user.
      // Do not send these fields from the frontend for regular owner/agent users.
      delete payload.owner_id
      delete payload.agent_id

      await api.properties.create(payload)
      sessionStorage.setItem('property_created_notice', 'Property created and pending review')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to create property')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-nzu-teal">Dashboard</p>
          <h1 className="text-3xl font-bold">Add Property</h1>
        </div>
        <Link href="/dashboard" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <PropertyForm onSubmit={handleSubmit} submitLabel="Create Property" loading={saving} />
    </div>
  )
}
