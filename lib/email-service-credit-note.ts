import type { Invoice, SavedInvoice } from "./database"

// Type za CreditNote
type CreditNote = Invoice & { creditNoteNumber: string }
type SavedCreditNote = SavedInvoice & { creditNoteNumber: string }

export interface EmailData {
  to: string
  subject: string
  body: string
  attachmentName?: string
  attachmentContent?: string
}

// Pomožna funkcija za formatiranje številk po slovenskem standardu
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('sl-SI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

// Funkcija za posodobitev statusa dobropisa
async function updateCreditNoteStatus(creditNoteId: string, status: string): Promise<void> {
  try {
    const response = await fetch(`/api/credit-notes/${creditNoteId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      throw new Error('Napaka pri posodabljanju statusa dobropisa')
    }
  } catch (error) {
    console.error('Error updating credit note status:', error)
    throw error
  }
}

export async function sendCreditNoteEmail(creditNote: CreditNote, recipientEmail?: string): Promise<boolean> {
  try {
    const email = recipientEmail || creditNote.customer.email

    if (!email) {
      throw new Error("E-poštni naslov ni na voljo")
    }

    // Če je dobropis tipa SavedCreditNote in je v statusu draft, ga posodobimo na sent
    if ('id' in creditNote && creditNote.status === 'draft') {
      await updateCreditNoteStatus(creditNote.id!, 'sent')
    }

    const subject = `Dobropis št. ${creditNote.creditNoteNumber} - 2KM Consulting`
    const body = `
Spoštovani,

V priponki vam pošiljamo dobropis.

Podatki o dobropisu:
- Številka dobropisa: ${creditNote.creditNoteNumber}
- Datum izdaje: ${new Date(creditNote.issueDate).toLocaleDateString("sl-SI")}
- Znesek vračila: ${formatNumber(creditNote.totalPayable)} EUR

Vračilo zneska bo izvedeno v roku 14 dni na transakcijski račun, ki ste ga navedli.

Pri vračilu se bomo sklicevali na št. dobropisa: ${creditNote.creditNoteNumber}

Hvala za sodelovanje in lep pozdrav.

--
2KM Consulting d.o.o.
E: 2km.consulting@2km.si
    `.trim()

    const emailData: EmailData = {
      to: email,
      subject,
      body,
    }

    console.log("Sending email:", emailData)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mailtoLink = `mailto:${email}?cc=2km.consulting@2km.si&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink, "_blank")

    return true
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

export async function openEmailClient(creditNote: CreditNote | SavedCreditNote, recipientEmail?: string) {
  const email = recipientEmail || creditNote.customer.email

  if (!email) {
    alert("E-poštni naslov stranke ni na voljo")
    return
  }

  // Če je dobropis tipa SavedCreditNote in je v statusu draft, ga posodobimo na sent
  if ('id' in creditNote && creditNote.status === 'draft') {
    try {
      await updateCreditNoteStatus(creditNote.id!, 'sent')
      console.log(`Dobropis ${creditNote.creditNoteNumber} označen kot poslan`)
    } catch (error) {
      console.error('Napaka pri posodabljanju statusa dobropisa:', error)
      // Nadaljujemo z odpiranjem e-pošte kljub napaki
    }
  }

  const subject = `Dobropis št. ${creditNote.creditNoteNumber} - 2KM Consulting`
  const body = `
Spoštovani,

V priponki vam pošiljamo dobropis.

Podatki o dobropisu:
- Številka dobropisa: ${creditNote.creditNoteNumber}
- Datum izdaje: ${new Date(creditNote.issueDate).toLocaleDateString("sl-SI")}
- Znesek vračila: ${formatNumber(creditNote.totalPayable)} EUR

Vračilo zneska bo izvedeno v roku 14 dni na transakcijski račun, ki ste ga navedli.

Pri vračilu se bomo sklicevali na št. dobropisa: ${creditNote.creditNoteNumber}

Hvala za sodelovanje in lep pozdrav.

--
2KM Consulting d.o.o.
E: 2km.consulting@2km.si
  `.trim()

  const mailtoLink = `mailto:${email}?cc=2km.consulting@2km.si&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoLink, "_blank")
}
