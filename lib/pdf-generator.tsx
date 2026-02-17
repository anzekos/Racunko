import type { SavedInvoice } from "./database"
import jsPDF from "jspdf"

// ==============================
// Barvne pomožne funkcije
// ==============================
function convertOklchToHex(oklchValue: string): string {
  if (!oklchValue.includes("oklch")) return oklchValue
  if (oklchValue.includes("0.7") && oklchValue.includes("0.05")) return "#934435"
  if (oklchValue.includes("0.95")) return "#f8ecec"
  if (oklchValue.includes("0.87")) return "#cccccc"
  return "#000000"
}

function normalizeColors(element: HTMLElement) {
  const style = window.getComputedStyle(element)

  if (style.color.includes("oklch")) {
    element.style.color = convertOklchToHex(style.color)
  }
  if (style.backgroundColor.includes("oklch")) {
    element.style.backgroundColor = convertOklchToHex(style.backgroundColor)
  }
  if (style.borderColor.includes("oklch")) {
    element.style.borderColor = convertOklchToHex(style.borderColor)
  }
}

// ==============================
// Footer (vektorski)
// ==============================
function addFooterToPDF(pdf: jsPDF, invoice: SavedInvoice) {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const margin = 10
  const footerY = pageHeight - margin

  pdf.setDrawColor(147, 68, 53)
  pdf.setLineWidth(0.4)
  pdf.line(margin + 10, footerY - 18, pageWidth - margin - 10, footerY - 18)

  pdf.setFontSize(7)
  pdf.setTextColor(147, 68, 53)
  pdf.setFont("helvetica", "bold")
  pdf.text(
    "2KM Consulting d.o.o., podjetniško in poslovno svetovanje",
    pageWidth - margin,
    footerY - 14,
    { align: "right" }
  )

  pdf.setFont("helvetica", "normal")
  pdf.text("Športna ulica 22, 1000 Ljubljana", pageWidth - margin, footerY - 10, { align: "right" })
  pdf.text("DŠ: SI 10628169", pageWidth - margin, footerY - 6, { align: "right" })
  pdf.text("TRR: SI56 0223 6026 1489 640 (NLB)", pageWidth - margin, footerY - 2, { align: "right" })
}

// ==============================
// GLAVNA FUNKCIJA – VEKTORSKI PDF
// ==============================
export async function generateInvoicePDFFromElement(
  element: HTMLElement,
  invoice: SavedInvoice
): Promise<Blob> {
  try {
    // Skrij gumbe
    const actionButtons = element.querySelectorAll(".print\\:hidden")
    actionButtons.forEach(btn => ((btn as HTMLElement).style.display = "none"))

    // Klon elementa
    const cloned = element.cloneNode(true) as HTMLElement

    // Odstrani obstoječe footre
    cloned.querySelectorAll(".normal-footer").forEach(f => f.remove())

    // Temporary container
    const tempDiv = document.createElement("div")
    tempDiv.style.position = "fixed"
    tempDiv.style.top = "-9999px"
    tempDiv.style.left = "0"
    tempDiv.style.width = "210mm"
    tempDiv.style.background = "#ffffff"
    tempDiv.style.fontFamily = "Helvetica, Arial, sans-serif"
    tempDiv.style.fontSize = "9pt"

    tempDiv.appendChild(cloned)
    document.body.appendChild(tempDiv)

    await new Promise(r => setTimeout(r, 300))

    // Normalizacija barv
    tempDiv.querySelectorAll("*").forEach(el =>
      normalizeColors(el as HTMLElement)
    )

    // PDF setup
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: true
    })

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    pdf.setTextColor(0, 0, 0)

    // ⬇⬇⬇ KLJUČNA VEKTORSKA PRETVORBA ⬇⬇⬇
    await pdf.html(tempDiv, {
      x: 10,
      y: 10,
      width: pdf.internal.pageSize.getWidth() - 20,
      windowWidth: tempDiv.scrollWidth,

      autoPaging: "text",

      html2canvas: {
        scale: 1, // NUJNO za majhen PDF
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      }
    })

    // Footer na vsako stran
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      addFooterToPDF(pdf, invoice)
    }

    // Cleanup
    document.body.removeChild(tempDiv)
    actionButtons.forEach(btn => ((btn as HTMLElement).style.display = ""))

    return new Blob([pdf.output("blob")], { type: "application/pdf" })
  } catch (err) {
    throw err
  }
}

// ==============================
// DOWNLOAD FUNKCIJA
// ==============================
export function downloadInvoicePDFFromPreview(
  invoice: SavedInvoice,
  previewElementId: string = "invoice-preview-content"
) {
  const customerName = invoice.customer.Stranka
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")

  const invoiceNum = invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, " ")
  const filename = `${invoiceNum} ${customerName}.pdf`

  const element = document.getElementById(previewElementId)
  if (!element) throw new Error(`Element "${previewElementId}" ni bil najden`)

  generateInvoicePDFFromElement(element, invoice)
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    .catch(err => {
      console.error(err)
      alert("Napaka pri generiranju PDF-ja")
    })
}
