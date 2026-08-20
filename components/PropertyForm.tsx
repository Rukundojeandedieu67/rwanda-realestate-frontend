"use client"

import React, { useEffect, useState } from 'react'
import type { PropertyImage } from '../src/types/index'
import api from '../src/lib/api'

export type PropertyCategory = 'residential' | 'commercial' | 'land' | 'short_stay'
export type PropertyListingType = 'sale' | 'rent' | 'short_stay'

export type PropertyFormValues = {
  title: string
  description: string
  category: PropertyCategory
  listing_type: PropertyListingType
  price: string
  currency: string
  province: string
  district: string
  sector: string
  cell: string
  village: string
  bedrooms: string
  bathrooms: string
  size_sqm: string
}

const defaultValues: PropertyFormValues = {
  title: '',
  description: '',
  category: 'residential',
  listing_type: 'rent',
  price: '',
  currency: 'RWF',
  province: '',
  district: '',
  sector: '',
  cell: '',
  village: '',
  bedrooms: '',
  bathrooms: '',
  size_sqm: '',
}

export default function PropertyForm({
  initialValues,
  initialImages,
  propertyId,
  onSubmit,
  submitLabel = 'Save Property',
  loading = false,
  resubmitNotice,
}: {
  initialValues?: Partial<PropertyFormValues>
  initialImages?: PropertyImage[]
  propertyId?: number
  onSubmit: (values: PropertyFormValues, images: File[]) => Promise<void> | void
  submitLabel?: string
  loading?: boolean
  resubmitNotice?: string
}) {
  const [form, setForm] = useState<PropertyFormValues>({
    ...defaultValues,
    ...initialValues,
  })
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<PropertyImage[]>(initialImages || [])
  const [imageBusy, setImageBusy] = useState(false)

  useEffect(() => {
    setForm({ ...defaultValues, ...initialValues })
    setExistingImages(initialImages || [])
  }, [initialValues])

  function updateField<K extends keyof PropertyFormValues>(field: K, value: PropertyFormValues[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(form, images)
  }

  async function deleteImage(imageId: number) {
    if (!propertyId || !window.confirm('Delete this image?')) return
    setImageBusy(true)
    try {
      await api.properties.deleteImage(propertyId, imageId)
      setExistingImages(current => current.filter(image => image.id !== imageId))
    } finally {
      setImageBusy(false)
    }
  }

  async function setPrimary(imageId: number) {
    if (!propertyId) return
    setImageBusy(true)
    try {
      await api.properties.setPrimaryImage(propertyId, imageId)
      setExistingImages(current => current.map(image => ({ ...image, is_primary: image.id === imageId })))
    } finally {
      setImageBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {resubmitNotice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {resubmitNotice}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Title</span>
          <input
            required
            value={form.title}
            onChange={e => updateField('title', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Beautiful 3-bedroom apartment"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
          <textarea
            required
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
            className="h-28 w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Describe the property, features, and availability"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Category</span>
          <select
            value={form.category}
            onChange={e => updateField('category', e.target.value as PropertyCategory)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land</option>
            <option value="short_stay">Short Stay</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Listing Type</span>
          <select
            value={form.listing_type}
            onChange={e => updateField('listing_type', e.target.value as PropertyListingType)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="sale">Sale</option>
            <option value="rent">Rent</option>
            <option value="short_stay">Short Stay</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Price</span>
          <input
            required
            type="number"
            min="0"
            value={form.price}
            onChange={e => updateField('price', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="1500000"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Currency</span>
          <select
            value={form.currency}
            onChange={e => updateField('currency', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="RWF">RWF</option>
            <option value="USD">USD</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Province</span>
          <input
            value={form.province}
            onChange={e => updateField('province', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Kigali"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">District</span>
          <input
            value={form.district}
            onChange={e => updateField('district', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Gasabo"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Sector</span>
          <input
            value={form.sector}
            onChange={e => updateField('sector', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Kacyiru"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Cell</span>
          <input
            value={form.cell}
            onChange={e => updateField('cell', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Kigali"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Village</span>
          <input
            value={form.village}
            onChange={e => updateField('village', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Nyabugogo"
          />
        </label>

        {(form.category === 'residential' || form.category === 'short_stay') && (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Bedrooms</span>
              <input
                type="number"
                min="0"
                value={form.bedrooms}
                onChange={e => updateField('bedrooms', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Bathrooms</span>
              <input
                type="number"
                min="0"
                value={form.bathrooms}
                onChange={e => updateField('bathrooms', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </>
        )}

        {form.category !== 'land' && (
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Size (sqm)</span>
            <input
              type="number"
              min="0"
              value={form.size_sqm}
              onChange={e => updateField('size_sqm', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="150"
            />
          </label>
        )}
      </div>

      <div className="border-t border-slate-200 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <div><h2 className="font-semibold text-slate-900">Property images</h2><p className="text-sm text-slate-500">The first image is used until you choose a primary image.</p></div>
          {imageBusy && <span className="text-sm text-slate-500">Updating image...</span>}
        </div>
        {existingImages.length > 0 && <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{existingImages.map(image => <div key={image.id} className="relative overflow-hidden rounded-lg border border-slate-200"><img src={image.url} alt="Property" className="h-28 w-full object-cover" /><div className="flex gap-1 p-2 text-xs"><button type="button" onClick={() => void setPrimary(image.id)} disabled={imageBusy || image.is_primary} className="flex-1 rounded border px-1 py-1 disabled:opacity-50">{image.is_primary ? 'Primary' : 'Set primary'}</button><button type="button" onClick={() => void deleteImage(image.id)} disabled={imageBusy} className="rounded border border-red-200 px-2 py-1 text-red-700">Delete</button></div></div>)}</div>}
        <input type="file" accept="image/*" multiple onChange={event => setImages(Array.from(event.target.files || []))} className="block w-full text-sm text-slate-600" />
        {images.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">{images.map(file => <img key={`${file.name}-${file.lastModified}`} src={URL.createObjectURL(file)} alt={file.name} className="h-20 w-full rounded object-cover" />)}</div>}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex rounded-lg bg-nzu-terracotta px-5 py-2.5 font-semibold text-white hover:bg-nzu-terracotta-dark disabled:opacity-60"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
