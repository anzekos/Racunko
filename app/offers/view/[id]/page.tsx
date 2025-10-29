// app/offers/view/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { OfferPreview } from "@/components/offer-preview"
import { ArrowLeft, Edit, Copy, CheckCircle, XCircle } from "lucide-react"
import { fetchOfferById, type SavedOffer, updateOfferStatus } from "@/lib/database"
import { downloadOfferPDFFromPreview, generateOfferPDFFromElement } from "@/lib/pdf-generator-offer"
import { openEmailClient } from "@/lib/email-service"

export default function OfferViewPage() {
  const params = useParams()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [offer, setOffer] = useState<SavedOffer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadOffer(params.id as string)
    }
  }, [params.id])

  const loadOffer = async (id: string) => {
    try {
      setLoading(true)
      const data = await fetchOfferById(id)
      setOffer(data)
    } catch (error) {
      console.error("Error loading offer:", error)
      alert("Napaka pri nalaganju ponudbe")
      router.push("/offers/list")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (offer) {
      downloadOfferPDFFromPreview(offer)
    }
  }

  const handleSendEmail = async () => {
    if (offer) {
      try {
        await openEmailClient(offer, 'offer')
        await loadOffer(offer.id!)
      } catch (error) {
        console.error("Error sending email:", error)
        alert("Napaka pri pošiljanju e-pošte")
      }
    }
  }

  const handleEdit = () => {
    if (offer) {
      router.push(`/offers?edit=${offer.id}`)
    }
  }

  const handleSaveAs = () => {
    if (offer) {
      router.push(`/offers?edit=${offer.id}&saveAs=true`)
    }
  }

  const handleMarkAsAccepted = async () => {
    if (offer) {
      if (confirm(`Ali ste prepričani, da želite označiti ponudbo ${offer.offerNumber} kot sprejeto?`)) {
        try {
          await updateOfferStatus(offer.id!, 'accepted')
          await loadOffer(offer.id!)
        } catch (error) {
          console.error("Error marking offer as accepted:", error)
          alert("Napaka pri označevanju ponudbe kot sprejete")
        }
      }
    }
  }

  const handleMarkAsRejected = async () => {
    if (offer) {
      if (confirm(`Ali ste prepričani, da želite označiti ponudbo ${offer.offerNumber} kot zavrnjeno?`)) {
        try {
          await updateOfferStatus(offer.id!, 'rejected')
          loadOffer(offer.id!)
        } catch (error) {
          console.error("Error marking offer as rejected:", error)
          alert("Napaka pri označevanju ponudbe kot zavrnjene")
        }
      }
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <Header />

        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              <div className="max-w-6xl mx-auto">
                {loading ? (
                  <div className="text-center py-8">Nalagam ponudbo...</div>
                ) : offer ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => router.push("/offers/list")}
                          className="gap-2 bg-transparent"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Nazaj na seznam
                        </Button>
                        <div>
                          <h1 className="text-2xl font-semibold text-foreground">
                            Ponudba {offer.offerNumber}
                          </h1>
                          <p className="text-sm text-muted-foreground">
                            {offer.customer.Stranka}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              offer.status === 'accepted' 
                                ? 'bg-green-100 text-green-800'
                                : offer.status === 'sent'
                                ? 'bg-blue-100 text-blue-800'
                                : offer.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {offer.status === 'accepted' ? 'Sprejeta' : 
                               offer.status === 'sent' ? 'Poslana' : 
                               offer.status === 'rejected' ? 'Zavrnjena' : 'Osnutek'}
                            </span>
                            {offer.status === 'accepted' && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            {offer.status === 'rejected' && (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {offer.status !== 'accepted' && offer.status !== 'rejected' && (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={handleMarkAsAccepted} 
                              className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Označi kot sprejeto
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={handleMarkAsRejected} 
                              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                              Označi kot zavrnjeno
                            </Button>
                          </>
                        )}
                        <Button variant="outline" onClick={handleSaveAs} className="gap-2">
                          <Copy className="h-4 w-4" />
                          Shrani kot novo
                        </Button>
                        <Button variant="outline" onClick={handleEdit} className="gap-2">
                          <Edit className="h-4 w-4" />
                          Uredi ponudbo
                        </Button>
                      </div>
                    </div>

                    <OfferPreview
                      offer={offer}
                      onDownload={handleDownloadPDF}
                      onSendEmail={handleSendEmail}
                    />
                  </>
                ) : (
                  <div className="text-center py-8">Ponudba ni bila najdena</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
