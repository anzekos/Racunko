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
    const creditNotes = await query(
      `SELECT
        cn.credit_note_number,
        s.Stranka
      FROM CreditNotes cn
      LEFT JOIN Stranka s ON cn.customer_id = s.id
      WHERE cn.id = ?`,
      [params.id]
    )

    if (creditNotes.length === 0) {
      return NextResponse.json({ error: "Dobropis ni najden" }, { status: 404 })
    }

    const creditNoteNumber = creditNotes[0].credit_note_number as string
    const customerName = (creditNotes[0].Stranka as string) || ""

    const origin = request.nextUrl.origin
    const targetUrl = `${origin}/credit-notes/print/${encodeURIComponent(params.id)}`

    const pdf = await renderDocumentPDF(targetUrl, "#credit-note-preview-content")

    const filename =
      `${safeFilenamePart(creditNoteNumber)} ${safeFilenamePart(customerName)}.pdf`.trim() || "dobropis.pdf"

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Napaka pri generiranju PDF dobropisa:", error)
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Napaka pri generiranju PDF dobropisa", detail }, { status: 500 })
  }
}
