// app/offers/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { OfferForm } from "@/components/offer-form"
import { OfferPreview } from "@/components/offer-preview"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, ArrowLeft, Copy } from "lucide-react"
import { fetchCustomers, fetchOffers, saveOffer, updateOffer, type Customer, type Offer, type SavedOffer } from "@/lib/database"
import { downloadOfferPDF } from "@/lib/pdf-generator"
import { openEmailClient } from "@/lib/email-service"
import { Suspense } from "react"

function OffersPageContent() {
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null)
  const [editingOffer, setEditingOffer] = useState<SavedOffer | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [offerCount, setOfferCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveAsMode, setSaveAsMode] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      loadOfferForEdit(editId)
    }
  }, [searchParams])

  const loadData = async () => {
    try {
      setLoading(true)
      const [customersData, offersData] = await Promise.all([
        fetchCustomers(),
        fetchOffers()
      ])
      setCustomers(customersData)
      setOfferCount(offersData.length)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadOfferForEdit = async (id: string) => {
    try {
      const offers = await fetchOffers()
      const found = offers.find(offer => offer.id === id)
      if (found) {
        setEditingOffer(found)
        setSaveAsMode(false)
      }
    } catch (error) {
      console.error("Error loading offer for edit:", error)
    }
  }

  const handleOfferCreate = async (offerData: Offer, isSaveAs: boolean = false) => {
    try {
      setSaving(true)
      
      if (isSaveAs || saveAsMode) {
        const saved = await saveOffer({
          ...offerData,
        })
        setCurrentOffer(saved)
        setOfferCount(prev => prev + 1)
        setSaveAsMode(false)
      } else if (editingOffer) {
        const updated = await updateOffer(editingOffer.id!, offerData)
        setCurrentOffer(updated)
        setEditingOffer(null)
      } else {
        const saved = await saveOffer(offerData)
        setCurrentOffer(saved)
        setOfferCount(prev => prev + 1)
      }
      
      setShowPreview(true)
    } catch (error) {
      console.error("Error saving offer:", error)
      alert("Napaka pri shranjevanju ponudbe. Prosimo, poskusite znova.")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAs = () => {
    setSaveAsMode(true)
  }

  useEffect(() => {
    const editId = searchParams.get('edit')
    const saveAsParam = searchParams.get('saveAs')
    
    if (editId) {
      loadOfferForEdit(editId)
      if (saveAsParam === 'true') {
        setSaveAsMode(true)
      }
    }
  }, [searchParams])

  const handleBackToForm = () => {
    setShowPreview(false)
    setCurrentOffer(null)
    setEditingOffer(null)
    setSaveAsMode(false)
  }

  const handleDownloadPDF = () => {
    if (currentOffer) {
      downloadOfferPDF(currentOffer)
    }
  }

  const handleSendEmail = async () => {
    if (currentOffer) {
      try {
        openEmailClient(currentOffer, 'offer')
      } catch (error) {
        console.error("Error sending email:", error)
        alert("Napaka pri pošiljanju e-pošte. Preverite e-poštni naslov stranke.")
      }
    }
  }

  const handleEditOffer = () => {
    if (currentOffer) {
      setEditingOffer(currentOffer as SavedOffer)
      setShowPreview(false)
      setSaveAsMode(false)
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
                {!showPreview ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                          {editingOffer 
                            ? (saveAsMode ? "Shrani ponudbo kot novo" : "Urejanje ponudbe") 
                            : "Generiranje ponudb"
                          }
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                          {editingOffer 
                            ? (saveAsMode 
                                ? `Ustvarjate novo ponudbo na podlagi ponudbe št. ${editingOffer.offerNumber}`
                                : `Urejate ponudbo št. ${editingOffer.offerNumber}`
                              )
                            : "Ustvarite profesionalne ponudbe z avtomatskim izračunom DDV"
                          }
                        </p>
                      </div>
                      <Link href="/offers/list">
                        <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Aktivne ponudbe</p>
                              <p className="text-lg font-semibold">{offerCount}</p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </div>

                    <OfferForm 
                      customers={customers} 
                      onOfferCreate={handleOfferCreate} 
                      onSaveAs={handleSaveAs}
                      loading={loading}
                      saving={saving}
                      editingOffer={editingOffer}
                      saveAsMode={saveAsMode}
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={handleBackToForm} className="gap-2 bg-transparent">
                          <ArrowLeft className="h-4 w-4" />
                          Nazaj na obrazec
                        </Button>
                        <div>
                          <h1 className="text-2xl font-semibold text-foreground">Predogled ponudbe</h1>
                          <p className="text-sm text-muted-foreground">Ponudba št. {currentOffer?.offerNumber}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleEditOffer} className="gap-2">
                          Uredi ponudbo
                        </Button>
                      </div>
                    </div>

                    {currentOffer && (
                      <OfferPreview
                        offer={currentOffer}
                        onDownload={handleDownloadPDF}
                        onSendEmail={handleSendEmail}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function OffersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Nalagam...</div>}>
      <OffersPageContent />
    </Suspense>
  )
}
