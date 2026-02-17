import type { SavedInvoice } from "./database"
import jsPDF from 'jspdf'

// ─── helpers ────────────────────────────────────────────────────────────────

const BRAND = '#934435'
const LIGHT  = '#f8ecec'

function hex2rgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return [r, g, b]
}

function setColor(pdf: jsPDF, hex: string, target: 'fill' | 'draw' | 'text' = 'text') {
  const [r, g, b] = hex2rgb(hex)
  if (target === 'fill')  pdf.setFillColor(r, g, b)
  else if (target === 'draw') pdf.setDrawColor(r, g, b)
  else pdf.setTextColor(r, g, b)
}

function fmtNum(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('sl-SI')
}

// load an image URL → base64 data-url; returns null on error
async function loadImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
    const mime = res.headers.get('content-type') || 'image/png'
    return `data:${mime};base64,${b64}`
  } catch {
    return null
  }
}

// ─── core renderer ──────────────────────────────────────────────────────────

interface RenderOptions {
  documentLabel: string  // 'Račun' | 'Ponudba' | 'Dobropis'
  documentNumber: string
  isOffer?: boolean
  isCreditNote?: boolean
}

async function renderDocumentPDF(
  invoice: SavedInvoice & { invoiceNumber?: string; offerNumber?: string; creditNoteNumber?: string },
  opts: RenderOptions
): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true })

  const PW  = 210
  const PH  = 297
  const ML  = 14   // left margin
  const MR  = 14   // right margin
  const MT  = 12   // top margin
  const CW  = PW - ML - MR  // content width (182 mm)

  // ── load images (parallel) ─────────────────────────────────────────────
  const [logoData, signData] = await Promise.all([
    loadImage('/images/2km-logo.png'),
    loadImage('/images/signature-logo.png'),
  ])

  let y = MT

  // ── LOGO top-right ─────────────────────────────────────────────────────
  if (logoData) {
    const lw = 40, lh = 17
    pdf.addImage(logoData, 'PNG', PW - MR - lw, y, lw, lh)
  }
  y += 22

  // ── red divider line ───────────────────────────────────────────────────
  setColor(pdf, BRAND, 'draw')
  pdf.setLineWidth(0.4)
  pdf.line(ML, y, PW - MR, y)
  y += 6

  // ── two-column header (customer left, company right) ───────────────────
  // Start both columns at same y position
  const headerStartY = y

  // LEFT – customer info
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(0, 0, 0)
  pdf.text(invoice.customer.Stranka || '', ML, y)
  y += 5.5

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  const custLines = [
    invoice.customer.Naslov,
    invoice.customer.Kraj_postna_st,
    invoice.customer.email,
  ].filter(Boolean) as string[]
  custLines.forEach(line => { pdf.text(line, ML, y); y += 4.2 })

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8.5)
  pdf.text('ID za DDV: ', ML, y)
  const idW = pdf.getTextWidth('ID za DDV: ')
  pdf.setFont('helvetica', 'normal')
  pdf.text(invoice.customer.ID_DDV || '', ML + idW, y)

  // RIGHT – our company info (tiny, right-aligned), starts at same headerStartY
  const compLines = [
    { text: '2KM Consulting d.o.o., podjetniško in poslovno svetovanje', bold: true },
    { text: 'Športna ulica 22, 1000 Ljubljana', bold: false },
    { text: 'MŠ: 6315992000', bold: false },
    { text: 'ID. št. za DDV: SI 10628169', bold: false },
    { text: 'Osnovni kapital: 7.500,00 EUR', bold: false },
    { text: 'Datum vpisa v SR: 13.2.2013, Okrožno sodišče Koper', bold: false },
    { text: '', bold: false },
    { text: 'Poslovni račun št:', bold: false },
    { text: 'IBAN: SI56 0223 6026 1489 640', bold: false },
    { text: 'Nova Ljubljanska banka d.d., Ljubljana', bold: false },
    { text: 'Trg republike 2, 1520 Ljubljana', bold: false },
    { text: 'SWIFT: LJBASI2X', bold: false },
  ]
  pdf.setFontSize(7)
  let yr = headerStartY
  compLines.forEach(({ text, bold }) => {
    if (text) {
      pdf.setFont('helvetica', bold ? 'bold' : 'normal')
      pdf.text(text, PW - MR, yr, { align: 'right' })
    }
    yr += 3.6
  })

  // dates block starts after customer info (left column continues)
  y += 8

  // ── dates block (left) + IBAN block continues right ────────────────────
  pdf.setFontSize(8.5)
  pdf.setTextColor(0, 0, 0)
  const dateRows: [string, string][] = [
    ['Ljubljana:', fmtDate(invoice.issueDate)],
    [opts.isOffer ? 'Veljavnost:' : 'Valuta:', fmtDate(invoice.dueDate)],
  ]
  if (!opts.isOffer) {
    dateRows.push(['Datum opr. storitve:', fmtDate(invoice.serviceDate)])
  }
  dateRows.forEach(([label, val]) => {
    pdf.setFont('helvetica', 'bold'); pdf.text(label, ML, y)
    pdf.setFont('helvetica', 'normal'); pdf.text(val, ML + pdf.getTextWidth(label) + 1.5, y)
    y += 5
  })
  y += 6

  // ── document number – in a light box with letter-spacing style ──────────
  const boxH = 9
  setColor(pdf, '#eeeeee', 'fill')
  pdf.rect(ML, y - 6.5, CW, boxH, 'F')
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  // Build spaced label like "R a č u n :"
  const spacedLabel = opts.documentLabel.split('').join(' ')
  pdf.text(`${spacedLabel}:  ${opts.documentNumber}`, ML + 3, y)
  y += 5

  // ── thin divider ───────────────────────────────────────────────────────
  pdf.setDrawColor(180, 180, 180)
  pdf.setLineWidth(0.25)
  pdf.line(ML, y, PW - MR, y)
  y += 6

  // ── service description ────────────────────────────────────────────────
  if (invoice.serviceDescription && invoice.serviceDescription.trim()) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8.5)
    pdf.setTextColor(0,0,0)
    const label = opts.isCreditNote ? 'Razlog za dobropis:' : 'Opis storitve:'
    pdf.text(label, ML, y)
    y += 5
    pdf.setFont('helvetica', 'normal')
    const descLines = pdf.splitTextToSize(invoice.serviceDescription, CW)
    descLines.forEach((line: string) => { pdf.text(line, ML, y); y += 4.5 })
    y += 4
  }

  // ── ITEMS TABLE ────────────────────────────────────────────────────────
  const colWidths = [CW - 24 - 24 - 28, 24, 24, 28]  // desc, qty, price, total
  const colX = [ML, ML + colWidths[0], ML + colWidths[0] + colWidths[1], ML + colWidths[0] + colWidths[1] + colWidths[2]]
  const rowH = 6.5

  // header row
  setColor(pdf, LIGHT, 'fill')
  pdf.rect(ML, y, CW, rowH, 'F')
  setColor(pdf, '#cccccc', 'draw')
  pdf.setLineWidth(0.25)
  pdf.rect(ML, y, CW, rowH, 'S')

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(0,0,0)
  const headers = ['Postavka', 'Količina', 'Cena (EUR)', 'Skupaj (EUR)']
  headers.forEach((h, i) => {
    const align = i === 0 ? 'left' : 'right'
    const x = i === 0 ? colX[i] + 1.5 : colX[i] + colWidths[i] - 1.5
    pdf.text(h, x, y + rowH - 1.8, { align })
  })
  y += rowH

  // data rows
  pdf.setFont('helvetica', 'normal')
  invoice.items.forEach((item, idx) => {
    const bg = idx % 2 === 1 ? '#fafafa' : '#ffffff'
    setColor(pdf, bg, 'fill')
    pdf.rect(ML, y, CW, rowH, 'F')
    setColor(pdf, '#cccccc', 'draw')
    pdf.setLineWidth(0.2)
    pdf.rect(ML, y, CW, rowH, 'S')

    pdf.setTextColor(0,0,0)
    // description – truncate if too long
    const descMax = colWidths[0] - 3
    let desc = item.description
    while (pdf.getTextWidth(desc) > descMax && desc.length > 0) desc = desc.slice(0, -1)
    pdf.text(desc, colX[0] + 1.5, y + rowH - 1.8)
    pdf.text(fmtNum(item.quantity),  colX[1] + colWidths[1] - 1.5, y + rowH - 1.8, { align: 'right' })
    pdf.text(fmtNum(item.price),     colX[2] + colWidths[2] - 1.5, y + rowH - 1.8, { align: 'right' })
    pdf.text(fmtNum(item.total),     colX[3] + colWidths[3] - 1.5, y + rowH - 1.8, { align: 'right' })
    y += rowH
  })

  // totals rows
  const totals: [string, number][] = [
    ['Skupaj brez DDV:', invoice.totalWithoutVat],
    ['DDV (22%):', invoice.vat],
    [opts.isCreditNote ? 'Skupaj za vračilo:' : 'Skupaj za plačilo:', invoice.totalPayable],
  ]
  totals.forEach(([label, val], i) => {
    const isFinal = i === totals.length - 1
    if (isFinal) { setColor(pdf, LIGHT, 'fill'); pdf.rect(ML, y, CW, rowH, 'F') }
    setColor(pdf, '#cccccc', 'draw')
    pdf.setLineWidth(0.2)
    pdf.rect(ML, y, CW, rowH, 'S')
    pdf.setFont('helvetica', isFinal ? 'bold' : 'normal')
    pdf.setTextColor(0,0,0)
    pdf.text(label, ML + 1.5, y + rowH - 1.8)
    pdf.text(fmtNum(val), colX[3] + colWidths[3] - 1.5, y + rowH - 1.8, { align: 'right' })
    y += rowH
  })
  y += 6

  // ── payment info ───────────────────────────────────────────────────────
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)

  if (opts.isOffer) {
    pdf.text('Po opravljeni storitvi bo izdan račun za plačilo.', ML, y); y += 5
  }

  const refLabel   = opts.isCreditNote ? 'Znesek vračila na TRR:' : 'Znesek nakažite na TRR:'
  const sklicLabel = opts.isCreditNote
    ? 'Pri vračilu se sklicujte na št. dobropisa:'
    : 'Pri plačilu se sklicujte na št. računa:'
  const iban = 'SI56 0223 6026 1489 640'

  const printRow = (lbl: string, val: string) => {
    pdf.setFont('helvetica', 'normal'); pdf.text(lbl, ML, y)
    pdf.setFont('helvetica', 'bold');   pdf.text(val, ML + 90, y)
    y += 5
  }
  printRow(refLabel, iban)
  printRow(sklicLabel, opts.documentNumber)

  y += 2
  if (opts.isCreditNote) {
    pdf.setFont('helvetica', 'normal')
    pdf.text('Vračilo zneska bo izvedeno v roku 14 dni.', ML, y); y += 5
  } else if (!opts.isOffer) {
    pdf.setFont('helvetica', 'bold')
    pdf.text('V primeru zamude se zaračunavajo zamudne obresti.', ML, y); y += 5
  }

  y += 2
  pdf.setFont('helvetica', 'bold')
  pdf.text('Hvala za sodelovanje!', ML, y)
  y += 8

  // ── signature: label first, then logo below ────────────────────────────
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('2KM Consulting d.o.o.', PW - MR, y, { align: 'right' })
  y += 3
  if (signData) {
    const sw = 38, sh = 19
    pdf.addImage(signData, 'PNG', PW - MR - sw, y, sw, sh)
  }

  // ── FOOTER ─────────────────────────────────────────────────────────────
  const fy = PH - 10
  setColor(pdf, BRAND, 'draw')
  pdf.setLineWidth(0.4)
  pdf.line(ML, fy - 18, PW - MR, fy - 18)

  pdf.setFontSize(7)
  setColor(pdf, BRAND)
  pdf.setFont('helvetica', 'bold')
  pdf.text('2KM Consulting d.o.o., podjetniško in poslovno svetovanje', PW - MR - 8, fy - 14, { align: 'right' })
  pdf.setFont('helvetica', 'normal')
  pdf.text('Športna ulica 22, 1000 Ljubljana', PW - MR - 8, fy - 10, { align: 'right' })
  pdf.text('DŠ: SI 10628169',                  PW - MR - 8, fy - 6,  { align: 'right' })
  pdf.text('TRR: SI56 0223 6026 1489 640 (NLB)', PW - MR - 8, fy - 2, { align: 'right' })

  return new Blob([pdf.output('blob')], { type: 'application/pdf' })
}

// ─── PUBLIC API – invoice ───────────────────────────────────────────────────

export async function generateInvoicePDFFromElement(
  _element: HTMLElement,
  invoice: SavedInvoice
): Promise<Blob> {
  return renderDocumentPDF(invoice as any, {
    documentLabel: 'Račun',
    documentNumber: invoice.invoiceNumber,
  })
}

export function downloadInvoicePDFFromPreview(
  invoice: SavedInvoice,
  _previewElementId = 'invoice-preview-content'
) {
  const customerName = (invoice.customer.Stranka || '').replace(/[<>:"/\\|?*]/g, '').trim()
  const num = invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, ' ')
  generateInvoicePDFFromElement(null as any, invoice).then(blob => {
    triggerDownload(blob, `${num} ${customerName}.pdf`)
  }).catch(err => alert('Napaka pri generiranju PDF-ja: ' + err.message))
}

export function downloadInvoicePDF(invoice: SavedInvoice) {
  downloadInvoicePDFFromPreview(invoice)
}

// ─── PUBLIC API – offer ────────────────────────────────────────────────────

type SavedOffer = SavedInvoice & { offerNumber: string }

export async function generateOfferPDFFromElement(
  _element: HTMLElement,
  offer: SavedOffer
): Promise<Blob> {
  return renderDocumentPDF({ ...offer, invoiceNumber: offer.offerNumber } as any, {
    documentLabel: 'Ponudba',
    documentNumber: offer.offerNumber,
    isOffer: true,
  })
}

export function downloadOfferPDFFromPreview(
  offer: SavedOffer,
  _previewElementId = 'offer-preview-content'
) {
  const customerName = (offer.customer.Stranka || '').replace(/[<>:"/\\|?*]/g, '').trim()
  const num = offer.offerNumber.replace(/[^a-zA-Z0-9]/g, ' ')
  generateOfferPDFFromElement(null as any, offer).then(blob => {
    triggerDownload(blob, `${num} ${customerName}.pdf`)
  }).catch(err => alert('Napaka pri generiranju PDF-ja: ' + err.message))
}

export function downloadOfferPDF(offer: SavedOffer) {
  downloadOfferPDFFromPreview(offer)
}

// ─── PUBLIC API – credit-note ──────────────────────────────────────────────

type SavedCreditNote = SavedInvoice & { creditNoteNumber: string }

export async function generateCreditNotePDFFromElement(
  _element: HTMLElement,
  creditNote: SavedCreditNote
): Promise<Blob> {
  return renderDocumentPDF({ ...creditNote, invoiceNumber: creditNote.creditNoteNumber } as any, {
    documentLabel: 'Dobropis',
    documentNumber: creditNote.creditNoteNumber,
    isCreditNote: true,
  })
}

export function downloadCreditNotePDFFromPreview(
  creditNote: SavedCreditNote,
  _previewElementId = 'credit-note-preview-content'
) {
  const customerName = (creditNote.customer.Stranka || '').replace(/[<>:"/\\|?*]/g, '').trim()
  const num = creditNote.creditNoteNumber.replace(/[^a-zA-Z0-9]/g, ' ')
  generateCreditNotePDFFromElement(null as any, creditNote).then(blob => {
    triggerDownload(blob, `${num} ${customerName}.pdf`)
  }).catch(err => alert('Napaka pri generiranju PDF-ja: ' + err.message))
}

export function downloadCreditNotePDF(creditNote: SavedCreditNote) {
  downloadCreditNotePDFFromPreview(creditNote)
}

// ─── helper ────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
