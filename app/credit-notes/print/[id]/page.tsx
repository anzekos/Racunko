"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { CreditNotePreview } from "@/components/credit-note-preview"
import { fetchCreditNoteById, type SavedCreditNote } from "@/lib/database"

export default function CreditNotePrintPage() {
  const params = useParams()
  const [creditNote, setCreditNote] = useState<SavedCreditNote | null>(null)

  useEffect(() => {
    const id = params.id as string | undefined
    if (!id) return
    fetchCreditNoteById(id)
      .then(setCreditNote)
      .catch(() => setCreditNote(null))
  }, [params.id])

  if (!creditNote) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-4xl mx-auto text-sm text-gray-600">Nalagam dobropis…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6 print:p-0">
      <style dangerouslySetInnerHTML={{ __html: `.normal-footer { display: none !important; }` }} />
      <CreditNotePreview creditNote={creditNote} onDownload={() => {}} onSendEmail={() => {}} />
    </div>
  )
}
