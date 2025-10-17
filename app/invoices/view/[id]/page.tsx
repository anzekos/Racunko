"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { InvoicePreview } from "@/components/invoice-preview"
import { ArrowLeft, Edit, Copy } from "lucide-react" // DODAJTE Copy V IMPORT
import { fetchInvoiceById, type SavedInvoice } from "@/lib/database"
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

  const handleSendEmail = () => {
    if (invoice) {
      openEmailClient(invoice)
    }
  }

  const handleEdit = () => {
    if (invoice) {
      router.push(`/invoices?edit=${invoice.id}`)
    }
  }

  // DODAJTE FUNKCIJO ZA SAVE AS
  const handleSaveAs = () => {
    if (invoice) {
      router.push(`/invoices?edit=${invoice.id}&saveAs=true`)
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
                        </div>
                      </div>
                      <div className="flex gap-2">
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
