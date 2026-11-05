import { NextResponse } from "next/server"
import { AUTH_COOKIE, authCookieOptions } from "@/lib/auth"

// Odjava izbriše prijavni piškotek.
export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(AUTH_COOKIE, "", { ...authCookieOptions, maxAge: 0 })
  return response
}
