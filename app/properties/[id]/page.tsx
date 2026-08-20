"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import api from '../../../src/lib/api'
import useAuth from '../../../src/hooks/useAuth'
import type { Property } from '../../../src/types/index'
import { PageLoader, ErrorAlert } from '../../../components/StatusStates'

export default function PropertyDetailPage() {
  const params = useParams()
  const propertyId = params.id as string
  const { user } = useAuth()

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [inquireMessage, setInquireMessage] = useState('')
  const [inquireLoading, setInquireLoading] = useState(false)
  const [inquireError, setInquireError] = useState<string | null>(null)
  const [inquireSuccess, setInquireSuccess] = useState(false)

  async function loadProperty() {
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const prop = await api.properties.get(parseInt(propertyId))
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

  useEffect(() => {
    loadProperty()
  }, [propertyId])

  async function handleFavorite() {
    if (!user) {
      setInquireError('Please log in to favorite properties')
      return
    }
    try {
      await api.favorites.toggle(parseInt(propertyId))
      setIsFavorited(!isFavorited)
    } catch (err: any) {
      setInquireError(err.message || 'Failed to toggle favorite')
    }
  }

  async function handleInquire() {
    if (!user) {
      setInquireError('Please log in to send inquiries')
      return
    }
    if (!inquireMessage.trim()) {
      setInquireError('Please enter a message')
      return
    }
    setInquireLoading(true)
    setInquireError(null)
    setInquireSuccess(false)
    try {
      await api.inquiries.create({ property_id: parseInt(propertyId), message: inquireMessage })
      setInquireSuccess(true)
      setInquireMessage('')
      setTimeout(() => setInquireSuccess(false), 3000)
    } catch (err: any) {
      setInquireError(err.message || 'Failed to send inquiry')
    } finally {
      setInquireLoading(false)
    }
  }

  if (loading) return <PageLoader label="Loading property details..." />
  if (notFound) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <div className="mb-6 text-7xl font-black tracking-tight text-nzu-teal">404</div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-nzu-teal">Nzu</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Property not found</h1>
        <p className="mt-4 text-slate-600">This listing no longer exists or is unavailable right now.</p>
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
  if (error) return <ErrorAlert message={error} actionLabel="Retry" onAction={loadProperty} />
  if (!property) return <ErrorAlert message="Property not found. It may have been removed or is no longer available." />

  const isPubliclyVisible = property.status === 'verified' || (user && (user.role === 'admin' || Number(property.owner?.id) === Number(user.id) || Number(property.agent?.id) === Number(user.id)))
  if (!isPubliclyVisible) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <div className="mb-6 text-6xl">🔒</div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-nzu-teal">Nzu</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">This listing is not available</h1>
        <p className="mt-4 text-slate-600">
          {property.status === 'pending'
            ? 'This property is still awaiting admin review and is not public yet.'
            : 'This listing has been removed from public view or rejected and is not currently available.'}
        </p>
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

  const images = property.images || []
  const primaryImage = images.find(image => image.is_primary)
  const orderedImages = primaryImage ? [primaryImage, ...images.filter(image => image.id !== primaryImage.id)] : images
  const showResidentialDetailFields = property.category === 'residential' || property.category === 'short_stay'
  const showSizeField = property.category !== 'land'

  return (
    <div className="max-w-4xl mx-auto">
      {/* Image Gallery */}
      <div className="mb-6">
        {orderedImages.length > 0 ? (
          <div className="bg-gray-100 rounded overflow-hidden">
            <img src={orderedImages[currentImageIndex].url} alt={property.title} className="w-full h-96 object-cover" />
            {orderedImages.length > 1 && (
              <div className="flex gap-2 p-3 bg-white justify-center">
                {orderedImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-12 h-12 border-2 rounded overflow-hidden ${idx === currentImageIndex ? 'border-blue-600' : 'border-gray-300'}`}
                  >
                    <img src={img.url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-96 bg-gray-200 rounded flex items-center justify-center text-gray-500">
            No images available
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
          
          <div className="flex items-center gap-4 mb-4">
            <span className="text-2xl font-bold text-blue-600">
              {property.currency === 'RWF' ? 'RWF ' : '$'}
              {property.price.toLocaleString()}
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded">{property.category}</span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded">{property.listing_type}</span>
            {property.status && (
              <span className={`px-3 py-1 rounded ${
                property.status === 'verified' ? 'bg-green-100 text-green-800' :
                property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {property.status}
              </span>
            )}
            {property.is_currently_featured && <span className="bg-nzu-terracotta text-white px-3 py-1 rounded">⭐ Featured</span>}
          </div>

          <p className="text-gray-700 mb-6">{property.description}</p>

          {/* Property Details Grid */}
          <div className="bg-gray-50 p-4 rounded mb-6">
            <h3 className="font-semibold mb-3">Property Details</h3>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {showResidentialDetailFields && property.bedrooms !== null && <div><strong>Bedrooms:</strong> {property.bedrooms}</div>}
              {showResidentialDetailFields && property.bathrooms !== null && <div><strong>Bathrooms:</strong> {property.bathrooms}</div>}
              {showSizeField && property.size_sqm !== null && <div><strong>Size:</strong> {property.size_sqm} sqm</div>}
              <div><strong>Province:</strong> {property.province || 'N/A'}</div>
              <div><strong>District:</strong> {property.district || 'N/A'}</div>
              <div><strong>Sector:</strong> {property.sector || 'N/A'}</div>
              <div><strong>Cell:</strong> {property.cell || 'N/A'}</div>
              <div><strong>Village:</strong> {property.village || 'N/A'}</div>
            </div>
          </div>

          {/* Owner/Agent Info */}
          <div className="bg-gray-50 p-4 rounded mb-6">
            <h3 className="font-semibold mb-3">Contact Information</h3>
            {property.owner && (
              <div className="mb-3">
                <p><strong>Owner:</strong> {property.owner.name}</p>
                <p className="text-sm text-gray-600">{property.owner.email}</p>
                {property.owner.phone && <p className="text-sm text-gray-600">{property.owner.phone}</p>}
              </div>
            )}
            {property.agent && (
              <div>
                <p>
                  <strong>Agent:</strong>{' '}
                  <Link href={`/agents/${property.agent.id}`} className="text-blue-600 hover:underline">
                    {property.agent.name}
                  </Link>
                </p>
                <p className="text-sm text-gray-600">{property.agent.email}</p>
                {property.agent.phone && <p className="text-sm text-gray-600">{property.agent.phone}</p>}
                <Link href={`/agents/${property.agent.id}`} className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline">
                  View agent reviews →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <Link
            href={`/properties/${property.id}/pay`}
            className="block w-full text-center px-4 py-3 rounded font-semibold mb-3 bg-nzu-terracotta text-white hover:bg-nzu-terracotta-dark"
          >
            💸 Pay for this property
          </Link>

          {/* Favorite Button */}
          <button
            onClick={handleFavorite}
            className={`w-full px-4 py-2 rounded font-semibold mb-3 ${
              isFavorited
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {isFavorited ? '❤️ Favorited' : '🤍 Add to Favorites'}
          </button>

          {/* Inquire Form */}
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-3">Send Inquiry</h3>
            {!user ? (
              <p className="text-sm text-gray-600 mb-3">
                <a href="/login" className="text-blue-600 hover:underline">Log in</a> to send an inquiry
              </p>
            ) : (
              <>
                {inquireError && <div className="text-red-600 text-sm mb-2">{inquireError}</div>}
                {inquireSuccess && <div className="text-green-600 text-sm mb-2">Inquiry sent successfully!</div>}
                <textarea
                  value={inquireMessage}
                  onChange={e => setInquireMessage(e.target.value)}
                  placeholder="Enter your message..."
                  className="w-full border p-2 text-sm rounded mb-2 resize-none h-24"
                />
                <button
                  onClick={handleInquire}
                  disabled={inquireLoading}
                  className="w-full px-3 py-2 bg-nzu-terracotta text-white text-sm rounded font-semibold hover:bg-nzu-terracotta-dark disabled:opacity-50"
                >
                  {inquireLoading ? 'Sending...' : 'Send Inquiry'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
