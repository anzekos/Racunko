import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    console.log("Login attempt for username:", username)

    const correctUsername = process.env.ADMIN_USERNAME
    const correctPassword = process.env.ADMIN_PASSWORD
    const jwtSecret = process.env.JWT_SECRET

    if (!correctUsername || !correctPassword || !jwtSecret) {
      console.error("Missing environment variables")
      return NextResponse.json(
        { error: "Konfiguracija strežnika ni pravilna" },
        { status: 500 }
      )
    }

    if (username !== correctUsername || password !== correctPassword) {
      console.log("Invalid credentials")
      return NextResponse.json(
        { error: "Napačno uporabniško ime ali geslo" },
        { status: 401 }
      )
    }

    // Ustvari JWT token BREZ expiration
    const token = jwt.sign(
      { 
        username,
        role: "admin",
        timestamp: Date.now()
      },
      jwtSecret
    )

    console.log("Login successful, token created")

    return NextResponse.json({
      success: true,
      token,
      user: { username, role: "admin" }
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Napaka pri prijavi" },
      { status: 500 }
    )
  }
}