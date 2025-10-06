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
          router.push("/login")
        }
        return
      }

      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (data.valid) {
        setUser(data.user)
        // Če smo na login strani in smo prijavljeni, preusmeri na glavno stran
        if (pathname === "/login") {
          router.push("/")
        }
      } else {
        localStorage.removeItem("token")
        setUser(null)
        if (pathname !== "/login") {
          router.push("/login")
        }
      }
    } catch (error) {
      console.error("Auth check error:", error)
      localStorage.removeItem("token")
      setUser(null)
      if (pathname !== "/login") {
        router.push("/login")
      }
    } finally {
      setLoading(false)
    }
  }

  const login = (token: string, userData: User) => {
    console.log("Login function called", userData)

    localStorage.setItem("token", token)
    setUser(userData)
    // Takoj preusmeri na glavno stran
    console.log("User set, redirecting...")

    router.push("/")
    router.refresh() // Dodaj refresh za zanesljivost
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    router.push("/login")
    router.refresh()
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