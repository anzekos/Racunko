"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { OfferPreview } from "@/components/offer-preview"
import { fetchOfferById, type SavedOffer } from "@/lib/database"

export default function OfferPrintPage() {
  const params = useParams()
  const [offer, setOffer] = useState<SavedOffer | null>(null)

  useEffect(() => {
    const id = params.id as string | undefined
    if (!id) return
    fetchOfferById(id)
      .then(setOffer)
      .catch(() => setOffer(null))
  }, [params.id])

  if (!offer) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-4xl mx-auto text-sm text-gray-600">Nalagam ponudbo…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6 print:p-0">
      <style dangerouslySetInnerHTML={{ __html: `.normal-footer { display: none !important; }` }} />
      <OfferPreview offer={offer} onDownload={() => {}} onSendEmail={() => {}} />
    </div>
  )
}
