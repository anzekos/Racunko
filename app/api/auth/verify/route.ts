// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    console.log("🔐 Verify endpoint called - DEBUG")
    console.log("URL:", request.url)
    console.log("Method:", request.method)
    
    const { token } = await request.json()
    const jwtSecret = process.env.JWT_SECRET

    console.log("JWT_SECRET exists:", !!jwtSecret)
    console.log("Token received:", token ? `${token.substring(0, 20)}...` : 'MISSING')

    if (!jwtSecret) {
      console.error("❌ JWT_SECRET is missing")
      return NextResponse.json(
        { error: "Konfiguracija strežnika ni pravilna" },
        { status: 500 }
      )
    }

    if (!token) {
      console.log("❌ No token provided")
      return NextResponse.json(
        { valid: false, error: "Token manjka" },
        { status: 401 }
      )
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any
      console.log("✅ Token verified for user:", decoded.username)
      
      return NextResponse.json({
        valid: true,
        user: {
          username: decoded.username,
          role: decoded.role
        }
      })
    } catch (jwtError) {
      console.log("❌ JWT verification failed:", jwtError)
      return NextResponse.json(
        { valid: false, error: "Neveljaven token" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("❌ Verify error:", error)
    return NextResponse.json(
      { valid: false, error: "Napaka pri preverjanju tokena" },
      { status: 500 }
    )
  }
}

export async function GET() {
  console.log("❌ GET method called on verify endpoint")
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 })
}