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
    // 1. Priprava gumbov
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => (btn as HTMLElement).style.display = 'none')

    // 2. Ustvarimo klon
    const clonedElement = element.cloneNode(true) as HTMLElement
    const footerElements = clonedElement.querySelectorAll('.normal-footer')
    footerElements.forEach(footer => footer.remove())

    // 3. AGRESIVNO ČIŠČENJE BARV
    // Ta funkcija bo na vsakem elementu posebej preverila barvo in jo 
    // "povozila" z HEX vrednostjo, da html2canvas ne bo gledal CSS datotek.
    const forceCleanColors = (el: HTMLElement) => {
      const computed = window.getComputedStyle(el);
      
      const properties = ['color', 'background-color', 'border-color', 'fill', 'stroke'];
      
      properties.forEach(prop => {
        const val = computed.getPropertyValue(prop);
        if (val.includes('oklch')) {
          // Namesto getPropertyValue uporabimo convertOklchToHex
          const hex = convertOklchToHex(val);
          el.style.setProperty(prop, hex, 'important');
        }
      });

      // Gremo čez vse otroke
      Array.from(el.children).forEach(child => forceCleanColors(child as HTMLElement));
    };

    // 4. Kontejner
    const tempDiv = document.createElement('div')
    const containerWidthPx = 800; 
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

    // Najprej počakamo trenutek, da brskalnik izračuna stile, nato jih fiksiramo
    forceCleanColors(tempDiv);

    // 5. PDF GENERIRANJE
    const pdf = new jsPDF('p', 'pt', 'a4', true); // true za kompresijo
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 30;
    const availableWidth = pdfWidth - (2 * margin);
    const scale = availableWidth / containerWidthPx;

    await pdf.html(tempDiv, {
      x: margin,
      y: margin,
      html2canvas: {
        scale: scale,
        useCORS: true,
        logging: false,
        // Dodaten varnostni mehanizem: ignoriraj problematične elemente
        onclone: (doc) => {
          // Še zadnji poskus čiščenja znotraj html2canvas klona
          const all = doc.querySelectorAll('*');
          all.forEach(el => {
            const style = (el as HTMLElement).style;
            if (style.color?.includes('oklch')) style.color = '#000000';
            if (style.backgroundColor?.includes('oklch')) style.backgroundColor = 'transparent';
          });
        }
      },
      width: availableWidth,
      windowWidth: containerWidthPx,
      autoPaging: 'text',
      margin: [margin, margin, margin, margin]
    });

    addFooterToPDF(pdf);

    document.body.removeChild(tempDiv);
    actionButtons.forEach(btn => (btn as HTMLElement).style.display = '');

    return new Blob([pdf.output('blob')], { type: 'application/pdf' });

  } catch (error) {
    console.error("Vektorski PDF Error:", error);
    // Če še vedno javlja napako, ponastavimo gumbe
    const actionButtons = element.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => (btn as HTMLElement).style.display = '')
    throw error;
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
