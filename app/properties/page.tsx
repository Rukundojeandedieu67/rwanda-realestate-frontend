"use client"
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '../../src/lib/api'
import type { Property, Paginated } from '../../src/types/index'

export default function PropertiesPage() {
  const searchParams = useSearchParams()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
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
    <div className="flex gap-6">
      {/* Filter Sidebar */}
      <div className="w-64 bg-gray-50 p-4 rounded">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        
        <label className="block mb-3">
          <span className="text-sm font-medium">Category</span>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border p-2 mt-1 text-sm">
            <option value="">All</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land</option>
            <option value="short_stay">Short Stay</option>
          </select>
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium">Listing Type</span>
          <select value={listingType} onChange={e => setListingType(e.target.value)} className="w-full border p-2 mt-1 text-sm">
            <option value="">All</option>
            <option value="sale">Sale</option>
            <option value="rent">Rent</option>
            <option value="short_stay">Short Stay</option>
          </select>
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium">Province</span>
          <input type="text" value={province} onChange={e => setProvince(e.target.value)} placeholder="e.g. Kigali" className="w-full border p-2 mt-1 text-sm" />
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium">District</span>
          <input type="text" value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Gasabo" className="w-full border p-2 mt-1 text-sm" />
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium">Min Price (RWF)</span>
          <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0" className="w-full border p-2 mt-1 text-sm" />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium">Max Price (RWF)</span>
          <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="10000000" className="w-full border p-2 mt-1 text-sm" />
        </label>

        <button onClick={handleApplyFilters} className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded">
          Apply Filters
        </button>
      </div>

      {/* Properties Grid */}
      <div className="flex-1">
        {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}
        
        {loading ? (
          <div className="text-center py-12 text-gray-600">Loading properties...</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12 text-gray-600">No properties found. Try adjusting your filters.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map(prop => (
              <Link key={prop.id} href={`/properties/${prop.id}`}>
                <div className="bg-white border rounded shadow hover:shadow-lg transition cursor-pointer">
                  {prop.images && prop.images.length > 0 && (
                    <img src={prop.images[0].url} alt={prop.title} className="w-full h-48 object-cover rounded-t" />
                  )}
                  <div className="p-3">
                    <h4 className="font-semibold text-sm line-clamp-2">{prop.title}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-blue-600">
                        {prop.currency === 'RWF' ? 'RWF ' : '$'}
                        {prop.price.toLocaleString()}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {prop.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {prop.district}, {prop.province}
                    </p>
                    {prop.status && (
                      <span className={`text-xs mt-2 inline-block px-2 py-1 rounded ${
                        prop.status === 'verified' ? 'bg-green-100 text-green-800' :
                        prop.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {prop.status}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
