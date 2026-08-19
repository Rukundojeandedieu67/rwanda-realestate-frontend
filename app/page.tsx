"use client"

import { useEffect, useState } from 'react'
import api from '../src/lib/api'
import type { SiteSettings } from '../src/types/index'

const defaults: Required<Pick<SiteSettings, 'hero_headline' | 'hero_subheadline'>> = {
  hero_headline: 'Find home. Build community.',
  hero_subheadline: 'Discover homes, rental opportunities, and trusted property listings across Rwanda.',
}

export default function Home() {
  const [settings, setSettings] = useState<SiteSettings>(defaults)
  const [notificationVisible, setNotificationVisible] = useState(true)

  useEffect(() => {
    api.settings.public().then(setSettings).catch(() => {})
  }, [])

  const headline = settings.hero_headline || defaults.hero_headline
  const subheadline = settings.hero_subheadline || defaults.hero_subheadline

  return (
    <div className="space-y-6 py-6">
      {settings.site_notification_active && settings.site_notification_banner && notificationVisible && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p>{settings.site_notification_banner}</p>
          <button type="button" onClick={() => setNotificationVisible(false)} className="shrink-0 font-semibold underline">Dismiss</button>
        </div>
      )}
      <section
        className="relative min-h-[28rem] overflow-hidden rounded-2xl bg-nzu-teal px-8 py-16 text-white shadow-sm sm:px-12"
        style={settings.hero_background_image_url ? { backgroundImage: `linear-gradient(90deg, rgba(10, 55, 60, .92), rgba(10, 55, 60, .4)), url(${settings.hero_background_image_url})`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}
      >
        <div className="relative max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-nzu-cream">Nzu</p>
          <h1 className="mt-4 text-4xl font-bold sm:text-6xl">{headline}</h1>
          <p className="mt-6 max-w-xl text-lg text-white/85">{subheadline}</p>
        </div>
      </section>
    </div>
  )
}
