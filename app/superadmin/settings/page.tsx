"use client"

import React, { useEffect, useState } from 'react'
import api from '../../../src/lib/api'
import type { SiteSettings } from '../../../src/types/index'
import { PageLoader } from '../../../components/StatusStates'

const emptySettings: SiteSettings = {}

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(emptySettings)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    api.settings.get().then(setSettings).catch(error => setFeedback({ type: 'error', text: error.message || 'Could not load settings.' })).finally(() => setLoading(false))
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
    const form = new FormData()
    const fields = ['hero_headline', 'hero_subheadline', 'site_notification_banner', 'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_from_address'] as const
    fields.forEach(field => {
      const value = settings[field]
      if (value !== undefined && value !== null && value !== '') form.append(field, String(value))
    })
    form.append('site_notification_active', settings.site_notification_active ? '1' : '0')
    if (image) form.append('hero_background_image', image)

    try {
      const saved = await api.settings.update(form)
      setSettings(current => ({ ...current, ...saved }))
      setImage(null)
      setFeedback({ type: 'success', text: 'Site settings saved successfully.' })
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Could not save site settings.' })
    } finally {
      setSaving(false)
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
      <button type="submit" disabled={saving} className="rounded-lg bg-amber-300 px-5 py-2.5 font-bold text-slate-950 transition hover:bg-amber-200 disabled:opacity-60">{saving ? 'Saving...' : 'Save site settings'}</button>
    </form>
  )
}