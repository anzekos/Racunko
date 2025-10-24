// lib/database.ts
import { query } from './db-connection'

// Osnovni tipi
export interface Customer {
  id?: number
  Stranka?: string
  Naslov?: string
  Kraj_postna_st?: string
  email?: string
  ID_DDV?: string
  Ukrep?: string
  JR?: string
  Pogodba?: string
  VLG?: number
  VLG_z_DDV?: number
  Gotovina_1?: number
  Status_1?: string
  Racun_izdal_1?: string
  Opomba_Ponudba?: string
  Provizija?: number
  ODL?: number
  ODL_z_DDV?: number
  Gotovina_2?: number
  Status_2?: string
  Racun_izdal_2?: string
  Delež_odločba?: number
  ZAH1?: number
  ZAH1_z_DDV?: number
  Gotovina_3?: number
  Status_3?: string
  Racun_izdal_3?: string
  Delež_zah1?: number
  ZAH2?: number
  ZAH2_z_DDV?: number
  Gotovina_4?: number
  Status_4?: string
  Racun_izdal_4?: string
  Delež_zah2?: number
  ZAH3?: number
  ZAH3_z_DDV?: number
  Gotovina_5?: number
  Status_5?: string
  Racun_izdal_5?: string
  Delež_zah3?: number
  ZAH4?: number
  ZAH4_z_DDV?: number
  Gotovina_6?: number
  Status_6?: string
  Racun_izdal_6?: string
  Delež_zah4?: number
  ZAH5?: number
  ZAH5_z_DDV?: number
  Gotovina_7?: number
  Status_7?: string
  Racun_izdal_7?: string
  Delež_zah5?: number
  Informacije?: string
  ODL_izplacano?: number
  ZAH1_izplacano?: number
  ZAH2_izplacano?: number
  ZAH3_izplacano?: number
  ZAH4_izplacano?: number
  ZAH5_izplacano?: number
  Izplacano?: number
  Status_8?: string
  SKUPAJ?: number
  KONTROLA?: number
}

export interface DocumentItem {
  description: string
  quantity: number
  price: number
  total: number
}

// Računi (Invoices)
export interface Invoice {
  id?: string
  invoiceNumber: string
  customer: Customer
  items: DocumentItem[]
  serviceDescription: string
  issueDate: string
  dueDate: string
  serviceDate: string
  totalWithoutVat: number
  vat: number
  totalPayable: number
}

export interface SavedInvoice extends Invoice {
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  createdAt: string
  updatedAt: string
}

// Ponudbe (Quotes)
export interface Quote {
  id?: string
  quoteNumber: string
  customer: Customer
  items: DocumentItem[]
  serviceDescription: string
  issueDate: string
  validUntil: string
  serviceDate: string
  totalWithoutVat: number
  vat: number
  totalPayable: number
}

export interface SavedQuote extends Quote {
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  createdAt: string
  updatedAt: string
}

// Dobropisi (Credit Notes)
export interface CreditNote {
  id?: string
  creditNoteNumber: string
  customer: Customer
  originalInvoiceNumber?: string
  items: DocumentItem[]
  serviceDescription: string
  issueDate: string
  serviceDate: string
  totalWithoutVat: number
  vat: number
  totalPayable: number
}

export interface SavedCreditNote extends CreditNote {
  status: 'draft' | 'sent' | 'processed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

// Customer API functions
export async function fetchCustomers(): Promise<Customer[]> {
  try {
    const response = await fetch("/api/customers")
    if (!response.ok) throw new Error("Failed to fetch customers")
    return await response.json()
  } catch (error) {
    console.error("Error fetching customers:", error)
    return []
  }
}

// Invoice API functions
export async function saveInvoice(invoice: Invoice): Promise<SavedInvoice> {
  const response = await fetch('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoice),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Napaka pri shranjevanju računa')
  }
  return response.json()
}

export async function fetchInvoices(): Promise<SavedInvoice[]> {
  const response = await fetch('/api/invoices')
  if (!response.ok) throw new Error('Napaka pri nalaganju računov')
  return response.json()
}

export async function fetchInvoiceById(id: string): Promise<SavedInvoice> {
  const response = await fetch(`/api/invoices/${id}`)
  if (!response.ok) throw new Error('Napaka pri nalaganju računa')
  return response.json()
}

export async function updateInvoice(id: string, invoice: Invoice): Promise<SavedInvoice> {
  const response = await fetch(`/api/invoices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoice),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Napaka pri posodabljanju računa')
  }
  return response.json()
}

export async function deleteInvoice(id: string): Promise<void> {
  const response = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Napaka pri brisanju računa')
}

export async function updateInvoiceStatus(invoiceId: string, status: string): Promise<void> {
  const response = await fetch(`/api/invoices/${invoiceId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error('Napaka pri posodabljanju statusa računa')
}

// Quote API functions
export async function saveQuote(quote: Quote): Promise<SavedQuote> {
  const response = await fetch('/api/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quote),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Napaka pri shranjevanju ponudbe')
  }
  return response.json()
}

export async function fetchQuotes(): Promise<SavedQuote[]> {
  const response = await fetch('/api/quotes')
  if (!response.ok) throw new Error('Napaka pri nalaganju ponudb')
  return response.json()
}

export async function fetchQuoteById(id: string): Promise<SavedQuote> {
  const response = await fetch(`/api/quotes/${id}`)
  if (!response.ok) throw new Error('Napaka pri nalaganju ponudbe')
  return response.json()
}

export async function updateQuote(id: string, quote: Quote): Promise<SavedQuote> {
  const response = await fetch(`/api/quotes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quote),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Napaka pri posodabljanju ponudbe')
  }
  return response.json()
}

export async function deleteQuote(id: string): Promise<void> {
  const response = await fetch(`/api/quotes/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Napaka pri brisanju ponudbe')
}

export async function updateQuoteStatus(quoteId: string, status: string): Promise<void> {
  const response = await fetch(`/api/quotes/${quoteId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error('Napaka pri posodabljanju statusa ponudbe')
}

// Credit Note API functions
export async function saveCreditNote(creditNote: CreditNote): Promise<SavedCreditNote> {
  const response = await fetch('/api/credit-notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creditNote),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Napaka pri shranjevanju dobropisa')
  }
  return response.json()
}

export async function fetchCreditNotes(): Promise<SavedCreditNote[]> {
  const response = await fetch('/api/credit-notes')
  if (!response.ok) throw new Error('Napaka pri nalaganju dobropisov')
  return response.json()
}

export async function fetchCreditNoteById(id: string): Promise<SavedCreditNote> {
  const response = await fetch(`/api/credit-notes/${id}`)
  if (!response.ok) throw new Error('Napaka pri nalaganju dobropisa')
  return response.json()
}

export async function updateCreditNote(id: string, creditNote: CreditNote): Promise<SavedCreditNote> {
  const response = await fetch(`/api/credit-notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creditNote),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Napaka pri posodabljanju dobropisa')
  }
  return response.json()
}

export async function deleteCreditNote(id: string): Promise<void> {
  const response = await fetch(`/api/credit-notes/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Napaka pri brisanju dobropisa')
}

export async function updateCreditNoteStatus(creditNoteId: string, status: string): Promise<void> {
  const response = await fetch(`/api/credit-notes/${creditNoteId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error('Napaka pri posodabljanju statusa dobropisa')
}
