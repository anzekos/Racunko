"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface User {
  username: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    console.log("🔄 AuthProvider mounted, checking auth...")
    checkAuth()
  }, [pathname])

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return ''
  }

  const checkAuth = async () => {
    try {
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      const token = localStorage.getItem("token")
      console.log("🔍 Auth check - Token exists:", !!token)
      
      if (!token) {
        console.log("❌ No token found")
        setLoading(false)
        if (pathname !== "/login") {
          router.push("/login") // SPREMENJENO: router.push namesto window.location.href
        }
        return
      }

      console.log("🔐 Checking auth with token:", token.substring(0, 20) + "...")

      const baseUrl = getBaseUrl()
      console.log("🌐 Making request to:", `${baseUrl}/api/auth/verify`)
      
      const response = await fetch(`${baseUrl}/api/auth/verify`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ token }),
      })

      console.log("📡 Verify response status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ HTTP error:", response.status, errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Verify response data:", data)

      if (data.valid) {
        console.log("🎉 Auth successful, user:", data.user)
        setUser(data.user)
        if (pathname === "/login") {
          console.log("🔀 Redirecting from login to home")
          router.push("/") // SPREMENJENO: router.push namesto window.location.href
        }
      } else {
        console.log("❌ Token invalid, logging out")
        localStorage.removeItem("token")
        setUser(null)
        if (pathname !== "/login") {
          router.push("/login") // SPREMENJENO: router.push namesto window.location.href
        }
      }
    } catch (error) {
      console.error("💥 Auth check error:", error)
      localStorage.removeItem("token")
      setUser(null)
      if (pathname !== "/login") {
        router.push("/login") // SPREMENJENO: router.push namesto window.location.href
      }
    } finally {
      setLoading(false)
    }
  }

  const login = (token: string, userData: User) => {
    console.log("🔑 Login function called, setting token and redirecting")
    localStorage.setItem("token", token)
    setUser(userData)
    router.push("/") // SPREMENJENO: router.push namesto window.location.href
  }

  const logout = () => {
    console.log("🚪 Logout called")
    localStorage.removeItem("token")
    setUser(null)
    router.push("/login") // SPREMENJENO: router.push namesto window.location.href
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}