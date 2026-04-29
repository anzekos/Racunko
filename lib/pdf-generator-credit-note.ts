import type { SavedCreditNote } from "./database"

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

export async function fetchCreditNotePDFBlob(creditNoteId: string): Promise<Blob> {
  const res = await fetch(`/api/credit-notes/${encodeURIComponent(creditNoteId)}/pdf`, { method: "GET" })
  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new Error(msg || `HTTP ${res.status}`)
  }
  return await res.blob()
}

export function downloadCreditNotePDF(creditNote: SavedCreditNote) {
  const customerName = safeFilenamePart(creditNote.customer.Stranka || "")
  const creditNoteNum = safeFilenamePart(creditNote.creditNoteNumber || "")
  const filename = `${creditNoteNum} ${customerName}.pdf`.trim() || "dobropis.pdf"

  if (!creditNote.id) {
    alert("Dobropis mora biti shranjen pred izvozom v PDF.")
    return
  }

  document.body.style.cursor = "wait"
  fetchCreditNotePDFBlob(creditNote.id)
    .then((blob) => downloadBlob(blob, filename))
    .catch((error) => {
      console.error("Napaka pri prenosu PDF dobropisa:", error)
      alert("Napaka pri generiranju PDF dobropisa: " + (error?.message || String(error)))
    })
    .finally(() => {
      document.body.style.cursor = "default"
    })
}
