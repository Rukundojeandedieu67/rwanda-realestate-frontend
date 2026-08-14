import './globals.css'
import React from 'react'
import NavBar from '../components/NavBar'
import { AuthProvider } from '../src/context/AuthProvider'

export const metadata = {
  title: 'Rwanda Realestate',
  description: 'MVP real estate frontend',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <header>
            <div className="container mx-auto p-4"><NavBar /></div>
          </header>
          <main className="container mx-auto p-4">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
