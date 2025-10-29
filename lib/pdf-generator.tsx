import type { SavedInvoice } from "./database"
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
function addFooterToPDF(pdf: jsPDF, invoice: SavedInvoice) {
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

// NOVA FUNKCIJA: Optimizirana za vektorsko kvaliteto in majhno velikost
export async function generateInvoicePDFFromElement(element: HTMLElement, invoice: SavedInvoice): Promise<Blob> {
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

    // IZBOLJŠANO: Nižji scale za manjšo velikost, ampak še vedno dovolj kvaliteten
    const canvas = await html2canvas(tempDiv, {
      scale: 2.0, // Povečano nazaj na 2.0 za boljšo kvaliteto
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

    // KLJUČNA SPREMEMBA: Uporabimo PNG z optimizirano kompresijo
    // PNG ohranja ostrino besedila bolje kot JPEG
    const imgData = canvas.toDataURL('image/png')
    
    // Kompresija PNG slike
    const compressedImgData = await compressPNG(imgData, 0.7) // 70% kvalitete
    
    const pdf = new jsPDF('p', 'mm', 'a4', true) // true = compress PDF
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    const margin = 10;
    const topMargin = 10;
    const imgWidth = pdfWidth - (2 * margin)
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    const availableHeight = pdfHeight - topMargin - margin - 20
    
    if (imgHeight <= availableHeight) {
      pdf.addImage(compressedImgData, 'PNG', margin, topMargin, imgWidth, imgHeight, undefined, 'FAST')
    } else {
      const scale = availableHeight / imgHeight
      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale
      
      pdf.addImage(compressedImgData, 'PNG', (pdfWidth - scaledWidth) / 2, topMargin, scaledWidth, scaledHeight, undefined, 'FAST')
    }

    // Dodamo footer
    addFooterToPDF(pdf, invoice)

    // Shranimo z optimizacijo
    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
  } catch (error) {
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = ''
    })
    throw error
  }
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
      
      // Poskusimo s JPEG kompresijo za manjšo velikost, ampak z visoko kvaliteto
      const compressed = canvas.toDataURL('image/jpeg', quality)
      resolve(compressed)
    }
    img.src = dataUrl
  })
}

export function downloadInvoicePDFFromPreview(invoice: SavedInvoice, previewElementId: string = 'invoice-preview-content') {
  // Default ime PDF: "Ime stranke + št. računa"
  const customerName = invoice.customer.Stranka.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-")
  const invoiceNum = invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, "-")
  const filename = `${customerName}-${invoiceNum}.pdf`

  const element = document.getElementById(previewElementId)
  if (!element) {
    throw new Error(`Element z ID "${previewElementId}" ni bil najden`)
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
      URL.revokeObjectURL(url)
    })
    .catch(error => {
      console.error('Napaka pri generiranju PDF-ja:', error)
      alert('Napaka pri generiranju PDF-ja: ' + error.message)
    })
}
