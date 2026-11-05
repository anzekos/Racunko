// Skupne nastavitve prijavnega piškotka.
// Datoteka ne uvaža knjižnic za Node.js, zato jo lahko uporablja tudi middleware (Edge).
import { jwtVerify } from "jose"

export const AUTH_COOKIE = "racunko_token"
export const AUTH_MAX_AGE = 60 * 60 * 24 * 30 // 30 dni, enako kot veljavnost žetona

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: AUTH_MAX_AGE,
}

/** Preveri žeton JWT in vrne njegovo vsebino ali null, če ni veljaven. */
export async function verifyAuthToken(token: string | undefined) {
  const secret = process.env.JWT_SECRET
  if (!token || !secret) return null
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    })
    return payload as { username?: string; role?: string }
  } catch {
    return null
  }
}
