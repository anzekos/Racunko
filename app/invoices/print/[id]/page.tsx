"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { InvoicePreview } from "@/components/invoice-preview"
import { fetchInvoiceById, type SavedInvoice } from "@/lib/database"

export default function InvoicePrintPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [invoice, setInvoice] = useState<SavedInvoice | null>(null)
  const autoprint = searchParams.get("autoprint") === "1"

  useEffect(() => {
    const id = params.id as string | undefined
    if (!id) return
    fetchInvoiceById(id).then(setInvoice).catch(() => setInvoice(null))
  }, [params.id])

  useEffect(() => {
    if (!invoice || !autoprint) return
    // počakaj, da se naložijo fonti in slike pred print dialogom
    const timer = setTimeout(() => {
      window.print()
    }, 600)
    return () => clearTimeout(timer)
  }, [invoice, autoprint])

  if (!invoice) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-4xl mx-auto text-sm text-gray-600">Nalagam račun…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6 print:p-0">
      <InvoicePreview invoice={invoice} onDownload={() => {}} onSendEmail={() => {}} />
    </div>
  )
}
