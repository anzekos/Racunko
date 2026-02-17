import type { SavedInvoice } from "./database"
import jsPDF from 'jspdf'
// html2canvas je še vedno potreben kot "dependency" za jsPDF.html funkcijo,
// čeprav ga ne kličemo direktno.
import html2canvas from 'html2canvas'

// Pomožna funkcija za pretvorbo oklch barv (ostane enaka)
function convertOklchToHex(oklchValue: string): string {
  if (!oklchValue.includes('oklch')) return oklchValue
  if (oklchValue.includes('0.7') && oklchValue.includes('0.05')) return '#934435'
  if (oklchValue.includes('0.95')) return '#f8ecec'
  if (oklchValue.includes('0.87')) return '#cccccc'
  return '#000000'
}

// Funkcija za dodajanje footera (vektorsko)
function addFooterToPDF(pdf: jsPDF) {
  const pageCount = pdf.getNumberOfPages();
  // Loop čez vse strani in dodaj footer
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
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
}

export async function generateInvoicePDFFromElement(element: HTMLElement, invoice: SavedInvoice): Promise<Blob> {
  try {
    // 1. Priprava elementov
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => (btn as HTMLElement).style.display = 'none')

    const clonedElement = element.cloneNode(true) as HTMLElement
    
    // Odstranimo obstoječe footerje
    const footerElements = clonedElement.querySelectorAll('.normal-footer')
    footerElements.forEach(footer => footer.remove())
    
    // 2. Priprava kontejnerja
    // Za vektorski PDF je ključno, da je širina kontejnerja fiksna v pikslih,
    // ki ustrezajo razmerju A4, da se tekst pravilno prelomi.
    const tempDiv = document.createElement('div')
    // A4 širina v točkah (pt) je cca 595pt. Za boljšo kvaliteto HTML renderiranja
    // uporabimo večjo širino (npr. 800px) in jo potem skaliramo.
    const containerWidthPx = 800; 
    
    Object.assign(tempDiv.style, {
        position: 'fixed',
        top: '-10000px',
        left: '0',
        width: `${containerWidthPx}px`,
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif', // Arial je varen font
        fontSize: '12px',
        color: '#000000'
    })
    
    tempDiv.appendChild(clonedElement)
    document.body.appendChild(tempDiv)

    // Normalizacija barv (pretvori oklch v hex, ker PDF ne podpira modernih CSS barv)
    const allElements = tempDiv.querySelectorAll('*')
    allElements.forEach(el => {
      const htmlEl = el as HTMLElement;
      // Normalizacija barv
      const style = window.getComputedStyle(htmlEl);
      if (style.color.includes('oklch')) htmlEl.style.color = convertOklchToHex(style.color);
      if (style.backgroundColor.includes('oklch')) htmlEl.style.backgroundColor = convertOklchToHex(style.backgroundColor);
      if (style.borderColor.includes('oklch')) htmlEl.style.borderColor = convertOklchToHex(style.borderColor);
    })

    // 3. GENERIRANJE VEKTORSKEGA PDF-ja
    // Uporabimo 'pt' (points) enote, ker so standard za PDF
    const pdf = new jsPDF('p', 'pt', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 595.28 pt
    const margin = 30; // cca 10mm
    const availableWidth = pdfWidth - (2 * margin);
    
    // Izračunamo razmerje pomanjšave (HTML px -> PDF pt)
    const scale = availableWidth / containerWidthPx;

    // Počakamo na render
    await new Promise<void>((resolve) => {
        pdf.html(tempDiv, {
            callback: function (doc) {
                // Ta callback se zgodi, ko je PDF zgeneriran
                resolve();
            },
            x: margin,
            y: margin,
            html2canvas: {
                scale: scale, // Zmanjšamo HTML, da paše na stran
                logging: false,
                useCORS: true, // Pomembno za slike
                letterRendering: true, // Poskusi izboljšati renderiranje črk
            },
            width: availableWidth, // Povemo jsPDF, kako širok naj bo content
            windowWidth: containerWidthPx, // Povemo, kako širok je vir
            autoPaging: 'text', // Pametno lomljenje strani (ne sredi vrstice)
            margin: [margin, margin, margin, margin] // Robovi [top, left, bottom, right]
        });
    });

    // 4. Dodamo footer na vse strani (vektorsko)
    // Ker je pdf.html() async, to naredimo po awaitu
    addFooterToPDF(pdf);

    // Čiščenje
    document.body.removeChild(tempDiv);
    actionButtons.forEach(btn => (btn as HTMLElement).style.display = '');

    return new Blob([pdf.output('blob')], { type: 'application/pdf' });

  } catch (error) {
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => (btn as HTMLElement).style.display = '')
    throw error
  }
}

// Funkcija za prenos (ostane enaka)
export function downloadInvoicePDFFromPreview(invoice: SavedInvoice, previewElementId: string = 'invoice-preview-content') {
  const customerName = invoice.customer.Stranka.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim()
  const invoiceNum = invoice.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, " ").trim()
  const filename = `${invoiceNum} ${customerName}.pdf`

  const element = document.getElementById(previewElementId)
  if (!element) {
    alert('Napaka: Predogled računa ni bil najden.')
    return
  }

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
      console.error('Napaka:', error)
      alert('Napaka pri PDF: ' + error.message)
    })
    .finally(() => {
        document.body.style.cursor = 'default'
    })
}
