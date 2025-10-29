// app/credit-notes/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CreditNoteForm } from "@/components/credit-note-form"
import { CreditNotePreview } from "@/components/credit-note-preview"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, ArrowLeft, Copy, Receipt } from "lucide-react"
import { fetchCustomers, fetchCreditNotes, saveCreditNote, updateCreditNote, type Customer, type CreditNote, type SavedCreditNote } from "@/lib/database"
import { downloadCreditNotePDFFromPreview, generateCreditNotePDFFromElement } from "@/lib/pdf-generator-credit-note"
import { openEmailClient, sendCreditNoteEmail } from "@/lib/email-service-credit-note"
import { Suspense } from "react"

function CreditNotesPageContent() {
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentCreditNote, setCurrentCreditNote] = useState<CreditNote | null>(null)
  const [editingCreditNote, setEditingCreditNote] = useState<SavedCreditNote | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creditNoteCount, setCreditNoteCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveAsMode, setSaveAsMode] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      loadCreditNoteForEdit(editId)
    }
  }, [searchParams])

  const loadData = async () => {
    try {
      setLoading(true)
      const [customersData, creditNotesData] = await Promise.all([
        fetchCustomers(),
        fetchCreditNotes()
      ])
      setCustomers(customersData)
      setCreditNoteCount(creditNotesData.length)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCreditNoteForEdit = async (id: string) => {
    try {
      const creditNotes = await fetchCreditNotes()
      const found = creditNotes.find(creditNote => creditNote.id === id)
      if (found) {
        setEditingCreditNote(found)
        setSaveAsMode(false)
      }
    } catch (error) {
      console.error("Error loading credit note for edit:", error)
    }
  }

  const handleCreditNoteCreate = async (creditNoteData: CreditNote, isSaveAs: boolean = false) => {
    try {
      setSaving(true)
      
      if (isSaveAs || saveAsMode) {
        const saved = await saveCreditNote({
          ...creditNoteData,
        })
        setCurrentCreditNote(saved)
        setCreditNoteCount(prev => prev + 1)
        setSaveAsMode(false)
      } else if (editingCreditNote) {
        const updated = await updateCreditNote(editingCreditNote.id!, creditNoteData)
        setCurrentCreditNote(updated)
        setEditingCreditNote(null)
      } else {
        const saved = await saveCreditNote(creditNoteData)
        setCurrentCreditNote(saved)
        setCreditNoteCount(prev => prev + 1)
      }
      
      setShowPreview(true)
    } catch (error) {
      console.error("Error saving credit note:", error)
      alert("Napaka pri shranjevanju dobropisa. Prosimo, poskusite znova.")
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
      loadCreditNoteForEdit(editId)
      if (saveAsParam === 'true') {
        setSaveAsMode(true)
      }
    }
  }, [searchParams])

  const handleBackToForm = () => {
    setShowPreview(false)
    setCurrentCreditNote(null)
    setEditingCreditNote(null)
    setSaveAsMode(false)
  }

  const handleDownloadPDF = () => {
    if (currentCreditNote) {
      downloadCreditNotePDF(currentCreditNote)
    }
  }

  const handleSendEmail = async () => {
    if (currentCreditNote) {
      try {
        openEmailClient(currentCreditNote, 'credit-note')
      } catch (error) {
        console.error("Error sending email:", error)
        alert("Napaka pri pošiljanju e-pošte. Preverite e-poštni naslov stranke.")
      }
    }
  }

  const handleEditCreditNote = () => {
    if (currentCreditNote) {
      setEditingCreditNote(currentCreditNote as SavedCreditNote)
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
                          {editingCreditNote 
                            ? (saveAsMode ? "Shrani dobropis kot nov" : "Urejanje dobropisa") 
                            : "Generiranje dobropisov"
                          }
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                          {editingCreditNote 
                            ? (saveAsMode 
                                ? `Ustvarjate nov dobropis na podlagi dobropisa št. ${editingCreditNote.creditNoteNumber}`
                                : `Urejate dobropis št. ${editingCreditNote.creditNoteNumber}`
                              )
                            : "Ustvarite profesionalne dobropise z avtomatskim izračunom DDV"
                          }
                        </p>
                      </div>
                      <Link href="/credit-notes/list">
                        <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Receipt className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Aktivni dobropisi</p>
                              <p className="text-lg font-semibold">{creditNoteCount}</p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </div>

                    <CreditNoteForm 
                      customers={customers} 
                      onCreditNoteCreate={handleCreditNoteCreate} 
                      onSaveAs={handleSaveAs}
                      loading={loading}
                      saving={saving}
                      editingCreditNote={editingCreditNote}
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
                          <h1 className="text-2xl font-semibold text-foreground">Predogled dobropisa</h1>
                          <p className="text-sm text-muted-foreground">Dobropis št. {currentCreditNote?.creditNoteNumber}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleEditCreditNote} className="gap-2">
                          Uredi dobropis
                        </Button>
                      </div>
                    </div>

                    {currentCreditNote && (
                      <CreditNotePreview
                        creditNote={currentCreditNote}
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

export default function CreditNotesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Nalagam...</div>}>
      <CreditNotesPageContent />
    </Suspense>
  )
}
