// app/invoices/page.tsx - dodajte te spremembe
"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { InvoiceForm } from "@/components/invoice-form"
import { InvoicePreview } from "@/components/invoice-preview"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, ArrowLeft, Copy } from "lucide-react"
import { fetchCustomers, fetchInvoices, saveInvoice, updateInvoice, type Customer, type Invoice, type SavedInvoice } from "@/lib/database"
import { downloadInvoicePDF } from "@/lib/pdf-generator"
import { openEmailClient } from "@/lib/email-service"
import { Suspense } from "react"

function InvoicesPageContent() {
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<SavedInvoice | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [invoiceCount, setInvoiceCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveAsMode, setSaveAsMode] = useState(false) // Dodano stanje za Save As način

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      loadInvoiceForEdit(editId)
    }
  }, [searchParams])

  const loadData = async () => {
    try {
      setLoading(true)
      const [customersData, invoicesData] = await Promise.all([
        fetchCustomers(),
        fetchInvoices()
      ])
      setCustomers(customersData)
      setInvoiceCount(invoicesData.length)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadInvoiceForEdit = async (id: string) => {
    try {
      const invoices = await fetchInvoices()
      const found = invoices.find(inv => inv.id === id)
      if (found) {
        setEditingInvoice(found)
        setSaveAsMode(false) // Reset Save As načina ob nalaganju računa
      }
    } catch (error) {
      console.error("Error loading invoice for edit:", error)
    }
  }

  const handleInvoiceCreate = async (invoiceData: Invoice, isSaveAs: boolean = false) => {
    try {
      setSaving(true)
      
      // Če je Save As način ali če shranjujemo kot nov račun
      if (isSaveAs || saveAsMode) {
        const saved = await saveInvoice({
          ...invoiceData,
          invoiceNumber: generateNewInvoiceNumber() // Generiraj novo številko računa
        })
        setCurrentInvoice(saved)
        setInvoiceCount(prev => prev + 1)
        setSaveAsMode(false) // Reset Save As načina po uspešnem shranjevanju
      } else if (editingInvoice) {
        const updated = await updateInvoice(editingInvoice.id!, invoiceData)
        setCurrentInvoice(updated)
        setEditingInvoice(null)
      } else {
        const saved = await saveInvoice(invoiceData)
        setCurrentInvoice(saved)
        setInvoiceCount(prev => prev + 1)
      }
      
      setShowPreview(true)
    } catch (error) {
      console.error("Error saving invoice:", error)
      alert("Napaka pri shranjevanju računa. Prosimo, poskusite znova.")
    } finally {
      setSaving(false)
    }
  }

  // Funkcija za generiranje nove številke računa
  const generateNewInvoiceNumber = () => {
    const timestamp = new Date().getTime()
    const random = Math.floor(Math.random() * 1000)
    return `RAC-${timestamp}-${random}`
  }

  const handleSaveAs = () => {
    setSaveAsMode(true)
  }

  useEffect(() => {
  const editId = searchParams.get('edit')
  const saveAsParam = searchParams.get('saveAs')
  
  if (editId) {
    loadInvoiceForEdit(editId)
    if (saveAsParam === 'true') {
      setSaveAsMode(true)
    }
  }
}, [searchParams])

  const handleBackToForm = () => {
    setShowPreview(false)
    setCurrentInvoice(null)
    setEditingInvoice(null)
    setSaveAsMode(false)
  }

  const handleDownloadPDF = () => {
    if (currentInvoice) {
      downloadInvoicePDF(currentInvoice)
    }
  }

  const handleSendEmail = async () => {
    if (currentInvoice) {
      try {
        openEmailClient(currentInvoice)
      } catch (error) {
        console.error("Error sending email:", error)
        alert("Napaka pri pošiljanju e-pošte. Preverite e-poštni naslov stranke.")
      }
    }
  }

  const handleEditInvoice = () => {
    if (currentInvoice) {
      setEditingInvoice(currentInvoice as SavedInvoice)
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
                          {editingInvoice 
                            ? (saveAsMode ? "Shrani račun kot nov" : "Urejanje računa") 
                            : "Generiranje računov"
                          }
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                          {editingInvoice 
                            ? (saveAsMode 
                                ? `Ustvarjate nov račun na podlagi računa št. ${editingInvoice.invoiceNumber}`
                                : `Urejate račun št. ${editingInvoice.invoiceNumber}`
                              )
                            : "Ustvarite profesionalne račune z avtomatskim izračunom DDV"
                          }
                        </p>
                      </div>
                      <Link href="/invoices/list">
                        <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Aktivni računi</p>
                              <p className="text-lg font-semibold">{invoiceCount}</p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </div>

                    <InvoiceForm 
                      customers={customers} 
                      onInvoiceCreate={handleInvoiceCreate} 
                      onSaveAs={handleSaveAs}
                      loading={loading}
                      saving={saving}
                      editingInvoice={editingInvoice}
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
                          <h1 className="text-2xl font-semibold text-foreground">Predogled računa</h1>
                          <p className="text-sm text-muted-foreground">Račun št. {currentInvoice?.invoiceNumber}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleEditInvoice} className="gap-2">
                          Uredi račun
                        </Button>
                      </div>
                    </div>

                    {currentInvoice && (
                      <InvoicePreview
                        invoice={currentInvoice}
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

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Nalagam...</div>}>
      <InvoicesPageContent />
    </Suspense>
  )
}
