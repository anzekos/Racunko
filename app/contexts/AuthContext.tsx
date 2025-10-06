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
    checkAuth()
  }, [pathname])

  const checkAuth = async () => {
    try {
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      const token = localStorage.getItem("token")
      
      if (!token) {
        setLoading(false)
        if (pathname !== "/login") {
          window.location.href = "/login"
        }
        return
      }

      console.log("Checking auth with token:", token.substring(0, 20) + "...")

      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      // Preveri, ali je response OK in ima vsebino
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Verify response:", data)

      if (data.valid) {
        setUser(data.user)
        if (pathname === "/login") {
          window.location.href = "/"
        }
      } else {
        console.log("Token invalid, logging out")
        localStorage.removeItem("token")
        setUser(null)
        if (pathname !== "/login") {
          window.location.href = "/login"
        }
      }
    } catch (error) {
      console.error("Auth check error:", error)
      localStorage.removeItem("token")
      setUser(null)
      if (pathname !== "/login") {
        window.location.href = "/login"
      }
    } finally {
      setLoading(false)
    }
  }

  const login = (token: string, userData: User) => {
    console.log("Login function called - setting token and redirecting")
    localStorage.setItem("token", token)
    setUser(userData)
    // Uporabi window.location za zanesljiv redirect
    window.location.href = "/"
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    window.location.href = "/login"
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