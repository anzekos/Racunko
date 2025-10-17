import type { Invoice, SavedInvoice } from "./database"
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

// Nova funkcija za generiranje HTML vsebine, ki NATAČNO posnema InvoicePreview komponento
function generateInvoiceHTML(invoice: SavedInvoice): string {
  return `
    <div id="invoice-preview-content" class="invoice-preview-content" style="max-width: 800px; margin: 0 auto; padding: 0 32px 32px 32px; background: #ffffff; color: #000000; font-family: Arial, sans-serif; font-size: 12pt;">
      <!-- Header with Logo -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
        <div style="width: 140px; height: 72px; position: relative;">
          <img src="/images/2km-logo.png" alt="2KM Consulting Logo" style="width: 100%; height: 100%; object-fit: contain; display: block;" onerror="this.style.display='none'" />
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid #934435; margin: 0 0 24px 0;" />

      <!-- Customer and Company Info -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">
        <!-- Customer Info -->
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          <div style="font-weight: bold; font-size: 1.125rem; margin-bottom: 0.25rem;">${invoice.customer.Stranka}</div>
          <div>${invoice.customer.Naslov}</div>
          <div>${invoice.customer.Kraj_postna_st}</div>
          <div>${invoice.customer.email}</div>
          <div style="margin-top: 1.5rem;">
            <strong>ID za DDV:</strong> ${invoice.customer.ID_DDV}
          </div>

          <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.25rem;">
            <div>
              <strong>Ljubljana:</strong> ${new Date(invoice.issueDate).toLocaleDateString("sl-SI")}
            </div>
            <div>
              <strong>Valuta:</strong> ${new Date(invoice.dueDate).toLocaleDateString("sl-SI")}
            </div>
            <div>
              <strong>Datum opr. storitve:</strong> ${new Date(invoice.serviceDate).toLocaleDateString("sl-SI")}
            </div>
          </div>
        </div>

        <!-- Company Info -->
        <div style="text-align: right; font-size: 0.75rem; line-height: 1.2;">
          <div style="font-weight: 600; margin-bottom: 0.25rem;">2KM Consulting d.o.o., podjetniško in poslovno svetovanje</div>
          <div style="margin-bottom: 0.25rem;">Športna ulica 22, 1000 Ljubljana</div>
          <div style="margin-bottom: 0.25rem;">MŠ: 6315992000</div>
          <div style="margin-bottom: 0.25rem;">ID. št. za DDV: SI 10628169</div>
          <div style="margin-bottom: 0.25rem;">Osnovni kapital: 7.500,00 EUR</div>
          <div style="margin-bottom: 0.25rem;">Datum vpisa v SR: 13.2.2013, Okrožno sodišče Koper</div>
          <div style="margin-top: 0.5rem; margin-bottom: 0.25rem;">Poslovni račun št:</div>
          <div style="margin-bottom: 0.25rem;">IBAN: SI56 0223 6026 1489 640</div>
          <div style="margin-bottom: 0.25rem;">Nova Ljubljanska banka d.d., Ljubljana</div>
          <div style="margin-bottom: 0.25rem;">Trg republike 2, 1520 Ljubljana</div>
          <div style="margin-bottom: 0.25rem;">SWIFT: LJBASI2X</div>
        </div>
      </div>

      <!-- Invoice Number -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 1.25rem;">
          <strong>Račun:</strong> ${invoice.invoiceNumber}
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid #cccccc; margin: 0 0 24px 0;" />

      ${
        invoice.serviceDescription
          ? `
          <!-- Service Description -->
          <div style="margin-bottom: 24px;">
            <h4 style="font-weight: bold; margin-bottom: 8px; font-size: 0.875rem; margin-top: 0;">Opis storitve:</h4>
            <div style="white-space: pre-wrap;">${invoice.serviceDescription}</div>
          </div>
        `
          : ""
      }

      <!-- Invoice Items Table -->
      <div style="margin-bottom: 32px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #cccccc; font-size: 0.8rem;">
          <thead>
            <tr style="background-color: #f8ecec;">
              <th style="border: 1px solid #cccccc; padding: 8px; text-align: left; font-weight: bold;">Postavka</th>
              <th style="border: 1px solid #cccccc; padding: 8px; text-align: right; font-weight: bold;">Količina</th>
              <th style="border: 1px solid #cccccc; padding: 8px; text-align: right; font-weight: bold;">Cena (EUR)</th>
              <th style="border: 1px solid #cccccc; padding: 8px; text-align: right; font-weight: bold;">Skupaj (EUR)</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item) => `
              <tr>
                <td style="border: 1px solid #cccccc; padding: 8px;">${item.description}</td>
                <td style="border: 1px solid #cccccc; padding: 8px; text-align: right;">${item.quantity}</td>
                <td style="border: 1px solid #cccccc; padding: 8px; text-align: right;">${item.price.toFixed(2)}</td>
                <td style="border: 1px solid #cccccc; padding: 8px; text-align: right;">${item.total.toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr style="font-weight: bold;">
              <td colspan="3" style="border: 1px solid #cccccc; padding: 8px; text-align: left;">
                Skupaj brez DDV:
              </td>
              <td style="border: 1px solid #cccccc; padding: 8px; text-align: right;">${invoice.totalWithoutVat.toFixed(2)}</td>
            </tr>
            <tr style="font-weight: bold;">
              <td colspan="3" style="border: 1px solid #cccccc; padding: 8px; text-align: left;">
                DDV (22%):
              </td>
              <td style="border: 1px solid #cccccc; padding: 8px; text-align: right;">${invoice.vat.toFixed(2)}</td>
            </tr>
            <tr style="font-weight: bold;">
              <td colspan="3" style="border: 1px solid #cccccc; padding: 8px; text-align: left;">
                Skupaj za plačilo:
              </td>
              <td style="border: 1px solid #cccccc; padding: 8px; text-align: right;">${invoice.totalPayable.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Payment Info -->
      <div style="margin-bottom: 32px; font-size: 0.875rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Znesek nakažite na TRR:</span>
          <strong style="padding-right: 80px;">SI56 0223 6026 1489 640</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Pri plačilu se sklicujte na št. računa:</span>
          <strong style="padding-right: 80px;">${invoice.invoiceNumber}</strong>
        </div>
        <div style="margin-bottom: 8px;">V primeru zamude se zaračunavajo zamudne obresti.</div>
        <div style="margin-top: 16px; font-weight: 600;">Hvala za sodelovanje!</div>
      </div>

      <!-- Signature -->
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0;">
        <strong style="font-size: 0.875rem; margin-bottom: 2px;">2KM Consulting d.o.o.</strong>
        <div style="width: 180px; height: 104px;">
          <img src="/images/signature-logo.png" alt="Signature" style="width: 100%; height: 100%; object-fit: contain; display: block;" onerror="this.style.display='none'" />
        </div>
      </div>

      <!-- Footer -->
      <div class="normal-footer" style="margin-top: 40px;">
        <hr style="border: none; border-top: 1px solid #934435; margin: 0 0 16px 0;" />
        <div style="text-align: right; font-size: 0.7rem; color: #934435; display: flex; flex-direction: column; gap: 4px;">
          <div style="font-weight: 600;">2KM Consulting d.o.o., podjetniško in poslovno svetovanje</div>
          <div>Športna ulica 22, 1000 Ljubljana</div>
          <div>DŠ: SI 10628169</div>
          <div>TRR: SI56 0223 6026 1489 640 (NLB)</div>
        </div>
      </div>

      <!-- Dodaj CSS stile za skladnost z InvoicePreview -->
      <style>
        .invoice-preview-content {
          font-family: Arial, sans-serif !important;
        }
        .invoice-title {
          font-size: 1.2rem !important;
          font-weight: bold !important;
        }
        .invoice-customer-name {
          font-size: 1.125rem !important;
          font-weight: bold !important;
        }
        .invoice-company-info {
          font-size: 0.75rem !important;
        }
        .invoice-section-title {
          font-size: 0.875rem !important;
          font-weight: bold !important;
        }
        .invoice-table {
          font-size: 0.8rem !important;
        }
        .invoice-table-header {
          font-size: 0.8rem !important;
          font-weight: bold !important;
        }
        .invoice-total {
          font-size: 0.85rem !important;
          font-weight: bold !important;
        }
        .invoice-footer {
          font-size: 0.7rem !important;
        }
        .invoice-payment-info {
          font-size: 0.875rem !important;
        }
        .podpis {
          font-size: 0.875rem !important;
        }
        
        @media print {
          .invoice-preview-content {
            font-size: 12pt !important;
            font-family: Arial, sans-serif !important;
          }
          .invoice-title {
            font-size: 12pt !important;
            font-weight: bold !important;
          }
          .invoice-customer-name {
            font-size: 14pt !important;
            font-weight: bold !important;
          }
          .invoice-company-info {
            font-size: 9pt !important;
          }
          .invoice-section-title {
            font-size: 12pt !important;
            font-weight: bold !important;
          }
          .invoice-table {
            font-size: 9pt !important;
          }
          .invoice-table-header {
            font-size: 9pt !important;
            font-weight: bold !important;
          }
          .invoice-total {
            font-size: 10pt !important;
            font-weight: bold !important;
          }
          .invoice-footer {
            font-size: 8pt !important;
          }
          .invoice-payment-info {
            font-size: 11pt !important;
          }
          .podpis {
            font-size: 8pt !important;
          }
        }
      </style>
    </div>
  `;
}

export async function generateInvoicePDF(invoice: SavedInvoice): Promise<Blob> {
  const tempContainer = document.createElement('div')
  tempContainer.style.position = 'fixed'
  tempContainer.style.top = '-9999px'
  tempContainer.style.left = '-9999px'
  tempContainer.style.width = '210mm'
  tempContainer.style.padding = '0'
  tempContainer.style.margin = '0'
  tempContainer.style.backgroundColor = 'white'
  tempContainer.style.fontFamily = 'Arial, sans-serif'
  tempContainer.style.color = '#000000'
  tempContainer.style.fontSize = '12pt'
  tempContainer.style.overflow = 'visible'

  // Uporabimo popolnoma enako HTML vsebino kot v InvoicePreview
  tempContainer.innerHTML = generateInvoiceHTML(invoice)

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
            img.onerror = () => {
              console.warn('Slika se ni naložila:', img.src)
              resolve(img) // Nadaljujemo tudi če slika ne naloži
            }
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
export async function generateInvoicePDFFromElement(elementId: string, invoice: SavedInvoice): Promise<Blob> {
  const element = document.getElementById(elementId)
  if (!element) {
    // Če element ne obstaja, uporabimo programsko generiranje z identično vsebino
    return generateInvoicePDF(invoice)
  }

  try {
    const actionButtons = document.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = 'none'
    })

    const clonedElement = element.cloneNode(true) as HTMLElement
    
    // Odstranimo footer elemente, ker jih dodamo ročno v PDF
    const footerElements = clonedElement.querySelectorAll('.normal-footer, .invoice-footer, .pdf-footer')
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

    addFooterToPDF(pdf, invoice)

    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
  } catch (error) {
    const actionButtons = document.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = ''
    })
    // V primeru napake pademo nazaj na programsko generiranje
    return generateInvoicePDF(invoice)
  }
}

export function downloadInvoicePDF(invoice: SavedInvoice) {
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

export function downloadInvoicePDFFromPreview(invoice: SavedInvoice, previewElementId: string = 'invoice-preview-content') {
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
