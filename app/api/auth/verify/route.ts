// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE, verifyAuthToken } from "@/lib/auth"

// Preveri, ali ima brskalnik veljaven prijavni piškotek.
export async function POST(request: NextRequest) {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing")
    return NextResponse.json({ valid: false, error: "Konfiguracija strežnika ni pravilna" }, { status: 500 })
  }

  const payload = await verifyAuthToken(request.cookies.get(AUTH_COOKIE)?.value)

  if (!payload) {
    return NextResponse.json({ valid: false })
  }

  return NextResponse.json({
    valid: true,
    user: { username: payload.username, role: payload.role },
  })
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 })
}
