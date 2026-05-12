import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    console.log("Login attempt for username:", username)

    const correctUsername = process.env.ADMIN_USERNAME
    const correctPasswordHash = process.env.ADMIN_PASSWORD_HASH
    const jwtSecret = process.env.JWT_SECRET

    if (!correctUsername || !correctPasswordHash || !jwtSecret) {
      console.error("Missing environment variables")
      return NextResponse.json(
        { error: "Konfiguracija strežnika ni pravilna" },
        { status: 500 }
      )
    }

    // Preveri uporabniško ime
    if (username !== correctUsername) {
      console.log("Invalid username")
      return NextResponse.json(
        { error: "Napačno uporabniško ime ali geslo" },
        { status: 401 }
      )
    }

    // Preveri geslo z bcrypt
    const passwordMatch = await bcrypt.compare(password, correctPasswordHash)

    if (!passwordMatch) {
      console.log("Invalid password")
      return NextResponse.json(
        { error: "Napačno uporabniško ime ali geslo" },
        { status: 401 }
      )
    }

    // Ustvari JWT token z 30-dnevno veljavnostjo
    const token = jwt.sign(
      {
        username,
        role: "admin",
        timestamp: Date.now()
      },
      jwtSecret,
      { expiresIn: "30d" }
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
