import type { SavedOffer } from "./database"
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

export async function fetchOfferPDFBlob(offerId: string): Promise<Blob> {
  return fetchVectorPDFBlob(`/api/offers/${encodeURIComponent(offerId)}/pdf`)
}

export function downloadOfferPDF(offer: SavedOffer) {
  const customerName = safeFilenamePart(offer.customer.Stranka || "")
  const offerNum = safeFilenamePart(offer.offerNumber || "")
  const filename = `${offerNum} ${customerName}.pdf`.trim() || "ponudba.pdf"

  if (!offer.id) {
    alert("Ponudba mora biti shranjena pred izvozom v PDF.")
    return
  }

  document.body.style.cursor = "wait"
  fetchOfferPDFBlob(offer.id)
    .then((blob) => downloadBlob(blob, filename))
    .catch((error) => {
      console.error("Napaka pri prenosu PDF ponudbe:", error)
      alert("Napaka pri generiranju PDF ponudbe: " + (error?.message || String(error)))
    })
    .finally(() => {
      document.body.style.cursor = "default"
    })
}
