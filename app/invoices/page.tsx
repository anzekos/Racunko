"use client"

import { useState, useEffect } from "react"
import { InvoiceForm } from "@/components/invoice-form"
import { InvoicePreview } from "@/components/invoice-preview"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, ArrowLeft, Edit } from "lucide-react"
import { fetchCustomers, type Customer, type Invoice, type SavedInvoice, saveInvoice, fetchInvoices, updateInvoice } from "@/lib/database"
import { downloadInvoicePDF } from "@/lib/pdf-generator"
import { openEmailClient } from "@/lib/email-service"

export default function InvoicesPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoices, setInvoices] = useState<SavedInvoice[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState<SavedInvoice | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [customersData, invoicesData] = await Promise.all([
        fetchCustomers(),
        fetchInvoices()
      ])
      setCustomers(customersData)
      setInvoices(invoicesData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvoiceCreate = async (invoiceData: Invoice) => {
    try {
      const savedInvoice = await saveInvoice(invoiceData)
      setCurrentInvoice(savedInvoice)
      setShowPreview(true)
      setIsEditing(false)
      await loadData() // Refresh the invoice list
    } catch (error) {
      console.error("Error saving invoice:", error)
      alert("Napaka pri shranjevanju računa: " + error.message)
    }
  }

  const handleInvoiceUpdate = async (invoiceData: Invoice) => {
    if (!currentInvoice) return
    
    try {
      const updatedInvoice = await updateInvoice(currentInvoice.id, invoiceData)
      setCurrentInvoice(updatedInvoice)
      setShowPreview(true)
      setIsEditing(false)
      await loadData() // Refresh the invoice list
    } catch (error) {
      console.error("Error updating invoice:", error)
      alert("Napaka pri posodabljanju računa: " + error.message)
    }
  }

  const handleBackToForm = () => {
    setShowPreview(false)
    setCurrentInvoice(null)
    setIsEditing(false)
  }

  const handleEditInvoice = () => {
    setIsEditing(true)
    setShowPreview(false)
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

  const activeInvoicesCount = invoices.filter(inv => 
    inv.status === 'draft' || inv.status === 'sent'
  ).length

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
                          {isEditing ? 'Urejanje računa' : 'Generiranje računov'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isEditing 
                            ? `Urejate račun: ${currentInvoice?.invoiceNumber}`
                            : 'Ustvarite profesionalne račune z avtomatskim izračunom DDV'
                          }
                        </p>
                      </div>
                      <Card className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Aktivni računi</p>
                            <p className="text-lg font-semibold">{activeInvoicesCount}</p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <InvoiceForm 
                      customers={customers} 
                      onInvoiceCreate={isEditing ? handleInvoiceUpdate : handleInvoiceCreate}
                      existingInvoice={isEditing ? currentInvoice : null}
                      loading={loading} 
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={handleBackToForm} className="gap-2 bg-transparent">
                          <ArrowLeft className="h-4 w-4" />
                          Nazaj na seznam
                        </Button>
                        <div>
                          <h1 className="text-2xl font-semibold text-foreground">Predogled računa</h1>
                          <p className="text-sm text-muted-foreground">Račun št. {currentInvoice?.invoiceNumber}</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={handleEditInvoice} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Uredi račun
                      </Button>
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
