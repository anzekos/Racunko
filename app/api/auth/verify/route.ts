import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret) {
      return NextResponse.json(
        { error: "Konfiguracija strežnika ni pravilna" },
        { status: 500 }
      )
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any

      return NextResponse.json({
        valid: true,
        user: { username: decoded.username, role: decoded.role }
      })
    } catch (error) {
      return NextResponse.json({ valid: false })
    }
  } catch (error) {
    console.error("Verify error:", error)
    return NextResponse.json(
      { error: "Napaka pri preverjanju" },
      { status: 500 }
    )
  }
}