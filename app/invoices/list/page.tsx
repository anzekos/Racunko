"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  Download, 
  Mail, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  Plus,
  CheckCircle,
  Circle,
  XCircle
} from "lucide-react"
import { fetchInvoices, deleteInvoice, updateInvoiceStatus, type SavedInvoice } from "@/lib/database"
import { generateInvoicePDFFromElement } from "@/lib/pdf-generator"
import { openEmailClient } from "@/lib/email-service"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { InvoicePreview } from "@/components/invoice-preview"

export default function InvoicesListPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [invoices, setInvoices] = useState<SavedInvoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<SavedInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [pdfInvoice, setPdfInvoice] = useState<SavedInvoice | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadInvoices()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredInvoices(invoices)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = invoices.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(query) ||
          invoice.customer.Stranka?.toLowerCase().includes(query) ||
          invoice.status.toLowerCase().includes(query)
      )
      setFilteredInvoices(filtered)
    }
  }, [searchQuery, invoices])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const data = await fetchInvoices()
      setInvoices(data)
      setFilteredInvoices(data)
    } catch (error) {
      console.error("Error loading invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (confirm(`Ali ste prepričani, da želite izbrisati račun ${invoiceNumber}?`)) {
      try {
        await deleteInvoice(id)
        await loadInvoices()
      } catch (error) {
        console.error("Error deleting invoice:", error)
        alert("Napaka pri brisanju računa")
      }
    }
  }

  const handleDownload = async (invoice: SavedInvoice) => {
    setPdfInvoice(invoice)
    
    // Počakamo, da se komponenta naloži v DOM
    setTimeout(async () => {
      try {
        const element = document.getElementById('invoice-preview-content')
        if (!element) {
          console.error('Element not found!')
          throw new Error('Preview element not found')
        }

        console.log('Element found:', element)
        console.log('Element dimensions:', element.offsetWidth, element.offsetHeight)

        const pdfBlob = await generateInvoicePDFFromElement(element, invoice)
        const url = URL.createObjectURL(pdfBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = `racun-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Napaka pri prenosu PDF-ja:', error)
        alert('Napaka pri prenosu PDF-ja: ' + (error as Error).message)
      } finally {
        setPdfInvoice(null)
      }
    }, 1000)
  }

  const handleEmail = async (invoice: SavedInvoice) => {
    try {
      if (invoice.status === 'draft') {
        await updateInvoiceStatus(invoice.id!, 'sent')
        await loadInvoices()
      }
      
      openEmailClient(invoice)
    } catch (error) {
      console.error("Error sending email:", error)
      alert("Napaka pri pošiljanju e-pošte")
    }
  }

  const handleMarkAsPaid = async (invoiceId: string, invoiceNumber: string) => {
    if (confirm(`Ali ste prepričani, da želite označiti račun ${invoiceNumber} kot plačan?`)) {
      try {
        await updateInvoiceStatus(invoiceId, 'paid')
        await loadInvoices()
      } catch (error) {
        console.error("Error marking invoice as paid:", error)
        alert("Napaka pri označevanju računa kot plačan")
      }
    }
  }

  const handleMarkAsUnpaid = async (invoiceId: string, invoiceNumber: string) => {
    if (confirm(`Ali ste prepričani, da želite označiti račun ${invoiceNumber} kot neplačan?`)) {
      try {
        await updateInvoiceStatus(invoiceId, 'sent')
        await loadInvoices()
      } catch (error) {
        console.error("Error marking invoice as unpaid:", error)
        alert("Napaka pri označevanju računa kot neplačan")
      }
    }
  }

  const handleEdit = (invoiceId: string) => {
    router.push(`/invoices?edit=${invoiceId}`)
  }

  const handleSaveAs = (invoiceId: string) => {
    router.push(`/invoices?edit=${invoiceId}&saveAs=true`)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    
    const labels = {
      draft: "Osnutek",
      sent: "Poslan",
      paid: "Plačan",
      cancelled: "Preklican",
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getInvoiceCardClass = (status: string) => {
    const baseClass = "border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
    
    if (status === 'paid') {
      return `${baseClass} bg-green-50 border-green-200`
    } else if (status === 'sent') {
      return `${baseClass} bg-blue-50 border-blue-200`
    }
    
    return baseClass
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <Header />

        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">Shranjeni računi</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pregled in upravljanje vseh izdanih računov
                    </p>
                  </div>
                  <Link href="/invoices">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nov račun
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Vsi računi</p>
                          <p className="text-2xl font-semibold">{invoices.length}</p>
                        </div>
                        <FileText className="h-8 w-8 text-primary opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Osnutki</p>
                          <p className="text-2xl font-semibold">
                            {invoices.filter(i => i.status === 'draft').length}
                          </p>
                        </div>
                        <FileText className="h-8 w-8 text-gray-500 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Plačani</p>
                          <p className="text-2xl font-semibold">
                            {invoices.filter(i => i.status === 'paid').length}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Search */}
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Išči po številki računa, stranki ali statusu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Invoices List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Računi ({filteredInvoices.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">Nalagam račune...</div>
                    ) : filteredInvoices.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "Ni rezultatov iskanja" : "Še nimate shranjenih računov"}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredInvoices.map((invoice) => (
                          <div
                            key={invoice.id}
                            className={getInvoiceCardClass(invoice.status)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg flex items-center gap-2">
                                    {invoice.status === 'paid' && (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    )}
                                    {invoice.status === 'sent' && (
                                      <Mail className="h-5 w-5 text-blue-600" />
                                    )}
                                    {invoice.status === 'draft' && (
                                      <Circle className="h-5 w-5 text-gray-400" />
                                    )}
                                    Račun {invoice.invoiceNumber}
                                  </h3>
                                  {getStatusBadge(invoice.status)}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                  <div>
                                    <strong>Stranka:</strong> {invoice.customer.Stranka}
                                  </div>
                                  <div>
                                    <strong>Datum izdaje:</strong>{" "}
                                    {new Date(invoice.issueDate).toLocaleDateString("sl-SI")}
                                  </div>
                                  <div>
                                    <strong>Znesek:</strong> {invoice.totalPayable.toFixed(2)} EUR
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  Ustvarjeno: {new Date(invoice.createdAt).toLocaleString("sl-SI")}
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/invoices/view/${invoice.id}`)}
                                  className="gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  Poglej
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(invoice.id!)}
                                  className="gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  Uredi
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(invoice)}
                                  className="gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  PDF
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEmail(invoice)}
                                  className="gap-2"
                                  title={invoice.status === 'draft' ? "Pošlji e-pošto in označi kot poslan" : "Pošlji e-pošto"}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                                
                                {invoice.status !== 'paid' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsPaid(invoice.id!, invoice.invoiceNumber)}
                                    className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title="Označi kot plačan"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsUnpaid(invoice.id!, invoice.invoiceNumber)}
                                    className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    title="Označi kot neplačan"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(invoice.id!, invoice.invoiceNumber)}
                                  className="gap-2 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Skrita InvoicePreview komponenta za generiranje PDF-jev */}
      {pdfInvoice && (
        <div style={{ position: 'fixed', left: '-10000px', top: '0', width: '210mm', backgroundColor: 'white' }}>
          <InvoicePreview
            invoice={pdfInvoice}
            onDownload={() => {}}
            onSendEmail={() => {}}
          />
        </div>
      )}
    </div>
  )
}
