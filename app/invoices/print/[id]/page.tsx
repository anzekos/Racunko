"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { InvoicePreview } from "@/components/invoice-preview"
import { fetchInvoiceById, type SavedInvoice } from "@/lib/database"

export default function InvoicePrintPage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<SavedInvoice | null>(null)

  useEffect(() => {
    const id = params.id as string | undefined
    if (!id) return
    fetchInvoiceById(id)
      .then(setInvoice)
      .catch(() => setInvoice(null))
  }, [params.id])

  if (!invoice) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-4xl mx-auto text-sm text-gray-600">Nalagam račun…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6 print:p-0">
      {/* Print-only: brez navigacije, samo dokument */}
      <InvoicePreview invoice={invoice} onDownload={() => {}} onSendEmail={() => {}} />
    </div>
  )
}
