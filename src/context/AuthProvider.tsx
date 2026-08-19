"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '../types/index'
import api from '../lib/api'
import { getStoredUser, setCurrentUser, clearToken, getToken as getStoredToken } from '../lib/auth'

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  async function refreshUser(): Promise<void> {
    try {
      const u = await api.auth.me()
      setUser(u)
      try { setCurrentUser(u) } catch {}
    } catch (err) {
      console.error('[AuthProvider] Failed to fetch user:', err)
      setUser(null)
      try { clearToken() } catch {}
      throw err
    }
  }

  useEffect(() => {
    // This runs only once on mount
    async function initSession() {
      try {
        const storedUser = getStoredUser()
        const storedToken = getStoredToken()

        // If we have a stored user, use that immediately
        if (storedUser) {
          setUser(storedUser)
          setLoading(false)
          
          // But verify it's still valid if we have a token
          if (storedToken) {
            try {
              await refreshUser()
            } catch (err) {
              // If refresh fails, clear session
              setUser(null)
              clearToken()
            }
          }
        } else if (storedToken) {
          // No stored user but token exists, try to fetch the user
          try {
            await refreshUser()
          } catch (err) {
            // Failed to fetch user, session is invalid
          } finally {
            setLoading(false)
          }
        } else {
          // No session at all
          setUser(null)
          setLoading(false)
        }
      } catch (err) {
        setLoading(false)
      }
    }

    initSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function logout() {
    try { await api.auth.logout() } catch {}
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
