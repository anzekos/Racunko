import { chromium } from "playwright"

/**
 * Vektorski footer, ki ga Chrome (Playwright) izriše kot besedilo na vsaki strani PDF-ja
 * (ne kot rasterizirano sliko). Pozicija in stil sta usklajena s prejšnjo jsPDF
 * implementacijo, da PDF vizualno ostane enak.
 */
export const PDF_FOOTER_TEMPLATE = `
<div style="
  width: 100%;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 7pt;
  color: rgb(147, 68, 53);
  padding: 2mm 20mm 0 20mm;
  box-sizing: border-box;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
">
  <div style="border-top: 0.4mm solid rgb(147, 68, 53); margin-bottom: 4mm;"></div>
  <div style="text-align: right; line-height: 4mm;">
    <div style="font-weight: bold;">2KM Consulting d.o.o., podjetniško in poslovno svetovanje</div>
    <div>Športna ulica 22, 1000 Ljubljana</div>
    <div>DŠ: SI 10628169</div>
    <div>TRR: SI56 0223 6026 1489 640 (NLB)</div>
  </div>
</div>
`

// Prazen header (Chrome zahteva ne-prazen template, drugače uporabi default)
const EMPTY_HEADER_TEMPLATE = `<div></div>`

/**
 * Generira vektorski PDF iz interne URL strani. Poskrbi, da so fonti naloženi
 * in slike pripravljene preden začne izvoz.
 */
export async function renderDocumentPDF(targetUrl: string, waitSelector: string): Promise<Buffer> {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(targetUrl, { waitUntil: "networkidle" })
    await page.waitForSelector(waitSelector, { state: "visible", timeout: 30_000 })
    await page.emulateMedia({ media: "print" })

    await page.evaluate(async () => {
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
      displayHeaderFooter: true,
      headerTemplate: EMPTY_HEADER_TEMPLATE,
      footerTemplate: PDF_FOOTER_TEMPLATE,
      margin: { top: "10mm", right: "10mm", bottom: "30mm", left: "10mm" },
    })

    return pdf
  } finally {
    await browser.close()
  }
}
