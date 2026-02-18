import type { SavedInvoice } from "./database"
import jsPDF from 'jspdf'

// Type za Offer (ima offerNumber namesto invoiceNumber)
type SavedOffer = SavedInvoice & { offerNumber: string }

// Pomožna funkcija za pretvorbo oklch barv v hex
function convertOklchToHex(oklchValue: string): string {
  if (!oklchValue || !oklchValue.includes('oklch')) return oklchValue
  // Mapiranje vaših specifičnih barv
  if (oklchValue.includes('0.7') && oklchValue.includes('0.05')) return '#934435'
  if (oklchValue.includes('0.95')) return '#f8ecec'
  if (oklchValue.includes('0.87')) return '#cccccc'
  return '#000000'
}

// Funkcija za dodajanje footera (Vektorsko)
function addFooterToPDF(pdf: jsPDF) {
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const footerY = pageHeight - margin;
    
    pdf.setDrawColor(147, 68, 53);
    pdf.setLineWidth(0.4);
    pdf.line(margin + 10, footerY - 18, pageWidth - margin - 10, footerY - 18);

    pdf.setFontSize(7);
    pdf.setTextColor(147, 68, 53);
    pdf.setFont('helvetica', 'bold');
    pdf.text('2KM Consulting d.o.o., podjetniško in poslovno svetovanje', pageWidth - margin - 10, footerY - 14, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.text('Športna ulica 22, 1000 Ljubljana', pageWidth - margin - 10, footerY - 10, { align: 'right' });
    pdf.text('DŠ: SI 10628169', pageWidth - margin - 10, footerY - 6, { align: 'right' });
    pdf.text('TRR: SI56 0223 6026 1489 640 (NLB)', pageWidth - margin - 10, footerY - 2, { align: 'right' });
  }
}

export async function generateOfferPDFFromElement(element: HTMLElement, offer: SavedOffer): Promise<Blob> {
  try {
    // 1. Skrijemo gumbe
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => (btn as HTMLElement).style.display = 'none')

    // 2. Kloniranje in čiščenje barv (da preprečimo oklch napako)
    const clonedElement = element.cloneNode(true) as HTMLElement
    const footerElements = clonedElement.querySelectorAll('.normal-footer')
    footerElements.forEach(f => f.remove())

    const tempDiv = document.createElement('div')
    const containerWidthPx = 800; // Standardna širina za stabilen HTML render
    
    Object.assign(tempDiv.style, {
      position: 'fixed',
      top: '-10000px',
      left: '0',
      width: `${containerWidthPx}px`,
      backgroundColor: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    })
    
    tempDiv.appendChild(clonedElement)
    document.body.appendChild(tempDiv)

    // Agresivna zamenjava oklch barv s HEX, preden jsPDF sploh pogleda element
    const all = tempDiv.querySelectorAll('*')
    all.forEach(el => {
      const htmlEl = el as HTMLElement
      const style = window.getComputedStyle(htmlEl)
      if (style.color.includes('oklch')) htmlEl.style.setProperty('color', convertOklchToHex(style.color), 'important');
      if (style.backgroundColor.includes('oklch')) htmlEl.style.setProperty('background-color', convertOklchToHex(style.backgroundColor), 'important');
      if (style.borderColor.includes('oklch')) htmlEl.style.setProperty('border-color', convertOklchToHex(style.borderColor), 'important');
    })

    // 3. Vektorsko generiranje PDF
    const pdf = new jsPDF('p', 'pt', 'a4');
    const margin = 30; // 30pt margin
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const availableWidth = pdfWidth - (2 * margin);
    const scale = availableWidth / containerWidthPx;

    await pdf.html(tempDiv, {
      x: margin,
      y: margin,
      html2canvas: {
        scale: scale,
        useCORS: true,
        logging: false
      },
      width: availableWidth,
      windowWidth: containerWidthPx,
      autoPaging: 'text',
      margin: [margin, margin, margin, margin]
    });

    // 4. Dodajanje vektorskega footera
    addFooterToPDF(pdf);

    // Čiščenje
    document.body.removeChild(tempDiv);
    actionButtons.forEach(btn => (btn as HTMLElement).style.display = '');

    return new Blob([pdf.output('blob')], { type: 'application/pdf' });

  } catch (error) {
    console.error("PDF Error:", error);
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => (btn as HTMLElement).style.display = '')
    throw error;
  }
}

export function downloadOfferPDFFromPreview(offer: SavedOffer, previewElementId: string = 'offer-preview-content') {
  const customerName = offer.customer.Stranka.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim()
  const offerNum = offer.offerNumber.replace(/[^a-zA-Z0-9-]/g, " ").trim()
  const filename = `${offerNum} ${customerName}.pdf`

  const element = document.getElementById(previewElementId)
  if (!element) return;

  document.body.style.cursor = 'wait'

  generateOfferPDFFromElement(element, offer)
    .then((pdfBlob) => {
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    })
    .catch(err => alert("Napaka: " + err.message))
    .finally(() => document.body.style.cursor = 'default')
}

export function downloadOfferPDF(offer: SavedOffer) {
  downloadOfferPDFFromPreview(offer, 'offer-preview-content')
}
