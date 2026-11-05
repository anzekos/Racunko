import { NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE, verifyAuthToken } from "@/lib/auth"

// Končne točke, ki morajo biti dosegljive brez prijave.
const PUBLIC_API = new Set(["/api/auth/login", "/api/auth/logout", "/api/auth/verify"])

export async function middleware(request: NextRequest) {
  if (PUBLIC_API.has(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value
  const payload = await verifyAuthToken(token)

  if (!payload) {
    return NextResponse.json({ error: "Potrebna je prijava" }, { status: 401 })
  }

  return NextResponse.next()
}

// Middleware ščiti vse strežniške končne točke.
export const config = {
  matcher: "/api/:path*",
}
