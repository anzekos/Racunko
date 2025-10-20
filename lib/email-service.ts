import type { Invoice, SavedInvoice } from "./database"

export interface EmailData {
  to: string
  subject: string
  body: string
  attachmentName?: string
  attachmentContent?: string
}

// Dodajte funkcijo za posodobitev statusa računa
async function updateInvoiceStatus(invoiceId: string, status: string): Promise<void> {
  try {
    const response = await fetch(`/api/invoices/${invoiceId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      throw new Error('Napaka pri posodabljanju statusa računa')
    }
  } catch (error) {
    console.error('Error updating invoice status:', error)
    throw error
  }
}

export async function sendInvoiceEmail(invoice: Invoice, recipientEmail?: string): Promise<boolean> {
  try {
    const email = recipientEmail || invoice.customer.email

    if (!email) {
      throw new Error("E-poštni naslov ni na voljo")
    }

    // Če je račun tipa SavedInvoice in je v statusu draft, ga posodobimo na sent
    if ('id' in invoice && invoice.status === 'draft') {
      await updateInvoiceStatus(invoice.id!, 'sent')
    }

    const emailData: EmailData = {
      to: email,
      subject: `Račun št. ${invoice.invoiceNumber} - 2KM Consulting`,
      body: `
Spoštovani,

V priponki vam pošiljamo račun za izvedeno storitev. 

Prosimo, da v namen plačila navedete: **PLAČILO RAČUNA ŠT. ${invoice.invoiceNumber}**

Podatki o računu:
- Številka računa: ${invoice.invoiceNumber}
- Datum izdaje: ${new Date(invoice.issueDate).toLocaleDateString("sl-SI")}
- Valuta: ${new Date(invoice.dueDate).toLocaleDateString("sl-SI")}
- Znesek za plačilo: ${invoice.totalPayable.toFixed(2)} EUR

Plačilo prosimo nakažite na transakcijski račun: SI56 0223 6026 1489 640
Sklic: SI00 ${invoice.invoiceNumber}

Hvala za sodelovanje in lep pozdrav.
      `.trim(),
    }

    // In a real application, you would send this to your email service
    // For now, we'll simulate the email sending process
    console.log("Sending email:", emailData)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For demonstration, we'll open the user's email client
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`
    window.open(mailtoLink, "_blank")

    return true
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

export async function openEmailClient(invoice: Invoice | SavedInvoice, recipientEmail?: string) {
  const email = recipientEmail || invoice.customer.email

  if (!email) {
    alert("E-poštni naslov stranke ni na voljo")
    return
  }

  // Če je račun tipa SavedInvoice in je v statusu draft, ga posodobimo na sent
  if ('id' in invoice && invoice.status === 'draft') {
    try {
      await updateInvoiceStatus(invoice.id!, 'sent')
      console.log(`Račun ${invoice.invoiceNumber} označen kot poslan`)
    } catch (error) {
      console.error('Napaka pri posodabljanju statusa računa:', error)
      // Nadaljujemo z odpiranjem e-pošte kljub napaki
    }
  }

  const subject = `Račun št. ${invoice.invoiceNumber} - 2KM Consulting`
  const body = `
Spoštovani,

V priponki vam pošiljamo račun za izvedeno storitev. 

Prosimo, da v namen plačila navedete: **PLAČILO RAČUNA ŠT. ${invoice.invoiceNumber}**

Podatki o računu:
- Številka računa: ${invoice.invoiceNumber}
- Datum izdaje: ${new Date(invoice.issueDate).toLocaleDateString("sl-SI")}
- Valuta: ${new Date(invoice.dueDate).toLocaleDateString("sl-SI")}
- Znesek za plačilo: ${invoice.totalPayable.toFixed(2)} EUR

Plačilo prosimo nakažite na transakcijski račun: SI56 0223 6026 1489 640
Sklic: SI00 ${invoice.invoiceNumber}

Hvala za sodelovanje in lep pozdrav.
  `.trim()

  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoLink, "_blank")
}
