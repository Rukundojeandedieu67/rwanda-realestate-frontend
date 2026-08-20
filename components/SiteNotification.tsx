"use client"

import { useEffect, useState } from 'react'
import api from '../src/lib/api'

export default function SiteNotification() {
  const [message, setMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    api.settings.public().then(settings => {
      if (settings.site_notification_active && settings.site_notification_banner) {
        setMessage(settings.site_notification_banner)
      }
    }).catch(() => {})
  }, [])

  if (!message || !visible) return null

  return (
    <div className="mb-4 flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p>{message}</p>
      <button type="button" onClick={() => setVisible(false)} className="shrink-0 font-semibold underline">
        Dismiss
      </button>
    </div>
  )
}