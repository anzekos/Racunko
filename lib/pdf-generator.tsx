import type { Invoice } from "./database"
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
function addFooterToPDF(pdf: jsPDF, invoice: Invoice) {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  
  // Shranimo trenutno pozicijo
  const currentY = pdf.getTextDimensions('').height;
  
  // Premaknemo se na dno strani (minus 20mm za footer)
  const footerY = pageHeight - 20;
  
  // Dodamo črto
  pdf.setDrawColor(147, 68, 53); // #934435
  pdf.line(10, footerY, pageWidth - 10, footerY);
  
  // Dodamo footer tekst
  pdf.setFontSize(8);
  pdf.setTextColor(147, 68, 53); // #934435
  pdf.setFont('helvetica', 'bold');
  pdf.text('2KM Consulting d.o.o., podjetniško in poslovno svetovanje', pageWidth - 10, footerY + 5, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.text('Športna ulica 22, 1000 Ljubljana', pageWidth - 10, footerY + 8, { align: 'right' });
  pdf.text('DŠ: SI 10628169', pageWidth - 10, footerY + 11, { align: 'right' });
  pdf.text('TRR: SI56 0223 6026 1489 640 (NLB)', pageWidth - 10, footerY + 14, { align: 'right' });
}

export async function generateInvoicePDF(invoice: Invoice): Promise<Blob> {
  const tempContainer = document.createElement('div')
  tempContainer.style.position = 'fixed'
  tempContainer.style.top = '-9999px'
  tempContainer.style.left = '-9999px'
  tempContainer.style.width = '210mm'
  tempContainer.style.padding = '8mm 0 0 0'
  tempContainer.style.margin = '0'
  tempContainer.style.backgroundColor = 'white'
  tempContainer.style.fontFamily = 'Arial, sans-serif'
  tempContainer.style.color = '#000000'
  tempContainer.style.fontSize = '12pt'
  tempContainer.style.maxHeight = '270mm' // Pustimo prostor za footer
  tempContainer.style.overflow = 'hidden'

  // HTML vsebina BREZ footera (ker ga bomo dodali ročno)
  tempContainer.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; padding: 10px 20px 20px 20px; background: #ffffff; color: #000000; font-family: Arial, sans-serif; font-size: 12pt;">
      <!-- Header with Logo -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
        <div style="width: 110px; height: 55px;">
          <img src="/images/2km-logo.png" alt="2KM Consulting Logo" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid #934435; margin: 0 0 12px 0;" />

      <!-- Customer and Company Info -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11pt;">
        <!-- Customer Info -->
        <div style="flex: 1; margin-right: 20px;">
          <div style="font-weight: bold; font-size: 14pt; margin-bottom: 6px; color: #000000;">${invoice.customer.Stranka}</div>
          <div style="margin-bottom: 3px; color: #000000; line-height: 1.3;">${invoice.customer.Naslov}</div>
          <div style="margin-bottom: 3px; color: #000000; line-height: 1.3;">${invoice.customer.Kraj_postna_st}</div>
          <div style="margin-bottom: 3px; color: #000000; line-height: 1.3;">${invoice.customer.email}</div>
          <div style="margin-top: 10px; margin-bottom: 3px; color: #000000; line-height: 1.3;">
            <strong>ID za DDV:</strong> ${invoice.customer.ID_DDV}
          </div>

          <div style="margin-top: 12px;">
            <div style="margin-bottom: 3px; color: #000000; line-height: 1.3;">
              <strong>Ljubljana:</strong> ${new Date(invoice.issueDate).toLocaleDateString("sl-SI")}
            </div>
            <div style="margin-bottom: 3px; color: #000000; line-height: 1.3;">
              <strong>Valuta:</strong> ${new Date(invoice.dueDate).toLocaleDateString("sl-SI")}
            </div>
            <div style="margin-bottom: 3px; color: #000000; line-height: 1.3;">
              <strong>Datum opr. storitve:</strong> ${new Date(invoice.serviceDate).toLocaleDateString("sl-SI")}
            </div>
          </div>
        </div>

        <!-- Company Info -->
        <div style="text-align: right; font-size: 9pt; flex: 1; line-height: 1.3;">
          <div style="font-weight: bold; margin-bottom: 3px; color: #000000;">2KM Consulting d.o.o., podjetniško in poslovno svetovanje</div>
          <div style="margin-bottom: 3px; color: #000000;">Športna ulica 22, 1000 Ljubljana</div>
          <div style="margin-bottom: 3px; color: #000000;">MŠ: 6315992000</div>
          <div style="margin-bottom: 3px; color: #000000;">ID. št. za DDV: SI 10628169</div>
          <div style="margin-bottom: 3px; color: #000000;">Osnovni kapital: 7.500,00 EUR</div>
          <div style="margin-bottom: 3px; color: #000000;">Datum vpisa v SR: 13.2.2013, Okrožno sodišče Koper</div>
          <div style="margin-top: 6px; margin-bottom: 3px; color: #000000;">Poslovni račun št:</div>
          <div style="margin-bottom: 3px; color: #000000;">IBAN: SI56 0223 6026 1489 640</div>
          <div style="margin-bottom: 3px; color: #000000;">Nova Ljubljanska banka d.d., Ljubljana</div>
          <div style="margin-bottom: 3px; color: #000000;">Trg republike 2, 1520 Ljubljana</div>
          <div style="margin-bottom: 3px; color: #000000;">SWIFT: LJBASI2X</div>
        </div>
      </div>

      <!-- Invoice Number -->
      <div style="margin-bottom: 12px;">
        <div style="font-size: 16pt; font-weight: bold; color: #000000;">
          <strong>Račun:</strong> ${invoice.invoiceNumber}
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid #cccccc; margin: 0 0 12px 0;" />

      ${
        invoice.serviceDescription
          ? `
          <!-- Service Description -->
          <div style="margin-bottom: 12px;">
            <h4 style="font-weight: bold; margin-bottom: 6px; font-size: 12pt; color: #000000; margin-top: 0;">Opis storitve:</h4>
            <div style="white-space: pre-wrap; line-height: 1.4; color: #000000; font-size: 11pt;">${invoice.serviceDescription}</div>
          </div>
        `
          : ""
      }

      <!-- Invoice Items Table -->
      <div style="margin-bottom: 18px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #cccccc; font-size: 10pt;">
          <thead>
            <tr style="background-color: #f8ecec;">
              <th style="border: 1px solid #cccccc; padding: 6px; text-align: left; font-weight: bold; color: #000000;">Postavka</th>
              <th style="border: 1px solid #cccccc; padding: 6px; text-align: left; font-weight: bold; color: #000000;">Količina</th>
              <th style="border: 1px solid #cccccc; padding: 6px; text-align: left; font-weight: bold; color: #000000;">Cena (EUR)</th>
              <th style="border: 1px solid #cccccc; padding: 6px; text-align: left; font-weight: bold; color: #000000;">Skupaj (EUR)</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item) => `
              <tr>
                <td style="border: 1px solid #cccccc; padding: 6px; color: #000000; line-height: 1.3;">${item.description}</td>
                <td style="border: 1px solid #cccccc; padding: 6px; color: #000000; line-height: 1.3;">${item.quantity}</td>
                <td style="border: 1px solid #cccccc; padding: 6px; color: #000000; line-height: 1.3;">${item.price.toFixed(2)}</td>
                <td style="border: 1px solid #cccccc; padding: 6px; color: #000000; line-height: 1.3;">${item.total.toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr style="font-weight: bold;">
              <td colspan="3" style="border: 1px solid #cccccc; padding: 6px; text-align: left; color: #000000;">
                Skupaj brez DDV:
              </td>
              <td style="border: 1px solid #cccccc; padding: 6px; color: #000000;">${invoice.totalWithoutVat.toFixed(2)}</td>
            </tr>
            <tr style="font-weight: bold;">
              <td colspan="3" style="border: 1px solid #cccccc; padding: 6px; text-align: left; color: #000000;">
                DDV (22%):
              </td>
              <td style="border: 1px solid #cccccc; padding: 6px; color: #000000;">${invoice.vat.toFixed(2)}</td>
            </tr>
            <tr style="font-weight: bold;">
              <td colspan="3" style="border: 1px solid #cccccc; padding: 6px; text-align: left; color: #000000;">
                Skupaj za plačilo:
              </td>
              <td style="border: 1px solid #cccccc; padding: 6px; color: #000000;">${invoice.totalPayable.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Payment Info -->
      <div style="margin-bottom: 18px; font-size: 11pt;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #000000;">
          <span>Znesek nakažite na TRR:</span>
          <strong>SI56 0223 6026 1489 640</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #000000;">
          <span>Pri plačilu se sklicujte na št. računa:</span>
          <strong>${invoice.invoiceNumber}</strong>
        </div>
        <div style="margin-bottom: 5px; color: #000000;">V primeru zamude se zaračunavajo zamudne obresti.</div>
        <div style="margin-top: 10px; font-weight: bold; color: #000000;">Hvala za sodelovanje!</div>
      </div>

      <!-- Signature -->
      <div style="display: flex; justify-content: flex-start; margin-bottom: 12px;">
        <div style="width: 120px; height: 50px;">
          <img src="/images/signature-logo.png" alt="Signature" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
        </div>
      </div>
    </div>
  `

  document.body.appendChild(tempContainer)

  try {
    const images = tempContainer.querySelectorAll('img')
    await Promise.all(
      Array.from(images).map((img) => {
        return new Promise((resolve, reject) => {
          if (img.complete) {
            resolve(img)
          } else {
            img.onload = () => resolve(img)
            img.onerror = () => resolve(img)
          }
        })
      })
    )

    const allElements = tempContainer.querySelectorAll('*')
    allElements.forEach(el => {
      normalizeColors(el as HTMLElement)
    })

    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedElements = clonedDoc.querySelectorAll('*')
        clonedElements.forEach(el => {
          normalizeColors(el as HTMLElement)
        })
        
        const clonedImages = clonedDoc.querySelectorAll('img')
        clonedImages.forEach((img) => {
          img.style.display = 'block'
        })
      }
    })

    const imgData = canvas.toDataURL('image/png', 1.0)
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    // Izračunaj dimenzije slike
    const imgWidth = pdfWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    // Optimalen zgornji rob
    const topMargin = 8
    
    // Preveri, če se slika prilega na eno stran
    if (imgHeight > pdfHeight - topMargin - 25) { // 25mm za footer
      // Če ne, zmanjšaj velikost, da se prilega
      const scale = (pdfHeight - topMargin - 25) / imgHeight
      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale
      
      pdf.addImage(imgData, 'PNG', (pdfWidth - scaledWidth) / 2, topMargin, scaledWidth, scaledHeight)
    } else {
      // Če se prilega, postavimo na vrh
      pdf.addImage(imgData, 'PNG', 10, topMargin, imgWidth, imgHeight)
    }

    // DODAJ FOOTER NA DNO STRANI
    addFooterToPDF(pdf, invoice)

    document.body.removeChild(tempContainer)
    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
  } catch (error) {
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer)
    }
    throw error
  }
}

// Posodobljena funkcija za generiranje iz elementa
export async function generateInvoicePDFFromElement(elementId: string, invoice: Invoice): Promise<Blob> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element z ID "${elementId}" ni bil najden`)
  }

  try {
    const actionButtons = document.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = 'none'
    })

    // Odstranimo footer iz klonirane vsebine, ker ga bomo dodali ročno
    const clonedElement = element.cloneNode(true) as HTMLElement
    const footerElements = clonedElement.querySelectorAll('.invoice-footer, .normal-footer, .pdf-footer')
    footerElements.forEach(footer => footer.remove())
    
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'fixed'
    tempDiv.style.top = '-9999px'
    tempDiv.style.left = '0'
    tempDiv.style.width = '210mm'
    tempDiv.style.maxHeight = '270mm'
    tempDiv.style.overflow = 'hidden'
    tempDiv.style.backgroundColor = '#ffffff'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    tempDiv.style.fontSize = '12pt'
    tempDiv.style.padding = '8mm 0 0 0'
    tempDiv.appendChild(clonedElement)
    document.body.appendChild(tempDiv)

    await new Promise(resolve => setTimeout(resolve, 100))

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
    
    const imgWidth = pdfWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    const topMargin = 8
    
    if (imgHeight > pdfHeight - topMargin - 25) {
      const scale = (pdfHeight - topMargin - 25) / imgHeight
      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale
      
      pdf.addImage(imgData, 'PNG', (pdfWidth - scaledWidth) / 2, topMargin, scaledWidth, scaledHeight)
    } else {
      pdf.addImage(imgData, 'PNG', 10, topMargin, imgWidth, imgHeight)
    }

    // DODAJ FOOTER NA DNO STRANI
    addFooterToPDF(pdf, invoice)

    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
  } catch (error) {
    const actionButtons = document.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = ''
    })
    throw error
  }
}

export function downloadInvoicePDF(invoice: Invoice) {
  const filename = `racun-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`

  generateInvoicePDF(invoice)
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

export function downloadInvoicePDFFromPreview(invoice: Invoice, previewElementId: string = 'invoice-preview-content') {
  const filename = `racun-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`

  generateInvoicePDFFromElement(previewElementId, invoice)
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
