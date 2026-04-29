import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db-connection"
import { renderDocumentPDF } from "@/lib/pdf-render"

interface RouteParams {
  params: {
    id: string
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function safeFilenamePart(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, " ").trim()
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const offers = await query(
      `SELECT
        o.offer_number,
        s.Stranka
      FROM Offers o
      LEFT JOIN Stranka s ON o.customer_id = s.id
      WHERE o.id = ?`,
      [params.id]
    )

    if (offers.length === 0) {
      return NextResponse.json({ error: "Ponudba ni najdena" }, { status: 404 })
    }

    const offerNumber = offers[0].offer_number as string
    const customerName = (offers[0].Stranka as string) || ""

    const origin = request.nextUrl.origin
    const targetUrl = `${origin}/offers/print/${encodeURIComponent(params.id)}`

    const pdf = await renderDocumentPDF(targetUrl, "#offer-preview-content")

    const filename = `${safeFilenamePart(offerNumber)} ${safeFilenamePart(customerName)}.pdf`.trim() || "ponudba.pdf"

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Napaka pri generiranju PDF ponudbe:", error)
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Napaka pri generiranju PDF ponudbe", detail }, { status: 500 })
  }
}
