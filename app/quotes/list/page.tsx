"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  FileStack, 
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
  Square
} from "lucide-react"
import { fetchQuotes, deleteQuote, updateQuoteStatus, type SavedQuote } from "@/lib/database"
import { generateQuotePDFFromElement } from "@/lib/pdf-generator"
import { openEmailClient } from "@/lib/email-service"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { QuotePreview } from "@/components/quote-preview"

export default function QuotesListPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [quotes, setQuotes] = useState<SavedQuote[]>([])
  const [filteredQuotes, setFilteredQuotes] = useState<SavedQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [pdfQuote, setPdfQuote] = useState<SavedQuote | null>(null)
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([])
  const [isBulkDownloading, setIsBulkDownloading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadQuotes()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredQuotes(quotes)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = quotes.filter(
        (quote) =>
          quote.quoteNumber.toLowerCase().includes(query) ||
          quote.customer.Stranka?.toLowerCase().includes(query) ||
          quote.status.toLowerCase().includes(query)
      )
      setFilteredQuotes(filtered)
    }
  }, [searchQuery, quotes])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      const data = await fetchQuotes()
      setQuotes(data)
      setFilteredQuotes(data)
    } catch (error) {
      console.error("Error loading quotes:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleQuoteSelection = (quoteId: string) => {
    setSelectedQuotes(prev =>
      prev.includes(quoteId)
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedQuotes.length === filteredQuotes.length) {
      setSelectedQuotes([])
    } else {
      setSelectedQuotes(filteredQuotes.map(quote => quote.id!))
    }
  }

  const handleBulkDownload = async () => {
    if (selectedQuotes.length === 0) return

    setIsBulkDownloading(true)
    const selectedQuoteData = quotes.filter(quote => selectedQuotes.includes(quote.id!))

    try {
      for (const quote of selectedQuoteData) {
        await new Promise<void>(async (resolve) => {
          setPdfQuote(quote)
          
          setTimeout(async () => {
            try {
              const element = document.getElementById('quote-preview-content')
              if (!element) {
                console.error('Element not found for quote:', quote.quoteNumber)
                resolve()
                return
              }

              const pdfBlob = await generateQuotePDFFromElement(element, quote)
              const url = URL.createObjectURL(pdfBlob)
              const a = document.createElement("a")
              a.href = url
              a.download = `ponudba-${quote.quoteNumber.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              
              setTimeout(() => {
                URL.revokeObjectURL(url)
                resolve()
              }, 100)
            } catch (error) {
              console.error(`Napaka pri prenosu ponudbe ${quote.quoteNumber}:`, error)
              resolve()
            } finally {
              setPdfQuote(null)
            }
          }, 1000)
        })
      }
      
      setSelectedQuotes([])
    } catch (error) {
      console.error('Napaka pri množičnem prenosu:', error)
      alert('Napaka pri prenosu ponudb')
    } finally {
      setIsBulkDownloading(false)
    }
  }

  const handleDownload = async (quote: SavedQuote) => {
    setPdfQuote(quote)
    
    setTimeout(async () => {
      try {
        const element = document.getElementById('quote-preview-content')
        if (!element) {
          throw new Error('Preview element not found')
        }

        const pdfBlob = await generateQuotePDFFromElement(element, quote)
        const url = URL.createObjectURL(pdfBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = `ponudba-${quote.quoteNumber.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Napaka pri prenosu PDF-ja:', error)
        alert('Napaka pri prenosu PDF-ja')
      } finally {
        setPdfQuote(null)
      }
    }, 1000)
  }

  const handleDelete = async (id: string, quoteNumber: string) => {
    if (confirm(`Ali ste prepričani, da želite izbrisati ponudbo ${quoteNumber}?`)) {
      try {
        await deleteQuote(id)
        await loadQuotes()
        setSelectedQuotes(prev => prev.filter(quoteId => quoteId !== id))
      } catch (error) {
        console.error("Error deleting quote:", error)
        alert("Napaka pri brisanju ponudbe")
      }
    }
  }

  const handleEmail = async (quote: SavedQuote) => {
    try {
      if (quote.status === 'draft') {
        await updateQuoteStatus(quote.id!, 'sent')
        await loadQuotes()
      }
      
      openEmailClient(quote, 'quote')
    } catch (error) {
      console.error("Error sending email:", error)
      alert("Napaka pri pošiljanju e-pošte")
    }
  }

  const handleMarkAsAccepted = async (quoteId: string, quoteNumber: string) => {
    if (confirm(`Ali ste prepričani, da želite označiti ponudbo ${quoteNumber} kot sprejeto?`)) {
      try {
        await updateQuoteStatus(quoteId, 'accepted')
        await loadQuotes()
      } catch (error) {
        console.error("Error marking quote as accepted:", error)
        alert("Napaka pri označevanju ponudbe")
      }
    }
  }

  const handleEdit = (quoteId: string) => {
    router.push(`/quotes?edit=${quoteId}`)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      expired: "bg-orange-100 text-orange-800",
    }
    
    const labels = {
      draft: "Osnutek",
      sent: "Poslana",
      accepted: "Sprejeta",
      rejected: "Zavrnjena",
      expired: "Potekla",
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
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
                    <h1 className="text-2xl font-semibold text-foreground">Shranjene ponudbe</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pregled in upravljanje vseh ponudb
                    </p>
                  </div>
                  <Link href="/quotes">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nova ponudba
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Vse ponudbe</p>
                          <p className="text-2xl font-semibold">{quotes.length}</p>
                        </div>
                        <FileStack className="h-8 w-8 text-primary opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Osnutki</p>
                          <p className="text-2xl font-semibold">
                            {quotes.filter(q => q.status === 'draft').length}
                          </p>
                        </div>
                        <Circle className="h-8 w-8 text-gray-500 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Sprejete</p>
                          <p className="text-2xl font-semibold">
                            {quotes.filter(q => q.status === 'accepted').length}
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
                          <p className="text-2xl font-semibold">{selectedQuotes.length}</p>
                        </div>
                        <CheckSquare className="h-8 w-8 text-blue-500 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Search and Bulk Actions */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Išči po številki ponudbe, stranki ali statusu..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {selectedQuotes.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-muted-foreground">
                            Izbranih: <strong>{selectedQuotes.length}</strong>
                          </div>
                          <Button 
                            onClick={handleBulkDownload} 
                            disabled={isBulkDownloading}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            {isBulkDownloading ? "Prenašam..." : `Prenesi ${selectedQuotes.length} ponudb`}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedQuotes([])}
                            className="gap-2"
                          >
                            Počisti izbiro
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Quotes List */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Ponudbe ({filteredQuotes.length})</CardTitle>
                      {filteredQuotes.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleSelectAll}
                          className="flex items-center gap-2"
                        >
                          {selectedQuotes.length === filteredQuotes.length ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 border-2 border-muted-foreground rounded" />
                          )}
                          {selectedQuotes.length === filteredQuotes.length ? "Počisti vse" : "Izberi vse"}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">Nalagam ponudbe...</div>
                    ) : filteredQuotes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "Ni rezultatov iskanja" : "Še nimate shranjenih ponudb"}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredQuotes.map((quote) => (
                          <div
                            key={quote.id}
                            className={`border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors ${
                              selectedQuotes.includes(quote.id!) ? 'ring-2 ring-primary ring-opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <button
                                onClick={() => toggleQuoteSelection(quote.id!)}
                                className="mt-1 flex-shrink-0"
                              >
                                {selectedQuotes.includes(quote.id!) ? (
                                  <CheckSquare className="h-5 w-5 text-primary" />
                                ) : (
                                  <Square className="h-5 w-5 text-muted-foreground opacity-60" />
                                )}
                              </button>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">
                                    Ponudba {quote.quoteNumber}
                                  </h3>
                                  {getStatusBadge(quote.status)}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                  <div>
                                    <strong>Stranka:</strong> {quote.customer.Stranka}
                                  </div>
                                  <div>
                                    <strong>Datum izdaje:</strong>{" "}
                                    {new Date(quote.issueDate).toLocaleDateString("sl-SI")}
                                  </div>
                                  <div>
                                    <strong>Znesek:</strong> {quote.totalPayable.toFixed(2)} EUR
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/quotes/view/${quote.id}`)}
                                  className="gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  Poglej
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(quote.id!)}
                                  className="gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  Uredi
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(quote)}
                                  className="gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  PDF
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEmail(quote)}
                                  className="gap-2"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                                
                                {quote.status !== 'accepted' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsAccepted(quote.id!, quote.quoteNumber)}
                                    className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(quote.id!, quote.quoteNumber)}
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

      {/* Hidden preview for PDF generation */}
      {pdfQuote && (
        <div style={{ position: 'fixed', left: '-10000px', top: '0', width: '210mm', backgroundColor: 'white' }}>
          <QuotePreview
            quote={pdfQuote}
            onDownload={() => {}}
            onSendEmail={() => {}}
          />
        </div>
      )}
    </div>
  )
}
