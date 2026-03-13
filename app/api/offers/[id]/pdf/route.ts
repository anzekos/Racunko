import { NextRequest, NextResponse } from "next/server"
import { chromium } from "playwright"
import { query } from "@/lib/db-connection"

interface RouteParams {
  params: {
    id: string
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function safeFilenamePart(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").replace(/\s+/g, " ").trim()
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
    const targetUrl = `${origin}/offers/view/${encodeURIComponent(params.id)}`

    const browser = await chromium.launch()
    try {
      const page = await browser.newPage()
      await page.goto(targetUrl, { waitUntil: "networkidle" })
      await page.waitForSelector("#offer-preview-content", { state: "visible", timeout: 30_000 })
      await page.emulateMedia({ media: "print" })

      // počakamo na fonte in slike
      await page.evaluate(async () => {
        // @ts-expect-error: fonts exists in browser
        await (document as any).fonts?.ready
        const imgs = Array.from(document.images || [])
        await Promise.all(
          imgs.map(
            (img) =>
              img.complete
                ? Promise.resolve()
                : new Promise<void>((resolve) => {
                    img.addEventListener("load", () => resolve(), { once: true })
                    img.addEventListener("error", () => resolve(), { once: true })
                  })
          )
        )
      })

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
      })

      const filename = `${safeFilenamePart(offerNumber)} ${safeFilenamePart(customerName)}`.trim() || "ponudba.pdf"

      return new NextResponse(pdf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      })
    } finally {
      await browser.close()
    }
  } catch (error) {
    console.error("Napaka pri generiranju PDF ponudbe:", error)
    return NextResponse.json({ error: "Napaka pri generiranju PDF ponudbe" }, { status: 500 })
  }
}

