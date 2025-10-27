// lib/offer-pdf-generator.ts
import type { SavedOffer } from "./database"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function convertOklchToHex(oklchValue: string): string {
  if (!oklchValue.includes('oklch')) return oklchValue
  if (oklchValue.includes('0.7') && oklchValue.includes('0.05')) return '#934435'
  if (oklchValue.includes('0.95')) return '#f8ecec'
  if (oklchValue.includes('0.87')) return '#cccccc'
  return '#000000'
}

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

function addFooterToPDF(pdf: jsPDF, offer: SavedOffer) {
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

  pdf.setFontSize(8);
  pdf.setTextColor(147, 68, 53);
  pdf.setFont('helvetica', 'bold');
  pdf.text('2KM Consulting d.o.o., podjetniško in poslovno svetovanje', pageWidth - margin - textOffset, footerY - 14, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.text('Športna ulica 22, 1000 Ljubljana', pageWidth - margin - textOffset, footerY - 10, { align: 'right' });
  pdf.text('DŠ: SI 10628169', pageWidth - margin - textOffset, footerY - 6, { align: 'right' });
  pdf.text('TRR: SI56 0223 6026 1489 640 (NLB)', pageWidth - margin - textOffset, footerY - 2, { align: 'right' });
}

export async function generateOfferPDFFromElement(element: HTMLElement, offer: SavedOffer): Promise<Blob> {
  try {
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = 'none'
    })

    const clonedElement = element.cloneNode(true) as HTMLElement
    
    const footerElements = clonedElement.querySelectorAll('.normal-footer')
    footerElements.forEach(footer => footer.remove())
    
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'fixed'
    tempDiv.style.top = '-9999px'
    tempDiv.style.left = '0'
    tempDiv.style.width = '210mm'
    tempDiv.style.overflow = 'visible'
    tempDiv.style.backgroundColor = '#ffffff'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    tempDiv.style.fontSize = '12pt'
    tempDiv.style.padding = '0'
    tempDiv.appendChild(clonedElement)
    document.body.appendChild(tempDiv)

    await new Promise(resolve => setTimeout(resolve, 500))

    const allElements = tempDiv.querySelectorAll('*')
    allElements.forEach(el => {
      const element = el as HTMLElement
      normalizeColors(element)
    })

    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: tempDiv.scrollWidth,
      height: tempDiv.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedElements = clonedDoc.querySelectorAll('*')
        clonedElements.forEach(el => {
          const element = el as HTMLElement
          normalizeColors(element)
        })
      }
    })

    document.body.removeChild(tempDiv)
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = ''
    })

    const imgData = canvas.toDataURL('image/png', 1.0)
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    const margin = 10;
    const topMargin = 10;
    const imgWidth = pdfWidth - (2 * margin)
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    const availableHeight = pdfHeight - topMargin - margin - 20
    
    if (imgHeight <= availableHeight) {
      pdf.addImage(imgData, 'PNG', margin, topMargin, imgWidth, imgHeight)
    } else {
      const scale = availableHeight / imgHeight
      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale
      
      pdf.addImage(imgData, 'PNG', (pdfWidth - scaledWidth) / 2, topMargin, scaledWidth, scaledHeight)
    }

    addFooterToPDF(pdf, offer)

    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
  } catch (error) {
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = ''
    })
    throw error
  }
}

export function downloadOfferPDFFromPreview(offer: SavedOffer, previewElementId: string = 'offer-preview-content') {
  const filename = `ponudba-${offer.offerNumber.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`

  const element = document.getElementById(previewElementId)
  if (!element) {
    throw new Error(`Element z ID "${previewElementId}" ni bil najden`)
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
      URL.revokeObjectURL(url)
    })
    .catch(error => {
      console.error('Napaka pri generiranju PDF-ja:', error)
      alert('Napaka pri generiranju PDF-ja: ' + error.message)
    })
}

export function downloadOfferPDF(offer: SavedOffer) {
  downloadOfferPDFFromPreview(offer)
}
