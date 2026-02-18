import type { SavedInvoice } from "./database"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Type za Offer (offerNumber namesto invoiceNumber)
type SavedOffer = SavedInvoice & { offerNumber: string }

// Pomožna funkcija za pretvorbo oklch barv v hex/rgb
function convertOklchToHex(oklchValue: string): string {
  if (!oklchValue.includes('oklch')) return oklchValue
  if (oklchValue.includes('0.7') && oklchValue.includes('0.05')) return '#934435'
  if (oklchValue.includes('0.95')) return '#f8ecec'
  if (oklchValue.includes('0.87')) return '#cccccc'
  return '#000000'
}

// Pomožna funkcija za normalizacijo CSS barv
function normalizeColors(element: HTMLElement) {
  const computedStyle = window.getComputedStyle(element)

  if (computedStyle.color.includes('oklch')) {
    element.style.color = convertOklchToHex(computedStyle.color)
  }

  if (computedStyle.backgroundColor.includes('oklch')) {
    element.style.backgroundColor = convertOklchToHex(computedStyle.backgroundColor)
  }

  if (computedStyle.borderColor.includes('oklch')) {
    element.style.borderColor = convertOklchToHex(computedStyle.borderColor)
  }
}

// Vektorski footer (oster tekst)
function addFooterToPDF(pdf: jsPDF, offer: SavedOffer) {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const margin = 10
  const footerY = pageHeight - margin

  const lineWidth = 0.4
  const lineShortening = 10

  pdf.setDrawColor(147, 68, 53)
  pdf.setLineWidth(lineWidth)

  const lineStartX = margin + lineShortening
  const lineEndX = pageWidth - margin - lineShortening

  pdf.line(lineStartX, footerY - 18, lineEndX, footerY - 18)

  const textOffset = 10

  pdf.setFontSize(7)
  pdf.setTextColor(147, 68, 53)
  pdf.setFont('helvetica', 'bold')
  pdf.text(
    '2KM Consulting d.o.o., podjetniško in poslovno svetovanje',
    pageWidth - margin - textOffset,
    footerY - 14,
    { align: 'right' }
  )

  pdf.setFont('helvetica', 'normal')
  pdf.text('Športna ulica 22, 1000 Ljubljana', pageWidth - margin - textOffset, footerY - 10, { align: 'right' })
  pdf.text('DŠ: SI 10628169', pageWidth - margin - textOffset, footerY - 6, { align: 'right' })
  pdf.text('TRR: SI56 0223 6026 1489 640 (NLB)', pageWidth - margin - textOffset, footerY - 2, { align: 'right' })
}

// High-DPI PDF render za ponudbo
export async function generateOfferPDFFromElement(
  element: HTMLElement,
  offer: SavedOffer
): Promise<Blob> {
  try {
    // 1. Skrijemo gumbe
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = 'none'
    })

    // 2. Klon za čist render
    const clonedElement = element.cloneNode(true) as HTMLElement

    // Odstranimo HTML footerje
    const footerElements = clonedElement.querySelectorAll('.normal-footer')
    footerElements.forEach(f => f.remove())

    // Začasni container
    const tempDiv = document.createElement('div')
    Object.assign(tempDiv.style, {
      position: 'fixed',
      top: '-10000px',
      left: '0',
      width: '210mm',
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '9pt',
      color: '#000000',
      webkitFontSmoothing: 'antialiased'
    })

    tempDiv.appendChild(clonedElement)
    document.body.appendChild(tempDiv)

    await new Promise(resolve => setTimeout(resolve, 300))

    // Normalizacija barv
    tempDiv.querySelectorAll('*').forEach(el => {
      normalizeColors(el as HTMLElement)
    })

    // 3. High-DPI render (300 DPI)
    const canvas = await html2canvas(tempDiv, {
      scale: 3.0,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: tempDiv.scrollWidth,
      height: tempDiv.scrollHeight,
      imageTimeout: 0,
      onclone: doc => {
        doc.querySelectorAll('*').forEach(el => normalizeColors(el as HTMLElement))
      }
    })

    // Cleanup
    document.body.removeChild(tempDiv)
    actionButtons.forEach(btn => ((btn as HTMLElement).style.display = ''))

    // 4. PDF
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    const margin = 10
    const topMargin = 10

    const imgWidth = pdfWidth - 2 * margin
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const availableHeight = pdfHeight - topMargin - margin - 20

    let renderWidth = imgWidth
    let renderHeight = imgHeight
    let renderX = margin

    if (imgHeight > availableHeight) {
      const scale = availableHeight / imgHeight
      renderWidth *= scale
      renderHeight *= scale
      renderX = (pdfWidth - renderWidth) / 2
    }

    pdf.addImage(
      canvas,
      'PNG',
      renderX,
      topMargin,
      renderWidth,
      renderHeight,
      undefined,
      'FAST'
    )

    addFooterToPDF(pdf, offer)

    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
  } catch (error) {
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => ((btn as HTMLElement).style.display = ''))
    throw error
  }
}

// Download funkcija
export function downloadOfferPDFFromPreview(
  offer: SavedOffer,
  previewElementId: string = 'offer-preview-content'
) {
  const customerName = offer.customer.Stranka
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const offerNum = offer.offerNumber
    .replace(/[^a-zA-Z0-9-]/g, ' ')
    .trim()

  const filename = `${offerNum} ${customerName}.pdf`

  const element = document.getElementById(previewElementId)
  if (!element) {
    alert('Napaka: Predogled ponudbe ni bil najden.')
    return
  }

  document.body.style.cursor = 'wait'

  generateOfferPDFFromElement(element, offer)
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    .catch(err => {
      console.error(err)
      alert('Napaka pri generiranju PDF-ja: ' + err.message)
    })
    .finally(() => {
      document.body.style.cursor = 'default'
    })
}

// Alias
export function downloadOfferPDF(offer: SavedOffer) {
  downloadOfferPDFFromPreview(offer, 'offer-preview-content')
}
