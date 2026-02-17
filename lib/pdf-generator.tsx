import type { SavedInvoice } from "./database"
import jsPDF from "jspdf"

/* =====================================================
   OKLCH CLEANER – KLJUČNA FUNKCIJA
   ===================================================== */
function stripOklchFromStyles(root: HTMLElement) {
  root.querySelectorAll("*").forEach(el => {
    const element = el as HTMLElement

    // Inline styles
    if (element.hasAttribute("style")) {
      const style = element.getAttribute("style")!
      if (style.includes("oklch")) {
        element.setAttribute(
          "style",
          style.replace(/oklch\([^)]+\)/g, "#000000")
        )
      }
    }

    // Computed styles (brutal but safe)
    const computed = getComputedStyle(element)
    for (const prop of computed) {
      const value = computed.getPropertyValue(prop)
      if (value.includes("oklch")) {
        element.style.setProperty(prop, "#000000")
      }
    }
  })
}

/* =====================================================
   FOOTER (VEKTORSKI)
   ===================================================== */
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

/* =====================================================
   GLAVNA FUNKCIJA – VEKTORSKI PDF
   ===================================================== */
export async function generateInvoicePDFFromElement(
  element: HTMLElement,
  invoice: SavedInvoice
): Promise<Blob> {
  // Skrij print gumbe
  const hiddenButtons = element.querySelectorAll(".print\\:hidden")
  hiddenButtons.forEach(btn => ((btn as HTMLElement).style.display = "none"))

  try {
    // Klon
    const cloned = element.cloneNode(true) as HTMLElement
    cloned.querySelectorAll(".normal-footer").forEach(f => f.remove())

    // Temp container
    const tempDiv = document.createElement("div")
    tempDiv.style.position = "fixed"
    tempDiv.style.top = "-10000px"
    tempDiv.style.left = "0"
    tempDiv.style.width = "210mm"
    tempDiv.style.background = "#ffffff"
    tempDiv.style.fontFamily = "Helvetica, Arial, sans-serif"
    tempDiv.style.fontSize = "9pt"

    tempDiv.appendChild(cloned)
    document.body.appendChild(tempDiv)

    await new Promise(r => setTimeout(r, 300))

    // PDF
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: true
    })

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    pdf.setTextColor(0, 0, 0)

    /* ===== KLJUČNI DEL ===== */
    await pdf.html(tempDiv, {
      x: 10,
      y: 10,
      width: pdf.internal.pageSize.getWidth() - 20,
      windowWidth: tempDiv.scrollWidth,
      autoPaging: "text",

      html2canvas: {
        scale: 1,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,

        // ⬇⬇⬇ OKLCH FIX ⬇⬇⬇
        onclone: (clonedDoc) => {
          stripOklchFromStyles(clonedDoc.body)
        }
      }
    })

    // Footer na vse strani
    const pages = pdf.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      pdf.setPage(i)
      addFooterToPDF(pdf, invoice)
    }

    document.body.removeChild(tempDiv)

    return new Blob([pdf.output("blob")], { type: "application/pdf" })
  } finally {
    hiddenButtons.forEach(btn => ((btn as HTMLElement).style.display = ""))
  }
}

/* =====================================================
   DOWNLOAD FUNKCIJA
   ===================================================== */
export function downloadInvoicePDFFromPreview(
  invoice: SavedInvoice,
  previewElementId: string = "invoice-preview-content"
) {
  const element = document.getElementById(previewElementId)
  if (!element) throw new Error("Invoice preview element not found")

  const customer = invoice.customer.Stranka
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")

  const invoiceNum = invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, " ")
  const filename = `${invoiceNum} ${customer}.pdf`

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
      console.error("PDF error:", err)
      alert("Napaka pri generiranju PDF-ja")
    })
}
