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

// POPRAVLJENA funkcija - omejitev na eno stran z optimiziranimi fonti
export async function generateInvoicePDF(invoice: Invoice): Promise<Blob> {
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
  tempContainer.style.fontSize = '12pt' // POVEČAN font za boljšo berljivost
  tempContainer.style.maxHeight = '280mm' // Omejitev višine za eno stran
  tempContainer.style.overflow = 'hidden' // Preprečimo prelivanje

  // HTML vsebina z OPTIMALIZIRANIMI fonti za eno stran
  tempContainer.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; padding: 15px; background: #ffffff; color: #000000; font-family: Arial, sans-serif; font-size: 12pt;">
      <!-- Header with Logo -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
        <div style="width: 120px; height: 70px;"> <!-- Optimalna velikost -->
          <img src="/images/2km-logo.png" alt="2KM Consulting Logo" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid #934435; margin: 0 0 12px 0;" />

      <!-- Customer and Company Info -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11pt;">
        <!-- Customer Info -->
        <div style="flex: 1; margin-right: 20px;">
          <div style="font-weight: bold; font-size: 14pt; margin-bottom: 4px; color: #000000;">${invoice.customer.Stranka}</div>
          <div style="margin-bottom: 2px; color: #000000; line-height: 1.2;">${invoice.customer.Naslov}</div>
          <div style="margin-bottom: 2px; color: #000000; line-height: 1.2;">${invoice.customer.Kraj_postna_st}</div>
          <div style="margin-bottom: 2px; color: #000000; line-height: 1.2;">${invoice.customer.email}</div>
          <div style="margin-top: 8px; margin-bottom: 2px; color: #000000; line-height: 1.2;">
            <strong>ID za DDV:</strong> ${invoice.customer.ID_DDV}
          </div>

          <div style="margin-top: 12px;">
            <div style="margin-bottom: 2px; color: #000000; line-height: 1.2;">
              <strong>Ljubljana:</strong> ${new Date(invoice.issueDate).toLocaleDateString("sl-SI")}
            </div>
            <div style="margin-bottom: 2px; color: #000000; line-height: 1.2;">
              <strong>Valuta:</strong> ${new Date(invoice.dueDate).toLocaleDateString("sl-SI")}
            </div>
            <div style="margin-bottom: 2px; color: #000000; line-height: 1.2;">
              <strong>Datum opr. storitve:</strong> ${new Date(invoice.serviceDate).toLocaleDateString("sl-SI")}
            </div>
          </div>
        </div>

        <!-- Company Info -->
        <div style="text-align: right; font-size: 9pt; flex: 1; line-height: 1.2;">
          <div style="font-weight: bold; margin-bottom: 2px; color: #000000;">2KM Consulting d.o.o., podjetniško in poslovno svetovanje</div>
          <div style="margin-bottom: 2px; color: #000000;">Športna ulica 22, 1000 Ljubljana</div>
          <div style="margin-bottom: 2px; color: #000000;">MŠ: 6315992000</div>
          <div style="margin-bottom: 2px; color: #000000;">ID. št. za DDV: SI 10628169</div>
          <div style="margin-bottom: 2px; color: #000000;">Osnovni kapital: 7.500,00 EUR</div>
          <div style="margin-bottom: 2px; color: #000000;">Datum vpisa v SR: 13.2.2013, Okrožno sodišče Koper</div>
          <div style="margin-top: 4px; margin-bottom: 2px; color: #000000;">Poslovni račun št:</div>
          <div style="margin-bottom: 2px; color: #000000;">IBAN: SI56 0223 6026 1489 640</div>
          <div style="margin-bottom: 2px; color: #000000;">Nova Ljubljanska banka d.d., Ljubljana</div>
          <div style="margin-bottom: 2px; color: #000000;">Trg republike 2, 1520 Ljubljana</div>
          <div style="margin-bottom: 2px; color: #000000;">SWIFT: LJBASI2X</div>
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
            <h4 style="font-weight: bold; margin-bottom: 4px; font-size: 12pt; color: #000000; margin-top: 0;">Opis storitve:</h4>
            <div style="white-space: pre-wrap; line-height: 1.3; color: #000000; font-size: 11pt;">${invoice.serviceDescription}</div>
          </div>
        `
          : ""
      }

      <!-- Invoice Items Table - OPTIMALIZIRANA -->
      <div style="margin-bottom: 20px;">
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
                <td style="border: 1px solid #cccccc; padding: 6px; color: #000000; line-height: 1.2;">${item.description}</td>
                <td style="border: 1px solid #cccccc; padding: 6px; color: #000000; line-height: 1.2;">${item.quantity}</td>
                <td style="border: 1px solid #cccccc; padding: 6px; color: #000000; line-height: 1.2;">${item.price.toFixed(2)}</td>
                <td style="border: 1px solid #cccccc; padding: 6px; color: #000000; line-height: 1.2;">${item.total.toFixed(2)}</td>
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
      <div style="margin-bottom: 20px; font-size: 11pt;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #000000;">
          <span>Znesek nakažite na TRR:</span>
          <strong>SI56 0223 6026 1489 640</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #000000;">
          <span>Pri plačilu se sklicujte na št. računa:</span>
          <strong>${invoice.invoiceNumber}</strong>
        </div>
        <div style="margin-bottom: 4px; color: #000000;">V primeru zamude se zaračunavajo zamudne obresti.</div>
        <div style="margin-top: 8px; font-weight: bold; color: #000000;">Hvala za sodelovanje!</div>
      </div>

      <!-- Signature -->
      <div style="display: flex; justify-content: flex-start; margin-bottom: 12px;">
        <div style="width: 120px; height: 60px;">
          <img src="/images/signature-logo.png" alt="Signature" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
        </div>
      </div>

      <!-- Footer -->
      <hr style="border: none; border-top: 1px solid #934435; margin: 0 0 8px 0;" />
      <div style="text-align: right; font-size: 8pt; color: #934435; line-height: 1.2;">
        <div style="font-weight: bold; margin-bottom: 2px;">2KM Consulting d.o.o., podjetniško in poslovno svetovanje</div>
        <div style="margin-bottom: 2px;">Športna ulica 22, 1000 Ljubljana</div>
        <div style="margin-bottom: 2px;">DŠ: SI 10628169</div>
        <div style="margin-bottom: 2px;">TRR: SI56 0223 6026 1489 640 (NLB)</div>
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
    
    // Izračunaj dimenzije slike, da se prilega na eno stran
    const imgWidth = pdfWidth - 20 // Robovi 10mm na vsaki strani
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    // Preveri, če se slika prilega na eno stran
    if (imgHeight > pdfHeight - 20) {
      // Če ne, zmanjšaj velikost, da se prilega
      const scale = (pdfHeight - 20) / imgHeight
      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale
      
      pdf.addImage(imgData, 'PNG', (pdfWidth - scaledWidth) / 2, 10, scaledWidth, scaledHeight)
    } else {
      // Če se prilega, centriraj
      const verticalOffset = (pdfHeight - imgHeight) / 2
      pdf.addImage(imgData, 'PNG', 10, verticalOffset, imgWidth, imgHeight)
    }

    document.body.removeChild(tempContainer)
    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
  } catch (error) {
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer)
    }
    throw error
  }
}

// POPRAVLJENA funkcija za generiranje iz elementa - omejitev na eno stran
export async function generateInvoicePDFFromElement(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element z ID "${elementId}" ni bil najden`)
  }

  try {
    const actionButtons = document.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = 'none'
    })

    const clonedElement = element.cloneNode(true) as HTMLElement
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'fixed'
    tempDiv.style.top = '-9999px'
    tempDiv.style.left = '0'
    tempDiv.style.width = '210mm'
    tempDiv.style.maxHeight = '280mm' // Omejitev višine
    tempDiv.style.overflow = 'hidden' // Preprečimo prelivanje
    tempDiv.style.backgroundColor = '#ffffff'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    tempDiv.style.fontSize = '12pt' // POVEČAN font
    tempDiv.appendChild(clonedElement)
    document.body.appendChild(tempDiv)

    // Čakaj malo da se stili aplicirajo
    await new Promise(resolve => setTimeout(resolve, 100))

    // Prilagodi vsebino za eno stran
    const allElements = tempDiv.querySelectorAll('*')
    allElements.forEach(el => {
      const element = el as HTMLElement
      normalizeColors(element)
      
      // Forsiraj velikosti fontov glede na razrede
      if (element.classList.contains('invoice-title')) {
        element.style.fontSize = '16pt'
        element.style.fontWeight = 'bold'
      }
      if (element.classList.contains('invoice-customer-name')) {
        element.style.fontSize = '14pt'
        element.style.fontWeight = 'bold'
      }
      if (element.classList.contains('invoice-company-info')) {
        element.style.fontSize = '9pt'
      }
      if (element.classList.contains('invoice-section-title')) {
        element.style.fontSize = '12pt'
        element.style.fontWeight = 'bold'
      }
      if (element.classList.contains('invoice-table')) {
        element.style.fontSize = '10pt'
      }
      if (element.classList.contains('invoice-table-header')) {
        element.style.fontSize = '10pt'
        element.style.fontWeight = 'bold'
      }
      if (element.classList.contains('invoice-total')) {
        element.style.fontSize = '11pt'
        element.style.fontWeight = 'bold'
      }
      if (element.classList.contains('invoice-footer')) {
        element.style.fontSize = '8pt'
      }
      if (element.classList.contains('invoice-payment-info')) {
        element.style.fontSize = '11pt'
      }
      
      // Poskrbi za table celice
      if (element.tagName === 'TD' || element.tagName === 'TH') {
        element.style.padding = '6px'
        element.style.lineHeight = '1.2'
      }
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
    
    // Izračunaj dimenzije slike, da se prilega na eno stran
    const imgWidth = pdfWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    // Preveri, če se slika prilega na eno stran
    if (imgHeight > pdfHeight - 20) {
      // Če ne, zmanjšaj velikost, da se prilega
      const scale = (pdfHeight - 20) / imgHeight
      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale
      
      pdf.addImage(imgData, 'PNG', (pdfWidth - scaledWidth) / 2, 10, scaledWidth, scaledHeight)
    } else {
      // Če se prilega, centriraj
      const verticalOffset = (pdfHeight - imgHeight) / 2
      pdf.addImage(imgData, 'PNG', 10, verticalOffset, imgWidth, imgHeight)
    }

    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
  } catch (error) {
    const actionButtons = document.querySelectorAll('.print\\:hidden')
    actionButtons.forEach(btn => {
      (btn as HTMLElement).style.display = ''
    })
    throw error
  }
}

// Preostale funkcije ostanejo enake
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

  generateInvoicePDFFromElement(previewElementId)
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
