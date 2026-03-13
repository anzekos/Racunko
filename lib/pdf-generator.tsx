// lib/pdf-generator.ts
// Uses server-side Playwright endpoint to generate text-selectable PDFs.
// Previously used html2canvas which rendered text as images (non-copyable).

import type { Invoice, SavedInvoice } from "@/lib/database"

/**
 * Downloads a PDF for an invoice by calling the server-side Playwright route.
 * Produces a proper PDF where all text is selectable and copyable.
 */
export async function downloadInvoicePDF(invoice: Invoice | SavedInvoice): Promise<void> {
  const savedInvoice = invoice as SavedInvoice
  if (!savedInvoice.id) {
    throw new Error("Invoice must be saved before downloading PDF")
  }

  const response = await fetch(`/api/invoices/${savedInvoice.id}/pdf`)
  if (!response.ok) {
    throw new Error(`Napaka pri generiranju PDF-ja: ${response.statusText}`)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")

  // Try to get filename from Content-Disposition header
  const disposition = response.headers.get("Content-Disposition")
  let filename = "racun.pdf"
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/)
    if (match) filename = match[1]
  }

  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Downloads a PDF for an invoice from a DOM element.
 * Kept for backwards compatibility — now redirects to server-side endpoint.
 */
export async function generateInvoicePDFFromElement(
  _element: HTMLElement,
  invoice: SavedInvoice
): Promise<Blob> {
  if (!invoice.id) {
    throw new Error("Invoice must be saved before downloading PDF")
  }

  const response = await fetch(`/api/invoices/${invoice.id}/pdf`)
  if (!response.ok) {
    throw new Error(`Napaka pri generiranju PDF-ja: ${response.statusText}`)
  }

  return response.blob()
}
