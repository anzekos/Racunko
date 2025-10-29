import type { Invoice, SavedInvoice } from "./database"

// Type za Offer
type Offer = Invoice & { offerNumber: string }
type SavedOffer = SavedInvoice & { offerNumber: string }

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

// Funkcija za posodobitev statusa ponudbe
async function updateOfferStatus(offerId: string, status: string): Promise<void> {
  try {
    const response = await fetch(`/api/offers/${offerId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      throw new Error('Napaka pri posodabljanju statusa ponudbe')
    }
  } catch (error) {
    console.error('Error updating offer status:', error)
    throw error
  }
}

export async function sendOfferEmail(offer: Offer, recipientEmail?: string): Promise<boolean> {
  try {
    const email = recipientEmail || offer.customer.email

    if (!email) {
      throw new Error("E-poštni naslov ni na voljo")
    }

    // Če je ponudba tipa SavedOffer in je v statusu draft, jo posodobimo na sent
    if ('id' in offer && offer.status === 'draft') {
      await updateOfferStatus(offer.id!, 'sent')
    }

    const subject = `Ponudba št. ${offer.offerNumber} - 2KM Consulting`
    const body = `
Spoštovani,

V priponki vam pošiljamo ponudbo za storitev.

Podatki o ponudbi:
- Številka ponudbe: ${offer.offerNumber}
- Datum izdaje: ${new Date(offer.issueDate).toLocaleDateString("sl-SI")}
- Veljavnost: ${new Date(offer.dueDate).toLocaleDateString("sl-SI")}
- Znesek: ${formatNumber(offer.totalPayable)} EUR

Prosimo vas za pregled ponudbe. Za dodatna pojasnila smo vam na voljo.

Hvala za sodelovanje in lep pozdrav.
    `.trim()

    const emailData: EmailData = {
      to: email,
      subject,
      body,
    }

    console.log("Sending email:", emailData)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink, "_blank")

    return true
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

export async function openEmailClient(offer: Offer | SavedOffer, recipientEmail?: string) {
  const email = recipientEmail || offer.customer.email

  if (!email) {
    alert("E-poštni naslov stranke ni na voljo")
    return
  }

  // Če je ponudba tipa SavedOffer in je v statusu draft, jo posodobimo na sent
  if ('id' in offer && offer.status === 'draft') {
    try {
      await updateOfferStatus(offer.id!, 'sent')
      console.log(`Ponudba ${offer.offerNumber} označena kot poslana`)
    } catch (error) {
      console.error('Napaka pri posodabljanju statusa ponudbe:', error)
      // Nadaljujemo z odpiranjem e-pošte kljub napaki
    }
  }

  const subject = `Ponudba št. ${offer.offerNumber} - 2KM Consulting`
  const body = `
Spoštovani,

V priponki vam pošiljamo ponudbo za storitev.

Podatki o ponudbi:
- Številka ponudbe: ${offer.offerNumber}
- Datum izdaje: ${new Date(offer.issueDate).toLocaleDateString("sl-SI")}
- Veljavnost: ${new Date(offer.dueDate).toLocaleDateString("sl-SI")}
- Znesek: ${formatNumber(offer.totalPayable)} EUR

Prosimo vas za pregled ponudbe. Za dodatna pojasnila smo vam na voljo.

Hvala za sodelovanje in lep pozdrav.
  `.trim()

  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoLink, "_blank")
}
