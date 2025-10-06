import type { Invoice } from "./database"

export interface EmailData {
  to: string
  subject: string
  body: string
  attachmentName?: string
  attachmentContent?: string
}

export async function sendInvoiceEmail(invoice: Invoice, recipientEmail?: string): Promise<boolean> {
  try {
    const email = recipientEmail || invoice.customer.email

    if (!email) {
      throw new Error("E-poštni naslov ni na voljo")
    }

    const emailData: EmailData = {
      to: email,
      subject: `Račun št. ${invoice.invoiceNumber} - 2KM Consulting`,
      body: `
Spoštovani,

v prilogi vam pošiljamo račun št. ${invoice.invoiceNumber}.

Podatki o računu:
- Številka računa: ${invoice.invoiceNumber}
- Datum izdaje: ${new Date(invoice.issueDate).toLocaleDateString("sl-SI")}
- Valuta: ${new Date(invoice.dueDate).toLocaleDateString("sl-SI")}
- Znesek: ${invoice.totalPayable.toFixed(2)} EUR

Plačilo prosimo nakažite na naš transakcijski račun:
IBAN: SI56 0223 6026 1489 640
Sklicevanje: ${invoice.invoiceNumber}

Za vsa vprašanja smo vam na voljo.

Lep pozdrav,
2KM Consulting d.o.o.

---
2KM Consulting d.o.o., podjetniško in poslovno svetovanje
Športna ulica 22, 1000 Ljubljana
ID za DDV: SI 10628169
TRR: SI56 0223 6026 1489 640 (NLB)
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

export function openEmailClient(invoice: Invoice, recipientEmail?: string) {
  const email = recipientEmail || invoice.customer.email

  if (!email) {
    alert("E-poštni naslov stranke ni na voljo")
    return
  }

  const subject = `Račun št. ${invoice.invoiceNumber} - 2KM Consulting`
  const body = `
Spoštovani,

v prilogi vam pošiljamo račun št. ${invoice.invoiceNumber}.

Podatki o računu:
- Številka računa: ${invoice.invoiceNumber}
- Datum izdaje: ${new Date(invoice.issueDate).toLocaleDateString("sl-SI")}
- Valuta: ${new Date(invoice.dueDate).toLocaleDateString("sl-SI")}
- Znesek: ${invoice.totalPayable.toFixed(2)} EUR

Plačilo prosimo nakažite na naš transakcijski račun:
IBAN: SI56 0223 6026 1489 640
Sklicevanje: ${invoice.invoiceNumber}

Za vsa vprašanja smo vam na voljo.

Lep pozdrav,
2KM Consulting d.o.o.
  `.trim()

  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoLink, "_blank")
}
