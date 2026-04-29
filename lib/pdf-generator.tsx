import type { SavedInvoice } from "./database"
import { fetchVectorPDFBlob } from "./pdf-fetch"

function safeFilenamePart(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, " ").trim()
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Vrne vektorski PDF (besedilo selectable/copyable) za dani račun preko
 * server-side Playwright pipeline-a. Brez rasteriziranja vsebine.
 */
export async function fetchInvoicePDFBlob(invoiceId: string): Promise<Blob> {
  return fetchVectorPDFBlob(`/api/invoices/${encodeURIComponent(invoiceId)}/pdf`)
}

export function downloadInvoicePDF(invoice: SavedInvoice) {
  const customerName = safeFilenamePart(invoice.customer.Stranka || "")
  const invoiceNum = safeFilenamePart(invoice.invoiceNumber || "")
  const filename = `${invoiceNum} ${customerName}.pdf`.trim() || "racun.pdf"

  if (!invoice.id) {
    alert("Račun mora biti shranjen pred izvozom v PDF.")
    return
  }

  document.body.style.cursor = "wait"
  fetchInvoicePDFBlob(invoice.id)
    .then((blob) => downloadBlob(blob, filename))
    .catch((error) => {
      console.error("Napaka pri prenosu PDF-ja:", error)
      alert("Napaka pri generiranju PDF-ja: " + (error?.message || String(error)))
    })
    .finally(() => {
      document.body.style.cursor = "default"
    })
}
