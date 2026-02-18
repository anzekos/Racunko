import type { SavedInvoice } from "./database"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Type za Offer (ima offerNumber namesto invoiceNumber)
type SavedOffer = SavedInvoice & { offerNumber: string }

// Pomožna funkcija za pretvorbo oklch barv v hex/rgb
function convertOklchToHex(oklchValue: string): string {
  if (!oklchValue || !oklchValue.includes('oklch')) return oklchValue
  if (oklchValue.includes('0.7') && oklchValue.includes('0.05')) return '#934435'
  if (oklchValue.includes('0.95')) return '#f8ecec'
  if (oklchValue.includes('0.87')) return '#cccccc'
  return '#000000'
}

// Pomožna funkcija za normalizacijo CSS barv - vključuje !important za preglasitev Tailwind v4
function normalizeColors(element: HTMLElement) {
  const computedStyle = window.getComputedStyle(element)
  
  const properties = ['color', 'backgroundColor', 'borderColor'] as const;
  
  properties.forEach(prop => {
    const val = computedStyle[prop];
    if (val && val.includes('oklch')) {
      const hex = convertOklchToHex(val);
      element.style.setProperty(prop === 'backgroundColor' ? 'background-color' : 
                                prop === 'borderColor' ? 'border-color' : prop, 
                                hex, 'important');
    }
  });
}

// Funkcija za dodajanje footera na dno PDF-ja (Vektorski tekst)
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

  pdf.setFontSize(7);
  pdf.setTextColor(147, 68, 53);
  pdf.setFont('helvetica', 'bold');
  pdf.text('2KM Consulting d.o.o., podjetniško in poslovno svetovanje', pageWidth - margin - textOffset, footerY - 14, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.text('Športna ulica 22, 1000 Ljubljana', pageWidth - margin - textOffset, footerY - 10, { align: 'right' });
  pdf.text('DŠ: SI 10628169', pageWidth - margin - textOffset, footerY - 6, { align: 'right' });
  pdf.text('TRR: SI56 0223 6026 1489 640 (NLB)', pageWidth - margin - textOffset, footerY - 2, { align: 'right' });
}

// NADGRAJENA FUNKCIJA: Optimizirana za ostrino in majhno velikost
export async function generateOfferPDFFromElement(element: HTMLElement, offer: SavedOffer): Promise<Blob> {
  try {
    // 1. Skrijemo akcijske gumbe
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => { (btn as HTMLElement).style.display = 'none' })

    // 2. Kloniranje in priprava
    const clonedElement = element.cloneNode(true) as HTMLElement
    const footerElements = clonedElement.querySelectorAll('.normal-footer')
    footerElements.forEach(footer => footer.remove())
    
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

    // Počakamo na render
    await new Promise(resolve => setTimeout(resolve, 400))

    // Normaliziramo barve na vseh elementih
    const allElements = tempDiv.querySelectorAll('*')
    allElements.forEach(el => normalizeColors(el as HTMLElement))

    // 3. RENDERIRANJE (Scale 3.0 za popolno ostrino)
    const canvas = await html2canvas(tempDiv, {
      scale: 3.0, 
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: tempDiv.scrollWidth,
      height: tempDiv.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedElements = clonedDoc.querySelectorAll('*')
        clonedElements.forEach(el => normalizeColors(el as HTMLElement))
      }
    })

    // Počistimo DOM
    document.body.removeChild(tempDiv)
    actionButtons.forEach(btn => { (btn as HTMLElement).style.display = '' })

    // 4. USTVARJANJE PDF (PNG + FAST kompresija)
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
    const imgWidth = pdfWidth - (2 * margin)
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const availableHeight = pdfHeight - topMargin - margin - 20
    
    let finalWidth = imgWidth
    let finalHeight = imgHeight
    let finalX = margin

    if (imgHeight > availableHeight) {
       const scale = availableHeight / imgHeight
       finalWidth = imgWidth * scale
       finalHeight = imgHeight * scale
       finalX = (pdfWidth - finalWidth) / 2
    }

    // PNG ohranja ostre robove teksta brez "megle", FAST pa zmanjša velikost
    pdf.addImage(canvas, 'PNG', finalX, topMargin, finalWidth, finalHeight, undefined, 'FAST')

    // 5. Dodamo footer
    addFooterToPDF(pdf, offer)

    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
    
  } catch (error) {
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => { (btn as HTMLElement).style.display = '' })
    throw error
  }
}

// Funkcija za prenos PDF-ja
export function downloadOfferPDFFromPreview(offer: SavedOffer, previewElementId: string = 'offer-preview-content') {
  const customerName = offer.customer.Stranka.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim()
  const offerNum = offer.offerNumber.replace(/[^a-zA-Z0-9-]/g, " ").trim()
  const filename = `${offerNum} ${customerName}.pdf`

  const element = document.getElementById(previewElementId)
  if (!element) {
    console.error(`Element z ID "${previewElementId}" ni bil najden`)
    return
  }

  document.body.style.cursor = 'wait'

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
      alert('Napaka: ' + error.message)
    })
    .finally(() => {
        document.body.style.cursor = 'default'
    })
}

// Alias funkcija za kompatibilnost
export function downloadOfferPDF(offer: SavedOffer) {
  downloadOfferPDFFromPreview(offer, 'offer-preview-content')
}
