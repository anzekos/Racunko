"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { DocumentForm } from "@/components/document-form"
import { QuotePreview } from "@/components/quote-preview"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileStack, ArrowLeft } from "lucide-react"
import { 
  fetchCustomers, 
  fetchQuotes, 
  saveQuote, 
  updateQuote, 
  type Customer, 
  type Quote, 
  type SavedQuote 
} from "@/lib/database"
import { downloadQuotePDF } from "@/lib/pdf-generator"
import { openEmailClient } from "@/lib/email-service"
import { Suspense } from "react"

function QuotesPageContent() {
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null)
  const [editingQuote, setEditingQuote] = useState<SavedQuote | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [quoteCount, setQuoteCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveAsMode, setSaveAsMode] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const editId = searchParams.get('edit')
    const saveAsParam = searchParams.get('saveAs')
    
    if (editId) {
      loadQuoteForEdit(editId)
      if (saveAsParam === 'true') {
        setSaveAsMode(true)
      }
    }
  }, [searchParams])

  const loadData = async () => {
    try {
      setLoading(true)
      const [customersData, quotesData] = await Promise.all([
        fetchCustomers(),
        fetchQuotes()
      ])
      setCustomers(customersData)
      setQuoteCount(quotesData.length)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadQuoteForEdit = async (id: string) => {
    try {
      const quotes = await fetchQuotes()
      const found = quotes.find(q => q.id === id)
      if (found) {
        setEditingQuote(found)
        setSaveAsMode(false)
      }
    } catch (error) {
      console.error("Error loading quote for edit:", error)
    }
  }

  const handleQuoteCreate = async (quoteData: Quote, isSaveAs: boolean = false) => {
    try {
      setSaving(true)
      
      if (isSaveAs || saveAsMode) {
        const saved = await saveQuote(quoteData)
        setCurrentQuote(saved)
        setQuoteCount(prev => prev + 1)
        setSaveAsMode(false)
      } else if (editingQuote) {
        const updated = await updateQuote(editingQuote.id!, quoteData)
        setCurrentQuote(updated)
        setEditingQuote(null)
      } else {
        const saved = await saveQuote(quoteData)
        setCurrentQuote(saved)
        setQuoteCount(prev => prev + 1)
      }
      
      setShowPreview(true)
    } catch (error) {
      console.error("Error saving quote:", error)
      alert("Napaka pri shranjevanju ponudbe. Prosimo, poskusite znova.")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAs = () => {
    setSaveAsMode(true)
  }

  const handleBackToForm = () => {
    setShowPreview(false)
    setCurrentQuote(null)
    setEditingQuote(null)
    setSaveAsMode(false)
  }

  const handleDownloadPDF = () => {
    if (currentQuote) {
      downloadQuotePDF(currentQuote)
    }
  }

  const handleSendEmail = async () => {
    if (currentQuote) {
      try {
        openEmailClient(currentQuote, 'quote')
      } catch (error) {
        console.error("Error sending email:", error)
        alert("Napaka pri pošiljanju e-pošte. Preverite e-poštni naslov stranke.")
      }
    }
  }

  const handleEditQuote = () => {
    if (currentQuote) {
      setEditingQuote(currentQuote as SavedQuote)
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
                          {editingQuote 
                            ? (saveAsMode ? "Shrani ponudbo kot novo" : "Urejanje ponudbe") 
                            : "Generiranje ponudb"
                          }
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                          {editingQuote 
                            ? (saveAsMode 
                                ? `Ustvarjate novo ponudbo na podlagi ponudbe št. ${editingQuote.quoteNumber}`
                                : `Urejate ponudbo št. ${editingQuote.quoteNumber}`
                              )
                            : "Ustvarite profesionalne ponudbe z avtomatskim izračunom DDV"
                          }
                        </p>
                      </div>
                      <Link href="/quotes/list">
                        <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <FileStack className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Aktivne ponudbe</p>
                              <p className="text-lg font-semibold">{quoteCount}</p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </div>

                    <DocumentForm 
                      type="quote"
                      customers={customers} 
                      onDocumentCreate={handleQuoteCreate} 
                      onSaveAs={handleSaveAs}
                      loading={loading}
                      saving={saving}
                      editingDocument={editingQuote}
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
                          <p className="text-sm text-muted-foreground">Ponudba št. {currentQuote?.quoteNumber}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleEditQuote} className="gap-2">
                          Uredi ponudbo
                        </Button>
                      </div>
                    </div>

                    {currentQuote && (
                      <QuotePreview
                        quote={currentQuote}
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

export default function QuotesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Nalagam...</div>}>
      <QuotesPageContent />
    </Suspense>
  )
}
