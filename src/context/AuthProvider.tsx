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
  const [user, setUser] = useState<User | null>(() => getStoredUser())
  const [loading, setLoading] = useState<boolean>(!user)

  async function refreshUser() {
    setLoading(true)
    try {
      const u = await api.auth.me()
      setUser(u)
      try { setCurrentUser(u) } catch {}
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // If no stored user but token exists, fetch /me
    if (!user && getStoredToken()) {
      refreshUser()
    } else {
      setLoading(false)
    }
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
