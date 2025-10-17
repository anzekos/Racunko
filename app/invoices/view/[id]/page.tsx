"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { InvoicePreview } from "@/components/invoice-preview"
import { ArrowLeft, Edit, Copy, CheckCircle } from "lucide-react"
import { fetchInvoiceById, type SavedInvoice, updateInvoiceStatus } from "@/lib/database"
import { downloadInvoicePDF } from "@/lib/pdf-generator"
import { openEmailClient } from "@/lib/email-service"

export default function InvoiceViewPage() {
  const params = useParams()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [invoice, setInvoice] = useState<SavedInvoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadInvoice(params.id as string)
    }
  }, [params.id])

  const loadInvoice = async (id: string) => {
    try {
      setLoading(true)
      const data = await fetchInvoiceById(id)
      setInvoice(data)
    } catch (error) {
      console.error("Error loading invoice:", error)
      alert("Napaka pri nalaganju računa")
      router.push("/invoices/list")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (invoice) {
      downloadInvoicePDF(invoice)
    }
  }

  const handleSendEmail = async () => {
    if (invoice) {
      try {
        await openEmailClient(invoice)
        // Osvežimo podatke, da vidimo spremembo statusa
        await loadInvoice(invoice.id!)
      } catch (error) {
        console.error("Error sending email:", error)
        alert("Napaka pri pošiljanju e-pošte")
      }
    }
  }

  const handleEdit = () => {
    if (invoice) {
      router.push(`/invoices?edit=${invoice.id}`)
    }
  }

  const handleSaveAs = () => {
    if (invoice) {
      router.push(`/invoices?edit=${invoice.id}&saveAs=true`)
    }
  }

  // Dodajte funkcijo za označevanje kot plačan
  const handleMarkAsPaid = async () => {
    if (invoice) {
      if (confirm(`Ali ste prepričani, da želite označiti račun ${invoice.invoiceNumber} kot plačan?`)) {
        try {
          await updateInvoiceStatus(invoice.id!, 'paid')
          // Osvežimo podatke
          await loadInvoice(invoice.id!)
        } catch (error) {
          console.error("Error marking invoice as paid:", error)
          alert("Napaka pri označevanju računa kot plačan")
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
                  <div className="text-center py-8">Nalagam račun...</div>
                ) : invoice ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => router.push("/invoices/list")}
                          className="gap-2 bg-transparent"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Nazaj na seznam
                        </Button>
                        <div>
                          <h1 className="text-2xl font-semibold text-foreground">
                            Račun {invoice.invoiceNumber}
                          </h1>
                          <p className="text-sm text-muted-foreground">
                            {invoice.customer.Stranka}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              invoice.status === 'paid' 
                                ? 'bg-green-100 text-green-800'
                                : invoice.status === 'sent'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {invoice.status === 'paid' ? 'Plačan' : 
                               invoice.status === 'sent' ? 'Poslan' : 'Osnutek'}
                            </span>
                            {invoice.status === 'paid' && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {invoice.status !== 'paid' && (
                          <Button 
                            variant="outline" 
                            onClick={handleMarkAsPaid} 
                            className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Označi kot plačan
                          </Button>
                        )}
                        <Button variant="outline" onClick={handleSaveAs} className="gap-2">
                          <Copy className="h-4 w-4" />
                          Shrani kot nov
                        </Button>
                        <Button variant="outline" onClick={handleEdit} className="gap-2">
                          <Edit className="h-4 w-4" />
                          Uredi račun
                        </Button>
                      </div>
                    </div>

                    <InvoicePreview
                      invoice={invoice}
                      onDownload={handleDownloadPDF}
                      onSendEmail={handleSendEmail}
                    />
                  </>
                ) : (
                  <div className="text-center py-8">Račun ni bil najden</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
