// app/credit-notes/list/page.tsx
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
  XCircle,
  CheckSquare,
  Square,
  Receipt
} from "lucide-react"
import { fetchCreditNotes, deleteCreditNote, updateCreditNoteStatus, type SavedCreditNote } from "@/lib/database"
import { downloadCreditNotePDFFromPreview, generateCreditNotePDFFromElement } from "@/lib/pdf-generator-credit-note"
import { openEmailClient, sendCreditNoteEmail } from "@/lib/email-service-credit-note"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CreditNotePreview } from "@/components/credit-note-preview"

export default function CreditNotesListPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [creditNotes, setCreditNotes] = useState<SavedCreditNote[]>([])
  const [filteredCreditNotes, setFilteredCreditNotes] = useState<SavedCreditNote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [pdfCreditNote, setPdfCreditNote] = useState<SavedCreditNote | null>(null)
  const [selectedCreditNotes, setSelectedCreditNotes] = useState<string[]>([])
  const [isBulkDownloading, setIsBulkDownloading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadCreditNotes()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCreditNotes(creditNotes)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = creditNotes.filter(
        (creditNote) =>
          creditNote.creditNoteNumber.toLowerCase().includes(query) ||
          creditNote.customer.Stranka?.toLowerCase().includes(query) ||
          creditNote.status.toLowerCase().includes(query)
      )
      setFilteredCreditNotes(filtered)
    }
  }, [searchQuery, creditNotes])

  const loadCreditNotes = async () => {
    try {
      setLoading(true)
      const data = await fetchCreditNotes()
      setCreditNotes(data)
      setFilteredCreditNotes(data)
    } catch (error) {
      console.error("Error loading credit notes:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCreditNoteSelection = (creditNoteId: string) => {
    setSelectedCreditNotes(prev =>
      prev.includes(creditNoteId)
        ? prev.filter(id => id !== creditNoteId)
        : [...prev, creditNoteId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedCreditNotes.length === filteredCreditNotes.length) {
      setSelectedCreditNotes([])
    } else {
      setSelectedCreditNotes(filteredCreditNotes.map(creditNote => creditNote.id!))
    }
  }

  const isCreditNoteSelected = (creditNoteId: string) => {
    return selectedCreditNotes.includes(creditNoteId)
  }

  const isAllSelected = () => {
    return filteredCreditNotes.length > 0 && selectedCreditNotes.length === filteredCreditNotes.length
  }

  const isSomeSelected = () => {
    return selectedCreditNotes.length > 0 && selectedCreditNotes.length < filteredCreditNotes.length
  }

  const handleBulkDownload = async () => {
    if (selectedCreditNotes.length === 0) return

    setIsBulkDownloading(true)
    const selectedCreditNoteData = creditNotes.filter(creditNote => selectedCreditNotes.includes(creditNote.id!))

    try {
      for (const creditNote of selectedCreditNoteData) {
        await new Promise<void>(async (resolve) => {
          setPdfCreditNote(creditNote)
          
          setTimeout(async () => {
            try {
              const element = document.getElementById('credit-note-preview-content')
              if (!element) {
                console.error('Element not found for credit note:', creditNote.creditNoteNumber)
                resolve()
                return
              }

              const pdfBlob = await generateCreditNotePDFFromElement(element, creditNote)
              const url = URL.createObjectURL(pdfBlob)
              const a = document.createElement("a")
              a.href = url
              a.download = `dobropis-${creditNote.creditNoteNumber.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              
              setTimeout(() => {
                URL.revokeObjectURL(url)
                resolve()
              }, 100)
            } catch (error) {
              console.error(`Napaka pri prenosu dobropisa ${creditNote.creditNoteNumber}:`, error)
              resolve()
            } finally {
              setPdfCreditNote(null)
            }
          }, 1000)
        })
      }
      
      setSelectedCreditNotes([])
    } catch (error) {
      console.error('Napaka pri množičnem prenosu:', error)
      alert('Napaka pri prenosu dobropisov')
    } finally {
      setIsBulkDownloading(false)
    }
  }

  const handleDownload = async (creditNote: SavedCreditNote) => {
    setPdfCreditNote(creditNote)
    
    setTimeout(async () => {
      try {
        const element = document.getElementById('credit-note-preview-content')
        if (!element) {
          console.error('Element not found!')
          throw new Error('Preview element not found')
        }

        const pdfBlob = await generateCreditNotePDFFromElement(element, creditNote)
        const url = URL.createObjectURL(pdfBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = `dobropis-${creditNote.creditNoteNumber.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Napaka pri prenosu PDF-ja:', error)
        alert('Napaka pri prenosu PDF-ja: ' + (error as Error).message)
      } finally {
        setPdfCreditNote(null)
      }
    }, 1000)
  }

  const handleDelete = async (id: string, creditNoteNumber: string) => {
    if (confirm(`Ali ste prepričani, da želite izbrisati dobropis ${creditNoteNumber}?`)) {
      try {
        await deleteCreditNote(id)
        await loadCreditNotes()
        setSelectedCreditNotes(prev => prev.filter(creditNoteId => creditNoteId !== id))
      } catch (error) {
        console.error("Error deleting credit note:", error)
        alert("Napaka pri brisanju dobropisa")
      }
    }
  }

  const handleEmail = async (creditNote: SavedCreditNote) => {
    try {
      if (creditNote.status === 'draft') {
        await updateCreditNoteStatus(creditNote.id!, 'sent')
        await loadCreditNotes()
      }
      
      openEmailClient(creditNote, 'credit-note')
    } catch (error) {
      console.error("Error sending email:", error)
      alert("Napaka pri pošiljanju e-pošte")
    }
  }

  const handleMarkAsPaid = async (creditNoteId: string, creditNoteNumber: string) => {
    if (confirm(`Ali ste prepričani, da želite označiti dobropis ${creditNoteNumber} kot plačan?`)) {
      try {
        await updateCreditNoteStatus(creditNoteId, 'paid')
        await loadCreditNotes()
      } catch (error) {
        console.error("Error marking credit note as paid:", error)
        alert("Napaka pri označevanju dobropisa kot plačan")
      }
    }
  }

  const handleMarkAsUnpaid = async (creditNoteId: string, creditNoteNumber: string) => {
    if (confirm(`Ali ste prepričani, da želite označiti dobropis ${creditNoteNumber} kot neplačan?`)) {
      try {
        await updateCreditNoteStatus(creditNoteId, 'sent')
        await loadCreditNotes()
      } catch (error) {
        console.error("Error marking credit note as unpaid:", error)
        alert("Napaka pri označevanju dobropisa kot neplačan")
      }
    }
  }

  const handleEdit = (creditNoteId: string) => {
    router.push(`/credit-notes?edit=${creditNoteId}`)
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

  const getCreditNoteCardClass = (status: string) => {
    const baseClass = "border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
    
    if (status === 'paid') {
      return `${baseClass} bg-green-50 border-green-200`
    } else if (status === 'sent') {
      return `${baseClass} bg-blue-50 border-blue-200`
    } else if (status === 'cancelled') {
      return `${baseClass} bg-red-50 border-red-200`
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
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">Shranjeni dobropisi</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pregled in upravljanje vseh izdanih dobropisov
                    </p>
                  </div>
                  <Link href="/credit-notes">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nov dobropis
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Vsi dobropisi</p>
                          <p className="text-2xl font-semibold">{creditNotes.length}</p>
                        </div>
                        <Receipt className="h-8 w-8 text-primary opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Osnutki</p>
                          <p className="text-2xl font-semibold">
                            {creditNotes.filter(i => i.status === 'draft').length}
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
                            {creditNotes.filter(i => i.status === 'paid').length}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Izbranih</p>
                          <p className="text-2xl font-semibold">{selectedCreditNotes.length}</p>
                        </div>
                        <CheckSquare className="h-8 w-8 text-blue-500 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Išči po številki dobropisa, stranki ali statusu..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {selectedCreditNotes.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-muted-foreground">
                            Izbranih: <strong>{selectedCreditNotes.length}</strong>
                          </div>
                          <Button 
                            onClick={handleBulkDownload} 
                            disabled={isBulkDownloading}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            {isBulkDownloading ? "Prenašam..." : `Prenesi ${selectedCreditNotes.length} dobropisov`}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedCreditNotes([])}
                            className="gap-2"
                          >
                            Počisti izbiro
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Dobropisi ({filteredCreditNotes.length})</CardTitle>
                      {filteredCreditNotes.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleSelectAll}
                            className="flex items-center gap-2"
                          >
                            {isAllSelected() ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : isSomeSelected() ? (
                              <Square className="h-4 w-4 border-2 border-muted-foreground rounded" />
                            ) : (
                              <Square className="h-4 w-4 border-2 border-muted-foreground rounded" />
                            )}
                            {isAllSelected() ? "Počisti vse" : "Izberi vse"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">Nalagam dobropise...</div>
                    ) : filteredCreditNotes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "Ni rezultatov iskanja" : "Še nimate shranjenih dobropisov"}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredCreditNotes.map((creditNote) => (
                          <div
                            key={creditNote.id}
                            className={`${getCreditNoteCardClass(creditNote.status)} ${
                              isCreditNoteSelected(creditNote.id!) ? 'ring-2 ring-primary ring-opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <button
                                onClick={() => toggleCreditNoteSelection(creditNote.id!)}
                                className="mt-1 flex-shrink-0"
                              >
                                {isCreditNoteSelected(creditNote.id!) ? (
                                  <CheckSquare className="h-5 w-5 text-primary" />
                                ) : (
                                  <Square className="h-5 w-5 text-muted-foreground opacity-60" />
                                )}
                              </button>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg flex items-center gap-2">
                                    {creditNote.status === 'paid' && (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    )}
                                    {creditNote.status === 'sent' && (
                                      <Mail className="h-5 w-5 text-blue-600" />
                                    )}
                                    {creditNote.status === 'draft' && (
                                      <Circle className="h-5 w-5 text-gray-400" />
                                    )}
                                    {creditNote.status === 'cancelled' && (
                                      <XCircle className="h-5 w-5 text-red-600" />
                                    )}
                                    Dobropis {creditNote.creditNoteNumber}
                                  </h3>
                                  {getStatusBadge(creditNote.status)}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                  <div>
                                    <strong>Stranka:</strong> {creditNote.customer.Stranka}
                                  </div>
                                  <div>
                                    <strong>Datum izdaje:</strong>{" "}
                                    {new Date(creditNote.issueDate).toLocaleDateString("sl-SI")}
                                  </div>
                                  <div>
                                    <strong>Znesek:</strong> {creditNote.totalPayable.toFixed(2)} EUR
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  Ustvarjeno: {new Date(creditNote.createdAt).toLocaleString("sl-SI")}
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/credit-notes/view/${creditNote.id}`)}
                                  className="gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  Poglej
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(creditNote.id!)}
                                  className="gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  Uredi
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(creditNote)}
                                  className="gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  PDF
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEmail(creditNote)}
                                  className="gap-2"
                                  title={creditNote.status === 'draft' ? "Pošlji e-pošto in označi kot poslan" : "Pošlji e-pošto"}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                                
                                {creditNote.status !== 'paid' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsPaid(creditNote.id!, creditNote.creditNoteNumber)}
                                    className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title="Označi kot plačan"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsUnpaid(creditNote.id!, creditNote.creditNoteNumber)}
                                    className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    title="Označi kot neplačan"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(creditNote.id!, creditNote.creditNoteNumber)}
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

      {pdfCreditNote && (
        <div style={{ position: 'fixed', left: '-10000px', top: '0', width: '210mm', backgroundColor: 'white' }}>
          <CreditNotePreview
            creditNote={pdfCreditNote}
            onDownload={() => {}}
            onSendEmail={() => {}}
          />
        </div>
      )}
    </div>
  )
}
