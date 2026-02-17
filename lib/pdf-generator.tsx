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

// Funkcija za dodajanje footera na dno PDF-ja (to je Vektorski tekst, vedno oster)
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

// NOVA FUNKCIJA: High-DPI Rendering
export async function generateInvoicePDFFromElement(element: HTMLElement, invoice: SavedInvoice): Promise<Blob> {
  try {
    // 1. Priprava elementov (skrivanje gumbov)
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = 'none'
    })

    // 2. Kloniranje za "čist" render
    const clonedElement = element.cloneNode(true) as HTMLElement
    
    // Odstranimo footerje, ker jih rišemo vektorsko
    const footerElements = clonedElement.querySelectorAll('.normal-footer')
    footerElements.forEach(footer => footer.remove())
    
    // Začasen div izven zaslona
    const tempDiv = document.createElement('div')
    Object.assign(tempDiv.style, {
        position: 'fixed',
        top: '-10000px',
        left: '0',
        width: '210mm', // Fiksna A4 širina
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '9pt',
        color: '#000000', // Zagotovimo črn tekst
        webkitFontSmoothing: 'antialiased' // Boljša renderizacija pisave
    })
    
    tempDiv.appendChild(clonedElement)
    document.body.appendChild(tempDiv)

    // Počakamo na render fontov in slik
    await new Promise(resolve => setTimeout(resolve, 300))

    // Normalizacija barv
    const allElements = tempDiv.querySelectorAll('*')
    allElements.forEach(el => {
      normalizeColors(el as HTMLElement)
    })

    // 3. GENERIRANJE SLIKE - High Quality nastavitve
    // Scale 3.0 je "retina" kvaliteta (300 DPI), kar je standard za tisk
    const canvas = await html2canvas(tempDiv, {
      scale: 3.0, 
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: tempDiv.scrollWidth,
      height: tempDiv.scrollHeight,
      imageTimeout: 0,
      onclone: (clonedDoc) => {
        // Dodatna varnost za barve v klonu
        const clonedElements = clonedDoc.querySelectorAll('*')
        clonedElements.forEach(el => normalizeColors(el as HTMLElement))
      }
    })

    // Počistimo DOM
    document.body.removeChild(tempDiv)
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = ''
    })

    // 4. USTVARJANJE PDF-ja
    // compress: true je ključen za zmanjšanje velikosti pri uporabi PNG
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
    
    // Izračun dimenzij
    const imgWidth = pdfWidth - (2 * margin)
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    const availableHeight = pdfHeight - topMargin - margin - 20 // -20 za footer prostor
    
    // 5. DODAJANJE SLIKE V PDF - OPTIMIZIRANO
    // Uporabimo canvas direktno (hitreje kot toDataURL)
    // 'FAST' kompresija uporabi Flate (Zip) algoritem, ki je odličen za tekst na belem ozadju
    // Format 'PNG' zagotovi, da ni artefaktov okoli črk (ostrina)
    
    let renderWidth = imgWidth
    let renderHeight = imgHeight
    let renderX = margin
    
    // Če je vsebina previsoka za eno stran, jo pomanjšamo (fit-to-page logic)
    if (imgHeight > availableHeight) {
       const scale = availableHeight / imgHeight
       renderWidth = imgWidth * scale
       renderHeight = imgHeight * scale
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
        'FAST' // Ključno: FAST ali SLOW (obe sta lossless kompresiji), ne NONE.
    )

    // Dodamo vektorski footer
    addFooterToPDF(pdf, invoice)

    // Vrnemo Blob
    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
    
  } catch (error) {
    // Obnovimo gumbe v primeru napake
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = ''
    })
    throw error
  }
}

export function downloadInvoicePDFFromPreview(invoice: SavedInvoice, previewElementId: string = 'invoice-preview-content') {
  // Čiščenje imena datoteke
  const customerName = invoice.customer.Stranka.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim()
  const invoiceNum = invoice.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, " ").trim() // Dovolimo vezaj
  const filename = `${invoiceNum} ${customerName}.pdf`

  const element = document.getElementById(previewElementId)
  if (!element) {
    console.error(`Element z ID "${previewElementId}" ni bil najden`)
    alert('Napaka: Predogled računa ni bil najden.')
    return
  }

  // Vizualna povratna informacija (cursor loading)
  document.body.style.cursor = 'wait'

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
    .finally(() => {
        document.body.style.cursor = 'default'
    })
}
