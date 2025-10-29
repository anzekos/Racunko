import type { SavedInvoice } from "./database"

// Import type za Offer in CreditNote (dodaj v database.ts če še ni)
type SavedOffer = SavedInvoice & { offerNumber: string }
type SavedCreditNote = SavedInvoice & { creditNoteNumber: string }
type DocumentType = SavedInvoice | SavedOffer | SavedCreditNote

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

// Funkcija za dodajanje footera na dno PDF-ja
function addFooterToPDF(pdf: jsPDF, document: DocumentType) {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  
  const margin = 10;
  const footerY = pageHeight - margin;
  
  const lineWidth = 0.4;
  const lineShortening = 10;
  
  pdf.setDrawColor(147, 68, 53);
  pdf.setLineWidth(lineWidth);
  
  const lineStartX = margin + lineShortening;
  const lineEndX = pageWidth - margin - lineShortening;
  
  pdf.line(lineStartX, footerY - 18, lineEndX, footerY - 18);
  
  const textOffset = 10;

  pdf.setFontSize(7);
  pdf.setTextColor(147, 68, 53);
  pdf.setFont('helvetica', 'bold');
  pdf.text('2KM Consulting d.o.o., podjetniško in poslovno svetovanje', pageWidth - margin - textOffset, footerY - 14, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.text('Športna ulica 22, 1000 Ljubljana', pageWidth - margin - textOffset, footerY - 10, { align: 'right' });
  pdf.text('DŠ: SI 10628169', pageWidth - margin - textOffset, footerY - 6, { align: 'right' });
  pdf.text('TRR: SI56 0223 6026 1489 640 (NLB)', pageWidth - margin - textOffset, footerY - 2, { align: 'right' });
}

// Pomožna funkcija za kompresijo PNG
async function compressPNG(dataUrl: string, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0)
      
      // JPEG kompresija za manjšo velikost z visoko kvaliteto (95%)
      const compressed = canvas.toDataURL('image/jpeg', quality)
      resolve(compressed)
    }
    img.src = dataUrl
  })
}

// Pomožna funkcija za pridobitev številke dokumenta
function getDocumentNumber(document: DocumentType): string {
  if ('invoiceNumber' in document) return document.invoiceNumber
  if ('offerNumber' in document) return (document as any).offerNumber
  if ('creditNoteNumber' in document) return (document as any).creditNoteNumber
  return 'unknown'
}

// UNIVERZALNA FUNKCIJA: Optimizirana za vektorsko kvaliteto in majhno velikost
export async function generateDocumentPDFFromElement(element: HTMLElement, document: DocumentType): Promise<Blob> {
  try {
    // Skrijemo akcijske gumbe
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = 'none'
    })

    // Kloniramo element
    const clonedElement = element.cloneNode(true) as HTMLElement
    
    // Odstranimo footer elemente, ker jih dodamo ročno v PDF
    const footerElements = clonedElement.querySelectorAll('.normal-footer')
    footerElements.forEach(footer => footer.remove())
    
    // Ustvarimo začasen div
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'fixed'
    tempDiv.style.top = '-9999px'
    tempDiv.style.left = '0'
    tempDiv.style.width = '210mm'
    tempDiv.style.overflow = 'visible'
    tempDiv.style.backgroundColor = '#ffffff'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    tempDiv.style.fontSize = '9pt'
    tempDiv.style.padding = '0'
    tempDiv.appendChild(clonedElement)
    document.body.appendChild(tempDiv)

    // Počakamo, da se vse naloži
    await new Promise(resolve => setTimeout(resolve, 500))

    // Normaliziramo barve
    const allElements = tempDiv.querySelectorAll('*')
    allElements.forEach(el => {
      const element = el as HTMLElement
      normalizeColors(element)
    })

    // Renderanje z html2canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2.0,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: tempDiv.scrollWidth,
      height: tempDiv.scrollHeight,
      imageTimeout: 0,
      removeContainer: true,
      onclone: (clonedDoc) => {
        const clonedElements = clonedDoc.querySelectorAll('*')
        clonedElements.forEach(el => {
          const element = el as HTMLElement
          normalizeColors(element)
        })
      }
    })

    // Počistimo
    document.body.removeChild(tempDiv)
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = ''
    })

    // PNG z optimizirano kompresijo
    const imgData = canvas.toDataURL('image/png')
    
    // Kompresija z 95% kvalitete za optimalen kompromis
    const compressedImgData = await compressPNG(imgData, 0.95)
    
    const pdf = new jsPDF('p', 'mm', 'a4', true) // true = compress PDF
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    const margin = 10;
    const topMargin = 10;
    const imgWidth = pdfWidth - (2 * margin)
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    const availableHeight = pdfHeight - topMargin - margin - 20
    
    if (imgHeight <= availableHeight) {
      pdf.addImage(compressedImgData, 'JPEG', margin, topMargin, imgWidth, imgHeight, undefined, 'FAST')
    } else {
      const scale = availableHeight / imgHeight
      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale
      
      pdf.addImage(compressedImgData, 'JPEG', (pdfWidth - scaledWidth) / 2, topMargin, scaledWidth, scaledHeight, undefined, 'FAST')
    }

    // Dodamo footer
    addFooterToPDF(pdf, document)

    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
  } catch (error) {
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = ''
    })
    throw error
  }
}

// Pomožna funkcija za generiranje imena datoteke
function generatePDFFilename(document: DocumentType, docType: 'invoice' | 'offer' | 'credit-note'): string {
  const customerName = document.customer.Stranka.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-")
  const docNumber = getDocumentNumber(document).replace(/[^a-zA-Z0-9]/g, "-")
  
  const prefix = {
    'invoice': 'racun',
    'offer': 'ponudba',
    'credit-note': 'dobropis'
  }[docType]
  
  return `${customerName}-${prefix}-${docNumber}.pdf`
}

// INVOICE funkcije (ohranimo stare za kompatibilnost)
export async function generateInvoicePDFFromElement(element: HTMLElement, invoice: SavedInvoice): Promise<Blob> {
  return generateDocumentPDFFromElement(element, invoice)
}

export function downloadInvoicePDFFromPreview(invoice: SavedInvoice, previewElementId: string = 'invoice-preview-content') {
  const filename = generatePDFFilename(invoice, 'invoice')

  const element = document.getElementById(previewElementId)
  if (!element) {
    throw new Error(`Element z ID "${previewElementId}" ni bil najden`)
  }

  generateDocumentPDFFromElement(element, invoice)
    .then((pdfBlob) => {
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    .catch(error => {
      console.error('Napaka pri generiranju PDF-ja:', error)
      alert('Napaka pri generiranju PDF-ja: ' + error.message)
    })
}

// OFFER funkcije
export async function generateOfferPDFFromElement(element: HTMLElement, offer: SavedOffer): Promise<Blob> {
  return generateDocumentPDFFromElement(element, offer)
}

export function downloadOfferPDFFromPreview(offer: SavedOffer, previewElementId: string = 'offer-preview-content') {
  const filename = generatePDFFilename(offer, 'offer')

  const element = document.getElementById(previewElementId)
  if (!element) {
    throw new Error(`Element z ID "${previewElementId}" ni bil najden`)
  }

  generateDocumentPDFFromElement(element, offer)
    .then((pdfBlob) => {
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    .catch(error => {
      console.error('Napaka pri generiranju PDF-ja:', error)
      alert('Napaka pri generiranju PDF-ja: ' + error.message)
    })
}

export function downloadOfferPDF(offer: SavedOffer) {
  downloadOfferPDFFromPreview(offer, 'offer-preview-content')
}

// CREDIT NOTE funkcije
export async function generateCreditNotePDFFromElement(element: HTMLElement, creditNote: SavedCreditNote): Promise<Blob> {
  return generateDocumentPDFFromElement(element, creditNote)
}

export function downloadCreditNotePDFFromPreview(creditNote: SavedCreditNote, previewElementId: string = 'credit-note-preview-content') {
  const filename = generatePDFFilename(creditNote, 'credit-note')

  const element = document.getElementById(previewElementId)
  if (!element) {
    throw new Error(`Element z ID "${previewElementId}" ni bil najden`)
  }

  generateDocumentPDFFromElement(element, creditNote)
    .then((pdfBlob) => {
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    .catch(error => {
      console.error('Napaka pri generiranju PDF-ja:', error)
      alert('Napaka pri generiranju PDF-ja: ' + error.message)
    })
}

export function downloadCreditNotePDF(creditNote: SavedCreditNote) {
  downloadCreditNotePDFFromPreview(creditNote, 'credit-note-preview-content')
}

// Še za kompatibilnost z invoices - downloadInvoicePDF
export function downloadInvoicePDF(invoice: SavedInvoice) {
  downloadInvoicePDFFromPreview(invoice, 'invoice-preview-content')
}
