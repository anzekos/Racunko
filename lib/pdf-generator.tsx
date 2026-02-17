export async function generateInvoicePDFFromElement(
  element: HTMLElement,
  invoice: SavedInvoice
): Promise<Blob> {
  // ==============================
  // POMOŽNA FUNKCIJA – odstranitev OKLCH
  // ==============================
  function stripOklch(root: HTMLElement) {
    root.querySelectorAll("*").forEach(el => {
      const element = el as HTMLElement

      // Inline style
      if (element.hasAttribute("style")) {
        const style = element.getAttribute("style")!
        if (style.includes("oklch")) {
          element.setAttribute(
            "style",
            style.replace(/oklch\([^)]+\)/g, "#000000")
          )
        }
      }

      // Computed styles → inline override
      const computed = getComputedStyle(element)
      for (const prop of computed) {
        const value = computed.getPropertyValue(prop)
        if (value.includes("oklch")) {
          element.style.setProperty(prop, "#000000")
        }
      }
    })
  }

  try {
    // ==============================
    // 1. Skrij gumbe
    // ==============================
    const actionButtons = element.querySelectorAll(".print\\:hidden")
    actionButtons.forEach(btn => ((btn as HTMLElement).style.display = "none"))

    // ==============================
    // 2. Kloniraj invoice
    // ==============================
    const cloned = element.cloneNode(true) as HTMLElement
    cloned.querySelectorAll(".normal-footer").forEach(f => f.remove())

    // ==============================
    // 3. Temp container
    // ==============================
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

    // ==============================
    // 4. PDF init
    // ==============================
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: true
    })

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    pdf.setTextColor(0, 0, 0)

    // ==============================
    // 5. VEKTORSKI HTML → PDF
    // ==============================
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

        // 🔥 KLJUČNO
        onclone: (clonedDoc) => {
          stripOklch(clonedDoc.body)
        }
      }
    })

    // ==============================
    // 6. Footer na vsako stran
    // ==============================
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      addFooterToPDF(pdf, invoice)
    }

    // ==============================
    // 7. Cleanup
    // ==============================
    document.body.removeChild(tempDiv)
    actionButtons.forEach(btn => ((btn as HTMLElement).style.display = ""))

    return new Blob([pdf.output("blob")], { type: "application/pdf" })
  } catch (err) {
    throw err
  }
}
