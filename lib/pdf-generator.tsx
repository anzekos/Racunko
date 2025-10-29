// lib/pdf-generator.ts
import type { SavedInvoice, SavedOffer, SavedCreditNote } from "./database"
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
function addFooterToPDF(pdf: jsPDF, document: SavedInvoice | SavedOffer | SavedCreditNote) {
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

// ENOTNA funkcija za generiranje PDF-ja iz elementa
export async function generateInvoicePDFFromElement(element: HTMLElement, invoice: SavedInvoice): Promise<Blob> {
  return generatePDFFromElement(element, invoice)
}

export async function generateOfferPDFFromElement(element: HTMLElement, offer: SavedOffer): Promise<Blob> {
  return generatePDFFromElement(element, offer)
}

export async function generateCreditNotePDFFromElement(element: HTMLElement, creditNote: SavedCreditNote): Promise<Blob> {
  return generatePDFFromElement(element, creditNote)
}

async function generatePDFFromElement(element: HTMLElement, document: SavedInvoice | SavedOffer | SavedCreditNote): Promise<Blob> {
  try {
    // Preverimo, če element obstaja
    if (!element) {
      throw new Error('Element ne obstaja')
    }

    // Shranimo originalne stile za obnovitev
    const originalStyles: { element: HTMLElement; display: string }[] = []
    
    // Skrijemo akcijske gumbe
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      const buttonElement = btn as HTMLElement
      originalStyles.push({
        element: buttonElement,
        display: buttonElement.style.display
      })
      buttonElement.style.display = 'none'
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
    tempDiv.style.fontSize = '10pt'
    tempDiv.style.padding = '0'
    tempDiv.appendChild(clonedElement)
    document.body.appendChild(tempDiv)

    // Počakamo, da se vse naloži
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Normaliziramo barve
    const allElements = tempDiv.querySelectorAll('*')
    allElements.forEach(el => {
      const element = el as HTMLElement
      normalizeColors(element)
    })

    // Ustvarimo canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 1.5,
      useCORS: true,
      allowTaint: false, // Spremenjeno iz true v false
      backgroundColor: '#ffffff',
      logging: false,
      width: tempDiv.scrollWidth,
      height: tempDiv.scrollHeight,
      onclone: (clonedDoc, element) => {
        // Normaliziramo barve v kloniranem dokumentu
        const clonedElements = element.querySelectorAll('*')
        clonedElements.forEach(el => {
          const clonedElement = el as HTMLElement
          normalizeColors(clonedElement)
        })
      }
    })

    // Počistimo
    document.body.removeChild(tempDiv)
    
    // Obnovimo originalne stile
    originalStyles.forEach(style => {
      style.element.style.display = style.display
    })

    // Ustvarimo PDF
    const imgData = canvas.toDataURL('image/jpeg', 0.85)
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    const margin = 10;
    const topMargin = 10;
    const imgWidth = pdfWidth - (2 * margin)
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    const availableHeight = pdfHeight - topMargin - margin - 20
    
    if (imgHeight <= availableHeight) {
      pdf.addImage(imgData, 'JPEG', margin, topMargin, imgWidth, imgHeight)
    } else {
      const scale = availableHeight / imgHeight
      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale
      
      pdf.addImage(imgData, 'JPEG', (pdfWidth - scaledWidth) / 2, topMargin, scaledWidth, scaledHeight)
    }

    // Dodamo footer
    addFooterToPDF(pdf, document)

    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
  } catch (error) {
    console.error('Napaka pri generiranju PDF-ja:', error)
    
    // Obnovimo originalne stile tudi v primeru napake
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = ''
    })
    
    throw error
  }
}

// Funkcije za prenos PDF-jev
export function downloadInvoicePDFFromPreview(invoice: SavedInvoice, previewElementId: string = 'invoice-preview-content') {
  const customerName = invoice.customer.Stranka?.replace(/[^a-zA-Z0-9\s]/g, "")?.replace(/\s+/g, "-") || 'stranka'
  const invoiceNum = invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, "-")
  const filename = `${customerName}-${invoiceNum}.pdf`

  const element = document.getElementById(previewElementId)
  if (!element) {
    console.error(`Element z ID "${previewElementId}" ni bil najden`)
    alert(`Element z ID "${previewElementId}" ni bil najden`)
    return
  }

  generateInvoicePDFFromElement(element, invoice)
    .then((pdfBlob) => {
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 100)
    })
    .catch(error => {
      console.error('Napaka pri generiranju PDF-ja:', error)
      alert('Napaka pri generiranju PDF-ja: ' + error.message)
    })
}

export function downloadOfferPDFFromPreview(offer: SavedOffer, previewElementId: string = 'offer-preview-content') {
  const customerName = offer.customer.Stranka?.replace(/[^a-zA-Z0-9\s]/g, "")?.replace(/\s+/g, "-") || 'stranka'
  const offerNum = offer.offerNumber.replace(/[^a-zA-Z0-9]/g, "-")
  const filename = `${customerName}-${offerNum}.pdf`

  const element = document.getElementById(previewElementId)
  if (!element) {
    console.error(`Element z ID "${previewElementId}" ni bil najden`)
    alert(`Element z ID "${previewElementId}" ni bil najden`)
    return
  }

  generateOfferPDFFromElement(element, offer)
    .then((pdfBlob) => {
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 100)
    })
    .catch(error => {
      console.error('Napaka pri generiranju PDF-ja:', error)
      alert('Napaka pri generiranju PDF-ja: ' + error.message)
    })
}

export function downloadCreditNotePDFFromPreview(creditNote: SavedCreditNote, previewElementId: string = 'credit-note-preview-content') {
  const customerName = creditNote.customer.Stranka?.replace(/[^a-zA-Z0-9\s]/g, "")?.replace(/\s+/g, "-") || 'stranka'
  const creditNoteNum = creditNote.creditNoteNumber.replace(/[^a-zA-Z0-9]/g, "-")
  const filename = `${customerName}-${creditNoteNum}.pdf`

  const element = document.getElementById(previewElementId)
  if (!element) {
    console.error(`Element z ID "${previewElementId}" ni bil najden`)
    alert(`Element z ID "${previewElementId}" ni bil najden`)
    return
  }

  generateCreditNotePDFFromElement(element, creditNote)
    .then((pdfBlob) => {
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 100)
    })
    .catch(error => {
      console.error('Napaka pri generiranju PDF-ja:', error)
      alert('Napaka pri generiranju PDF-ja: ' + error.message)
    })
}

// Preproste funkcije za prenos
export function downloadInvoicePDF(invoice: SavedInvoice) {
  downloadInvoicePDFFromPreview(invoice)
}

export function downloadOfferPDF(offer: SavedOffer) {
  downloadOfferPDFFromPreview(offer)
}

export function downloadCreditNotePDF(creditNote: SavedCreditNote) {
  downloadCreditNotePDFFromPreview(creditNote)
}
