import './globals.css'
import React from 'react'
import NavBar from '../components/NavBar'
import SiteNotification from '../components/SiteNotification'
import { AuthProvider } from '../src/context/AuthProvider'

export const metadata = {
  title: 'Nzu',
  description: 'Nzu — Find home. Build community. Rent, buy, and sell property across Rwanda.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-nzu-bg text-slate-900 antialiased">
        <AuthProvider>
          <header className="bg-nzu-teal text-white shadow-sm">
            <div className="container mx-auto p-4"><NavBar /></div>
          </header>
          <main className="container mx-auto p-4">
            <SiteNotification />
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
