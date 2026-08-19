"use client"
import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '../../src/lib/api'
import type { Property, Paginated } from '../../src/types/index'
import { PageLoader, ErrorAlert, EmptyState, PropertyCardSkeleton } from '../../components/StatusStates'

export default function PropertiesPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading properties..." />}>
      <PropertiesContent />
    </Suspense>
  )
}

function PropertiesContent() {
  const searchParams = useSearchParams()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [listingType, setListingType] = useState(searchParams.get('listing_type') || '')
  const [province, setProvince] = useState(searchParams.get('province') || '')
  const [district, setDistrict] = useState(searchParams.get('district') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '')

  async function fetchProperties() {
    setLoading(true)
    setError(null)
    try {
      const filters: Record<string, string> = {}
      if (category) filters.category = category
      if (listingType) filters.listing_type = listingType
      if (province) filters.province = province
      if (district) filters.district = district
      if (minPrice) filters.min_price = minPrice
      if (maxPrice) filters.max_price = maxPrice
      filters.per_page = '12'

      const result: Paginated<Property> = await api.properties.list(filters)
      setProperties(result.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  function handleApplyFilters() {
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (listingType) params.append('listing_type', listingType)
    if (province) params.append('province', province)
    if (district) params.append('district', district)
    if (minPrice) params.append('min_price', minPrice)
    if (maxPrice) params.append('max_price', maxPrice)
    window.history.replaceState(null, '', `/properties?${params.toString()}`)
    fetchProperties()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Properties</h1>
        <p className="mt-2 text-slate-600">Discover homes, commercial spaces, and investment opportunities across Rwanda.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filter Sidebar */}
        <aside className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:max-w-xs">
          <h3 className="mb-6 text-lg font-bold text-slate-900">Filters</h3>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition focus:border-nzu-teal focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
                <option value="short_stay">Short Stay</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Listing Type</label>
              <select
                value={listingType}
                onChange={e => setListingType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition focus:border-nzu-teal focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
                <option value="short_stay">Short Stay</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Province</label>
              <input
                type="text"
                value={province}
                onChange={e => setProvince(e.target.value)}
                placeholder="e.g. Kigali"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition focus:border-nzu-teal focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">District</label>
              <input
                type="text"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                placeholder="e.g. Gasabo"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition focus:border-nzu-teal focus:outline-none"
              />
            </div>

            <div className="border-t border-slate-200 pt-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Price Range</label>
              <div className="space-y-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  placeholder="Min price (RWF)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition focus:border-nzu-teal focus:outline-none"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  placeholder="Max price (RWF)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition focus:border-nzu-teal focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleApplyFilters}
            className="mt-6 w-full rounded-lg bg-nzu-terracotta px-4 py-2.5 font-semibold text-white transition hover:bg-nzu-terracotta-dark"
          >
            Apply Filters
          </button>
        </aside>

        {/* Properties Grid */}
        <div className="flex-1">
          {error && (
            <div className="mb-4">
              <ErrorAlert message={error} actionLabel="Retry" onAction={fetchProperties} />
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <PropertyCardSkeleton key={index} />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <EmptyState
              title="No properties found"
              description="Try adjusting your filters or check back soon for new listings."
            />
          ) : (
            <>
              <div className="mb-4 text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{properties.length}</span> properties
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {properties.map(prop => (
                  <Link key={prop.id} href={`/properties/${prop.id}`}>
                    <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                      {prop.images && prop.images.length > 0 && (
                        <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                          <img
                            src={prop.images[0].url}
                            alt={prop.title}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                          {prop.status && (
                            <div className="absolute right-3 top-3">
                              <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                                prop.status === 'verified'
                                  ? 'bg-green-100 text-green-800'
                                  : prop.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                              }`}>
                                {prop.status === 'verified' ? '✓ Listed' : prop.status === 'pending' ? '⏱ Pending' : '✗ Unlisted'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="line-clamp-2 font-semibold text-slate-900">{prop.title}</h4>
                        <p className="mt-1 text-sm text-slate-600">
                          {prop.district}, {prop.province}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-xl font-bold text-nzu-teal">
                            {prop.currency === 'RWF' ? 'RWF ' : '$'}
                            {prop.price.toLocaleString()}
                          </span>
                          <span className="inline-block rounded-full bg-nzu-teal/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-nzu-teal">
                            {prop.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
