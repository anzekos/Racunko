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
    const invoices = await query(
      `SELECT
        i.invoice_number,
        s.Stranka
      FROM Invoices i
      LEFT JOIN Stranka s ON i.customer_id = s.id
      WHERE i.id = ?`,
      [params.id]
    )

    if (invoices.length === 0) {
      return NextResponse.json({ error: "Račun ni najden" }, { status: 404 })
    }

    const invoiceNumber = invoices[0].invoice_number as string
    const customerName = (invoices[0].Stranka as string) || ""

    const origin = request.nextUrl.origin
    const targetUrl = `${origin}/invoices/print/${encodeURIComponent(params.id)}`

    const pdf = await renderDocumentPDF(targetUrl, "#invoice-preview-content")

    const filename = `${safeFilenamePart(invoiceNumber)} ${safeFilenamePart(customerName)}.pdf`.trim() || "racun.pdf"

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Napaka pri generiranju PDF-ja:", error)
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Napaka pri generiranju PDF-ja", detail }, { status: 500 })
  }
}
