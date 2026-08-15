"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import api from '../../../../../src/lib/api'
import useAuth from '../../../../../src/hooks/useAuth'
import PropertyForm, { type PropertyFormValues } from '../../../../../components/PropertyForm'
import type { Property } from '../../../../../src/types/index'

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = Number(params.id)
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialValues, setInitialValues] = useState<Partial<PropertyFormValues> | undefined>(undefined)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (!authLoading && user) {
      loadProperty()
    }
  }, [authLoading, user, propertyId, router])

  async function loadProperty() {
    try {
      setLoading(true)
      setError(null)
      const prop = await api.properties.get(propertyId)
      setInitialValues({
        title: prop.title,
        description: prop.description,
        category: prop.category,
        listing_type: prop.listing_type,
        price: String(prop.price),
        currency: prop.currency || 'RWF',
        province: prop.province || '',
        district: prop.district || '',
        sector: prop.sector || '',
        cell: prop.cell || '',
        village: prop.village || '',
        bedrooms: prop.bedrooms !== null && prop.bedrooms !== undefined ? String(prop.bedrooms) : '',
        bathrooms: prop.bathrooms !== null && prop.bathrooms !== undefined ? String(prop.bathrooms) : '',
        size_sqm: prop.size_sqm !== null && prop.size_sqm !== undefined ? String(prop.size_sqm) : '',
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load property')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(form: PropertyFormValues) {
    setSaving(true)
    setError(null)
    try {
      await api.properties.update(propertyId, {
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
        status: 'pending',
      })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to update property')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return <div className="py-12 text-center text-slate-600">Loading property…</div>
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-nzu-teal">Dashboard</p>
          <h1 className="text-3xl font-bold">Edit Property</h1>
        </div>
        <Link href="/dashboard" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {initialValues && (
        <PropertyForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitLabel="Update Property"
          loading={saving}
          resubmitNotice="Editing will resubmit this property for verification."
        />
      )}
    </div>
  )
}
