"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { QuotePreview } from "@/components/quote-preview"
import { ArrowLeft, Edit, Copy, CheckCircle, XCircle } from "lucide-react"
import { fetchQuoteById, type SavedQuote, updateQuoteStatus } from "@/lib/database"
import { downloadQuotePDF } from "@/lib/pdf-generator"
import { openEmailClient } from "@/lib/email-service"

export default function QuoteViewPage() {
  const params = useParams()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [quote, setQuote] = useState<SavedQuote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadQuote(params.id as string)
    }
  }, [params.id])

  const loadQuote = async (id: string) => {
    try {
      setLoading(true)
      const data = await fetchQuoteById(id)
      setQuote(data)
    } catch (error) {
      console.error("Error loading quote:", error)
      alert("Napaka pri nalaganju ponudbe")
      router.push("/quotes/list")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (quote) {
      downloadQuotePDF(quote)
    }
  }

  const handleSendEmail = async () => {
    if (quote) {
      try {
        await openEmailClient(quote, 'quote')
        // Osvežimo podatke, da vidimo spremembo statusa
        await loadQuote(quote.id!)
      } catch (error) {
        console.error("Error sending email:", error)
        alert("Napaka pri pošiljanju e-pošte")
      }
    }
  }

  const handleEdit = () => {
    if (quote) {
      router.push(`/quotes?edit=${quote.id}`)
    }
  }

  const handleSaveAs = () => {
    if (quote) {
      router.push(`/quotes?edit=${quote.id}&saveAs=true`)
    }
  }

  const handleMarkAsAccepted = async () => {
    if (quote) {
      if (confirm(`Ali ste prepričani, da želite označiti ponudbo ${quote.quoteNumber} kot sprejeto?`)) {
        try {
          await updateQuoteStatus(quote.id!, 'accepted')
          // Osvežimo podatke
          await loadQuote(quote.id!)
        } catch (error) {
          console.error("Error marking quote as accepted:", error)
          alert("Napaka pri označevanju ponudbe kot sprejete")
        }
      }
    }
  }

  const handleMarkAsRejected = async () => {
    if (quote) {
      if (confirm(`Ali ste prepričani, da želite označiti ponudbo ${quote.quoteNumber} kot zavrnjeno?`)) {
        try {
          await updateQuoteStatus(quote.id!, 'rejected')
          loadQuote(quote.id!)
        } catch (error) {
          console.error("Error marking quote as rejected:", error)
          alert("Napaka pri označevanju ponudbe kot zavrnjene")
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
                  <div className="text-center py-8">Nalagam ponudbo...</div>
                ) : quote ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => router.push("/quotes/list")}
                          className="gap-2 bg-transparent"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Nazaj na seznam
                        </Button>
                        <div>
                          <h1 className="text-2xl font-semibold text-foreground">
                            Ponudba {quote.quoteNumber}
                          </h1>
                          <p className="text-sm text-muted-foreground">
                            {quote.customer.Stranka}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              quote.status === 'accepted' 
                                ? 'bg-green-100 text-green-800'
                                : quote.status === 'sent'
                                ? 'bg-blue-100 text-blue-800'
                                : quote.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : quote.status === 'expired'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {quote.status === 'accepted' ? 'Sprejeta' : 
                               quote.status === 'sent' ? 'Poslana' : 
                               quote.status === 'rejected' ? 'Zavrnjena' :
                               quote.status === 'expired' ? 'Potekla' : 'Osnutek'}
                            </span>
                            {quote.status === 'accepted' && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {quote.status !== 'accepted' && quote.status !== 'rejected' && (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={handleMarkAsAccepted} 
                              className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Označi kot sprejeto
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={handleMarkAsRejected} 
                              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                              Označi kot zavrnjeno
                            </Button>
                          </>
                        )}
                        <Button variant="outline" onClick={handleSaveAs} className="gap-2">
                          <Copy className="h-4 w-4" />
                          Shrani kot novo
                        </Button>
                        <Button variant="outline" onClick={handleEdit} className="gap-2">
                          <Edit className="h-4 w-4" />
                          Uredi ponudbo
                        </Button>
                      </div>
                    </div>

                    <QuotePreview
                      quote={quote}
                      onDownload={handleDownloadPDF}
                      onSendEmail={handleSendEmail}
                    />
                  </>
                ) : (
                  <div className="text-center py-8">Ponudba ni bila najdena</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
