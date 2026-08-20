"use client"

import React, { useEffect, useState } from 'react'
import api from '../../../src/lib/api'
import type { PaymentMethod, SiteSettings } from '../../../src/types/index'
import { PageLoader } from '../../../components/StatusStates'

const emptySettings: SiteSettings = {}

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(emptySettings)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [newMethod, setNewMethod] = useState({ name: '', type: 'momo' as PaymentMethod['type'], account_number: '', account_name: '', instructions: '' })
  const [editingMethod, setEditingMethod] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([api.settings.get(), api.superadmin.paymentMethods()]).then(([loadedSettings, loadedMethods]) => {
      setSettings(loadedSettings)
      setPaymentMethods(loadedMethods)
    }).catch(error => setFeedback({ type: 'error', text: error.message || 'Could not load settings.' })).finally(() => setLoading(false))
  }, [])

  function update(field: keyof SiteSettings, value: string | boolean) {
    setSettings(current => ({ ...current, [field]: value }))
  }

  function chooseImage(file: File | undefined) {
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setFeedback(null)

    try {
      const editableSettings: Partial<SiteSettings> = {
        hero_headline: settings.hero_headline ?? null,
        hero_subheadline: settings.hero_subheadline ?? null,
        site_notification_banner: settings.site_notification_banner ?? null,
        site_notification_active: Boolean(settings.site_notification_active),
        featured_listing_enabled: Boolean(settings.featured_listing_enabled),
        featured_listing_price: settings.featured_listing_price == null ? '0' : String(settings.featured_listing_price),
        featured_listing_currency: settings.featured_listing_currency || 'RWF',
        featured_listing_duration_days: settings.featured_listing_duration_days == null ? '7' : String(settings.featured_listing_duration_days),
      }
      if (settings.smtp_host) editableSettings.smtp_host = settings.smtp_host
      if (settings.smtp_port !== undefined && settings.smtp_port !== null && settings.smtp_port !== '') {
        editableSettings.smtp_port = String(settings.smtp_port)
      }
      if (settings.smtp_username) editableSettings.smtp_username = settings.smtp_username
      const saved = await api.settings.update(editableSettings)
      let imagePath: string | undefined
      if (image) {
        imagePath = (await api.settings.uploadHeroImage(image)).hero_background_image_path
      }
      setSettings(current => ({ ...current, ...saved.updated, ...(imagePath ? { hero_background_image_path: imagePath } : {}) }))
      setImage(null)
      setFeedback({ type: 'success', text: 'Site settings saved successfully.' })
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Could not save site settings.' })
    } finally {
      setSaving(false)
    }
  }

  async function savePaymentMethod() {
    try {
      const saved = editingMethod
        ? await api.superadmin.updatePaymentMethod(editingMethod, newMethod)
        : await api.superadmin.createPaymentMethod({ ...newMethod, is_active: true, display_order: paymentMethods.length })
      setPaymentMethods(current => editingMethod ? current.map(item => item.id === saved.id ? saved : item) : [...current, saved])
      setEditingMethod(null)
      setNewMethod({ name: '', type: 'momo', account_number: '', account_name: '', instructions: '' })
      setFeedback({ type: 'success', text: editingMethod ? 'Payment method updated.' : 'Payment method added.' })
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Could not save payment method.' })
    }
  }

  async function togglePaymentMethod(method: PaymentMethod) {
    try {
      const updated = await api.superadmin.togglePaymentMethod(method.id)
      setPaymentMethods(current => current.map(item => item.id === updated.id ? updated : item))
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Could not toggle payment method.' })
    }
  }

  async function removePaymentMethod(method: PaymentMethod) {
    try {
      await api.superadmin.deletePaymentMethod(method.id)
      setPaymentMethods(current => current.filter(item => item.id !== method.id))
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Could not remove payment method.' })
    }
  }

  if (loading) return <PageLoader label="Loading site settings..." />

  return (
    <form onSubmit={save} className="space-y-6">
      {feedback && <div role="status" className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-red-400/30 bg-red-400/10 text-red-200'}`}>{feedback.text}</div>}
      <section className="rounded-xl border border-slate-700 bg-slate-900 p-6">
        <h2 className="text-xl font-bold text-white">Public Homepage</h2>
        <div className="mt-5 grid gap-5">
          <label><span className="mb-2 block text-sm font-semibold text-slate-300">Hero headline</span><input value={settings.hero_headline || ''} onChange={event => update('hero_headline', event.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>
          <label><span className="mb-2 block text-sm font-semibold text-slate-300">Hero subheadline</span><textarea value={settings.hero_subheadline || ''} onChange={event => update('hero_subheadline', event.target.value)} rows={3} className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>
          <label><span className="mb-2 block text-sm font-semibold text-slate-300">Hero background image</span><input type="file" accept="image/*" onChange={event => chooseImage(event.target.files?.[0])} className="block w-full text-sm text-slate-300" />{(preview || settings.hero_background_image_url) && <img src={preview || settings.hero_background_image_url || ''} alt="Hero preview" className="mt-3 h-40 w-full rounded-lg object-cover" />}</label>
        </div>
      </section>
      <section className="rounded-xl border border-slate-700 bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-white">Site Notification</h2><p className="mt-1 text-sm text-slate-400">Shown to every visitor while active.</p></div><label className="flex items-center gap-2 text-sm font-semibold text-amber-200"><input type="checkbox" checked={Boolean(settings.site_notification_active)} onChange={event => update('site_notification_active', event.target.checked)} className="h-4 w-4 accent-amber-300" /> Active</label></div>
        <textarea value={settings.site_notification_banner || ''} onChange={event => update('site_notification_banner', event.target.value)} rows={3} className="mt-5 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" placeholder="Optional announcement" />
      </section>
      <section className="rounded-xl border border-amber-300/30 bg-slate-900 p-6">
        <h2 className="text-xl font-bold text-white">Email (SMTP) Configuration</h2>
        <p className="mt-1 text-sm text-slate-400">Sensitive values are write-only and are never displayed here.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {([['smtp_host', 'SMTP host'], ['smtp_port', 'SMTP port'], ['smtp_username', 'SMTP username'], ['smtp_password', 'SMTP password'], ['smtp_from_address', 'From address']] as const).map(([field, label]) => {
            const configured = Boolean(settings[`${field}_configured` as keyof SiteSettings]) || Boolean(settings[field])
            return <label key={field}><span className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-300"><span>{label}</span><span className={configured ? 'text-emerald-300' : 'text-slate-500'}>{configured ? 'Configured' : 'Not set'}</span></span><input type={field === 'smtp_password' ? 'password' : 'text'} value={field === 'smtp_password' ? '' : String(settings[field] || '')} onChange={event => update(field, event.target.value)} placeholder={configured ? 'Leave blank to keep current value' : ''} className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>
          })}
        </div>
      </section>
      <section className="rounded-xl border border-slate-700 bg-slate-900 p-6">
        <h2 className="text-xl font-bold text-white">Featured listings</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 sm:col-span-3"><input type="checkbox" checked={Boolean(settings.featured_listing_enabled)} onChange={event => update('featured_listing_enabled', event.target.checked)} className="h-4 w-4 accent-amber-300" /> Allow verified listings to be featured</label>
          <label className="text-sm font-semibold text-slate-300">Price<input value={String(settings.featured_listing_price ?? '')} onChange={event => update('featured_listing_price', event.target.value)} className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>
          <label className="text-sm font-semibold text-slate-300">Currency<select value={String(settings.featured_listing_currency || 'RWF')} onChange={event => update('featured_listing_currency', event.target.value)} className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"><option value="RWF">RWF</option><option value="USD">USD</option></select></label>
          <label className="text-sm font-semibold text-slate-300">Duration (days)<input value={String(settings.featured_listing_duration_days ?? '')} onChange={event => update('featured_listing_duration_days', event.target.value)} className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" /></label>
        </div>
      </section>
      <section id="payment-methods" className="rounded-xl border border-slate-700 bg-slate-900 p-6">
        <h2 className="text-xl font-bold text-white">Payment methods</h2>
        <div className="mt-4 space-y-2">{paymentMethods.map(method => <div key={method.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 px-3 py-3 text-sm text-slate-200"><span><strong>{method.name}</strong> · {method.account_number} · {method.account_name} · <span className={method.is_active ? 'text-emerald-300' : 'text-slate-500'}>{method.is_active ? 'Active' : 'Inactive'}</span></span><span className="flex gap-2"><button type="button" onClick={() => void togglePaymentMethod(method)} className="rounded border border-slate-600 px-2 py-1">{method.is_active ? 'Deactivate' : 'Activate'}</button><button type="button" onClick={() => { setEditingMethod(method.id); setNewMethod({ name: method.name, type: method.type, account_number: method.account_number, account_name: method.account_name, instructions: method.instructions || '' }) }} className="rounded border border-amber-300/50 px-2 py-1 text-amber-200">Edit</button><button type="button" onClick={() => void removePaymentMethod(method)} className="rounded border border-red-400/40 px-2 py-1 text-red-200">Remove</button></span></div>)}</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input required placeholder="Name" value={newMethod.name} onChange={event => setNewMethod(current => ({ ...current, name: event.target.value }))} className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" />
          <select value={newMethod.type} onChange={event => setNewMethod(current => ({ ...current, type: event.target.value as PaymentMethod['type'] }))} className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"><option value="momo">Mobile money</option><option value="bank">Bank</option><option value="other">Other</option></select>
          <input required placeholder="Account number" value={newMethod.account_number} onChange={event => setNewMethod(current => ({ ...current, account_number: event.target.value }))} className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" />
          <input required placeholder="Account name" value={newMethod.account_name} onChange={event => setNewMethod(current => ({ ...current, account_name: event.target.value }))} className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" />
          <input placeholder="Instructions (optional)" value={newMethod.instructions} onChange={event => setNewMethod(current => ({ ...current, instructions: event.target.value }))} className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white sm:col-span-2" />
          <button type="button" onClick={() => void savePaymentMethod()} className="rounded-lg border border-amber-300/50 px-4 py-2 font-semibold text-amber-200 sm:col-span-2">{editingMethod ? 'Save payment method' : 'Add payment method'}</button>
          {editingMethod && <button type="button" onClick={() => { setEditingMethod(null); setNewMethod({ name: '', type: 'momo', account_number: '', account_name: '', instructions: '' }) }} className="text-sm text-slate-400 sm:col-span-2">Cancel editing</button>}
        </div>
      </section>
      <button type="submit" disabled={saving} className="rounded-lg bg-amber-300 px-5 py-2.5 font-bold text-slate-950 transition hover:bg-amber-200 disabled:opacity-60">{saving ? 'Saving...' : 'Save site settings'}</button>
    </form>
  )
}