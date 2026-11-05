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
  login: (user: User) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Prijavni žeton je shranjen v piškotku httpOnly, ki ga nastavi strežnik.
// Skripte na strani do žetona nimajo dostopa, zato ga tu ne hranimo.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const redirectToLogin = () => {
    setUser(null)
    if (pathname !== "/login") {
      router.push("/login")
    }
  }

  const checkAuth = async () => {
    try {
      // Odstrani žeton, ki so ga v localStorage shranjevale starejše različice aplikacije.
      localStorage.removeItem("token")

      const response = await fetch("/api/auth/verify", { method: "POST" })
      const data = response.ok ? await response.json() : { valid: false }

      if (data.valid) {
        setUser(data.user)
        if (pathname === "/login") {
          router.push("/")
        }
      } else {
        redirectToLogin()
      }
    } catch (error) {
      console.error("Auth check error:", error)
      redirectToLogin()
    } finally {
      setLoading(false)
    }
  }

  const login = (userData: User) => {
    setUser(userData)
    router.push("/")
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout error:", error)
    }
    setUser(null)
    router.push("/login")
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
