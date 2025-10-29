// app/offers/list/page.tsx
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
  TrendingUp
} from "lucide-react"
import { fetchOffers, deleteOffer, updateOfferStatus, type SavedOffer } from "@/lib/database"
import { generateOfferPDFFromElement } from "@/lib/pdf-generator"
import { openEmailClient } from "@/lib/email-service"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { OfferPreview } from "@/components/offer-preview"

export default function OffersListPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [offers, setOffers] = useState<SavedOffer[]>([])
  const [filteredOffers, setFilteredOffers] = useState<SavedOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [pdfOffer, setPdfOffer] = useState<SavedOffer | null>(null)
  const [selectedOffers, setSelectedOffers] = useState<string[]>([])
  const [isBulkDownloading, setIsBulkDownloading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadOffers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOffers(offers)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = offers.filter(
        (offer) =>
          offer.offerNumber.toLowerCase().includes(query) ||
          offer.customer.Stranka?.toLowerCase().includes(query) ||
          offer.status.toLowerCase().includes(query)
      )
      setFilteredOffers(filtered)
    }
  }, [searchQuery, offers])

  const loadOffers = async () => {
    try {
      setLoading(true)
      const data = await fetchOffers()
      setOffers(data)
      setFilteredOffers(data)
    } catch (error) {
      console.error("Error loading offers:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleOfferSelection = (offerId: string) => {
    setSelectedOffers(prev =>
      prev.includes(offerId)
        ? prev.filter(id => id !== offerId)
        : [...prev, offerId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedOffers.length === filteredOffers.length) {
      setSelectedOffers([])
    } else {
      setSelectedOffers(filteredOffers.map(offer => offer.id!))
    }
  }

  const isOfferSelected = (offerId: string) => {
    return selectedOffers.includes(offerId)
  }

  const isAllSelected = () => {
    return filteredOffers.length > 0 && selectedOffers.length === filteredOffers.length
  }

  const isSomeSelected = () => {
    return selectedOffers.length > 0 && selectedOffers.length < filteredOffers.length
  }

  const handleBulkDownload = async () => {
    if (selectedOffers.length === 0) return

    setIsBulkDownloading(true)
    const selectedOfferData = offers.filter(offer => selectedOffers.includes(offer.id!))

    try {
      for (const offer of selectedOfferData) {
        await new Promise<void>(async (resolve) => {
          setPdfOffer(offer)
          
          setTimeout(async () => {
            try {
              const element = document.getElementById('offer-preview-content')
              if (!element) {
                console.error('Element not found for offer:', offer.offerNumber)
                resolve()
                return
              }

              const pdfBlob = await generateOfferPDFFromElement(element, offer)
              const url = URL.createObjectURL(pdfBlob)
              const a = document.createElement("a")
              a.href = url
              a.download = `ponudba-${offer.offerNumber.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              
              setTimeout(() => {
                URL.revokeObjectURL(url)
                resolve()
              }, 100)
            } catch (error) {
              console.error(`Napaka pri prenosu ponudbe ${offer.offerNumber}:`, error)
              resolve()
            } finally {
              setPdfOffer(null)
            }
          }, 1000)
        })
      }
      
      setSelectedOffers([])
    } catch (error) {
      console.error('Napaka pri množičnem prenosu:', error)
      alert('Napaka pri prenosu ponudb')
    } finally {
      setIsBulkDownloading(false)
    }
  }

  const handleDownload = async (offer: SavedOffer) => {
    setPdfOffer(offer)
    
    setTimeout(async () => {
      try {
        const element = document.getElementById('offer-preview-content')
        if (!element) {
          console.error('Element not found!')
          throw new Error('Preview element not found')
        }

        const pdfBlob = await generateOfferPDFFromElement(element, offer)
        const url = URL.createObjectURL(pdfBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = `ponudba-${offer.offerNumber.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Napaka pri prenosu PDF-ja:', error)
        alert('Napaka pri prenosu PDF-ja: ' + (error as Error).message)
      } finally {
        setPdfOffer(null)
      }
    }, 1000)
  }

  const handleDelete = async (id: string, offerNumber: string) => {
    if (confirm(`Ali ste prepričani, da želite izbrisati ponudbo ${offerNumber}?`)) {
      try {
        await deleteOffer(id)
        await loadOffers()
        setSelectedOffers(prev => prev.filter(offerId => offerId !== id))
      } catch (error) {
        console.error("Error deleting offer:", error)
        alert("Napaka pri brisanju ponudbe")
      }
    }
  }

  const handleEmail = async (offer: SavedOffer) => {
    try {
      if (offer.status === 'draft') {
        await updateOfferStatus(offer.id!, 'sent')
        await loadOffers()
      }
      
      openEmailClient(offer, 'offer')
    } catch (error) {
      console.error("Error sending email:", error)
      alert("Napaka pri pošiljanju e-pošte")
    }
  }

  const handleMarkAsAccepted = async (offerId: string, offerNumber: string) => {
    if (confirm(`Ali ste prepričani, da želite označiti ponudbo ${offerNumber} kot sprejeto?`)) {
      try {
        await updateOfferStatus(offerId, 'accepted')
        await loadOffers()
      } catch (error) {
        console.error("Error marking offer as accepted:", error)
        alert("Napaka pri označevanju ponudbe kot sprejete")
      }
    }
  }

  const handleMarkAsRejected = async (offerId: string, offerNumber: string) => {
    if (confirm(`Ali ste prepričani, da želite označiti ponudbo ${offerNumber} kot zavrnjeno?`)) {
      try {
        await updateOfferStatus(offerId, 'rejected')
        await loadOffers()
      } catch (error) {
        console.error("Error marking offer as rejected:", error)
        alert("Napaka pri označevanju ponudbe kot zavrnjene")
      }
    }
  }

  const handleEdit = (offerId: string) => {
    router.push(`/offers?edit=${offerId}`)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }
    
    const labels = {
      draft: "Osnutek",
      sent: "Poslana",
      accepted: "Sprejeta",
      rejected: "Zavrnjena",
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getOfferCardClass = (status: string) => {
    const baseClass = "border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
    
    if (status === 'accepted') {
      return `${baseClass} bg-green-50 border-green-200`
    } else if (status === 'sent') {
      return `${baseClass} bg-blue-50 border-blue-200`
    } else if (status === 'rejected') {
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
                    <h1 className="text-2xl font-semibold text-foreground">Shranjene ponudbe</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pregled in upravljanje vseh izdanih ponudb
                    </p>
                  </div>
                  <Link href="/offers">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nova ponudba
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Vse ponudbe</p>
                          <p className="text-2xl font-semibold">{offers.length}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-primary opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Osnutki</p>
                          <p className="text-2xl font-semibold">
                            {offers.filter(i => i.status === 'draft').length}
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
                          <p className="text-sm text-muted-foreground">Sprejete</p>
                          <p className="text-2xl font-semibold">
                            {offers.filter(i => i.status === 'accepted').length}
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
                          <p className="text-2xl font-semibold">{selectedOffers.length}</p>
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
                          placeholder="Išči po številki ponudbe, stranki ali statusu..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {selectedOffers.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-muted-foreground">
                            Izbranih: <strong>{selectedOffers.length}</strong>
                          </div>
                          <Button 
                            onClick={handleBulkDownload} 
                            disabled={isBulkDownloading}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            {isBulkDownloading ? "Prenašam..." : `Prenesi ${selectedOffers.length} ponudb`}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedOffers([])}
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
                      <CardTitle>Ponudbe ({filteredOffers.length})</CardTitle>
                      {filteredOffers.length > 0 && (
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
                      <div className="text-center py-8">Nalagam ponudbe...</div>
                    ) : filteredOffers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "Ni rezultatov iskanja" : "Še nimate shranjenih ponudb"}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredOffers.map((offer) => (
                          <div
                            key={offer.id}
                            className={`${getOfferCardClass(offer.status)} ${
                              isOfferSelected(offer.id!) ? 'ring-2 ring-primary ring-opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <button
                                onClick={() => toggleOfferSelection(offer.id!)}
                                className="mt-1 flex-shrink-0"
                              >
                                {isOfferSelected(offer.id!) ? (
                                  <CheckSquare className="h-5 w-5 text-primary" />
                                ) : (
                                  <Square className="h-5 w-5 text-muted-foreground opacity-60" />
                                )}
                              </button>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg flex items-center gap-2">
                                    {offer.status === 'accepted' && (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    )}
                                    {offer.status === 'sent' && (
                                      <Mail className="h-5 w-5 text-blue-600" />
                                    )}
                                    {offer.status === 'draft' && (
                                      <Circle className="h-5 w-5 text-gray-400" />
                                    )}
                                    {offer.status === 'rejected' && (
                                      <XCircle className="h-5 w-5 text-red-600" />
                                    )}
                                    Ponudba {offer.offerNumber}
                                  </h3>
                                  {getStatusBadge(offer.status)}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                  <div>
                                    <strong>Stranka:</strong> {offer.customer.Stranka}
                                  </div>
                                  <div>
                                    <strong>Datum izdaje:</strong>{" "}
                                    {new Date(offer.issueDate).toLocaleDateString("sl-SI")}
                                  </div>
                                  <div>
                                    <strong>Znesek:</strong> {offer.totalPayable.toFixed(2)} EUR
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  Ustvarjeno: {new Date(offer.createdAt).toLocaleString("sl-SI")}
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/offers/view/${offer.id}`)}
                                  className="gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  Poglej
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(offer.id!)}
                                  className="gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  Uredi
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(offer)}
                                  className="gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  PDF
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEmail(offer)}
                                  className="gap-2"
                                  title={offer.status === 'draft' ? "Pošlji e-pošto in označi kot poslano" : "Pošlji e-pošto"}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                                
                                {offer.status !== 'accepted' && offer.status !== 'rejected' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleMarkAsAccepted(offer.id!, offer.offerNumber)}
                                      className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      title="Označi kot sprejeto"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleMarkAsRejected(offer.id!, offer.offerNumber)}
                                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Označi kot zavrnjeno"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(offer.id!, offer.offerNumber)}
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

      {pdfOffer && (
        <div style={{ position: 'fixed', left: '-10000px', top: '0', width: '210mm', backgroundColor: 'white' }}>
          <OfferPreview
            offer={pdfOffer}
            onDownload={() => {}}
            onSendEmail={() => {}}
          />
        </div>
      )}
    </div>
  )
}
