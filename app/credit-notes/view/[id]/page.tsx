"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { CreditNotePreview } from "@/components/credit-note-preview"
import { ArrowLeft, Edit, Copy, CheckCircle, XCircle } from "lucide-react"
import { fetchCreditNoteById, type SavedCreditNote, updateCreditNoteStatus } from "@/lib/database"
import { downloadCreditNotePDF } from "@/lib/pdf-generator"
import { openEmailClient } from "@/lib/email-service"

export default function CreditNoteViewPage() {
  const params = useParams()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [creditNote, setCreditNote] = useState<SavedCreditNote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadCreditNote(params.id as string)
    }
  }, [params.id])

  const loadCreditNote = async (id: string) => {
    try {
      setLoading(true)
      const data = await fetchCreditNoteById(id)
      setCreditNote(data)
    } catch (error) {
      console.error("Error loading credit note:", error)
      alert("Napaka pri nalaganju dobropisa")
      router.push("/credit-notes/list")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (creditNote) {
      downloadCreditNotePDF(creditNote)
    }
  }

  const handleSendEmail = async () => {
    if (creditNote) {
      try {
        await openEmailClient(creditNote, 'credit-note')
        // Osvežimo podatke, da vidimo spremembo statusa
        await loadCreditNote(creditNote.id!)
      } catch (error) {
        console.error("Error sending email:", error)
        alert("Napaka pri pošiljanju e-pošte")
      }
    }
  }

  const handleEdit = () => {
    if (creditNote) {
      router.push(`/credit-notes?edit=${creditNote.id}`)
    }
  }

  const handleSaveAs = () => {
    if (creditNote) {
      router.push(`/credit-notes?edit=${creditNote.id}&saveAs=true`)
    }
  }

  const handleMarkAsProcessed = async () => {
    if (creditNote) {
      if (confirm(`Ali ste prepričani, da želite označiti dobropis ${creditNote.creditNoteNumber} kot obdelan?`)) {
        try {
          await updateCreditNoteStatus(creditNote.id!, 'processed')
          // Osvežimo podatke
          await loadCreditNote(creditNote.id!)
        } catch (error) {
          console.error("Error marking credit note as processed:", error)
          alert("Napaka pri označevanju dobropisa kot obdelan")
        }
      }
    }
  }

  const handleMarkAsUnprocessed = async () => {
    if (creditNote) {
      if (confirm(`Ali ste prepričani, da želite označiti dobropis ${creditNote.creditNoteNumber} kot neobdelan?`)) {
        try {
          await updateCreditNoteStatus(creditNote.id!, 'sent')
          loadCreditNote(creditNote.id!)
        } catch (error) {
          console.error("Error marking credit note as unprocessed:", error)
          alert("Napaka pri označevanju dobropisa kot neobdelan")
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
                  <div className="text-center py-8">Nalagam dobropis...</div>
                ) : creditNote ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => router.push("/credit-notes/list")}
                          className="gap-2 bg-transparent"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Nazaj na seznam
                        </Button>
                        <div>
                          <h1 className="text-2xl font-semibold text-foreground">
                            Dobropis {creditNote.creditNoteNumber}
                          </h1>
                          <p className="text-sm text-muted-foreground">
                            {creditNote.customer.Stranka}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              creditNote.status === 'processed' 
                                ? 'bg-green-100 text-green-800'
                                : creditNote.status === 'sent'
                                ? 'bg-blue-100 text-blue-800'
                                : creditNote.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {creditNote.status === 'processed' ? 'Obdelan' : 
                               creditNote.status === 'sent' ? 'Poslan' : 
                               creditNote.status === 'cancelled' ? 'Preklican' : 'Osnutek'}
                            </span>
                            {creditNote.status === 'processed' && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {creditNote.status !== 'processed' && (
                          <Button 
                            variant="outline" 
                            onClick={handleMarkAsProcessed} 
                            className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Označi kot obdelan
                          </Button>
                        )}
                        {creditNote.status === 'processed' && (
                          <Button 
                            variant="outline" 
                            onClick={handleMarkAsUnprocessed} 
                            className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <XCircle className="h-4 w-4" />
                            Označi kot neobdelan
                          </Button>
                        )}
                        <Button variant="outline" onClick={handleSaveAs} className="gap-2">
                          <Copy className="h-4 w-4" />
                          Shrani kot nov
                        </Button>
                        <Button variant="outline" onClick={handleEdit} className="gap-2">
                          <Edit className="h-4 w-4" />
                          Uredi dobropis
                        </Button>
                      </div>
                    </div>

                    <CreditNotePreview
                      creditNote={creditNote}
                      onDownload={handleDownloadPDF}
                      onSendEmail={handleSendEmail}
                    />
                  </>
                ) : (
                  <div className="text-center py-8">Dobropis ni bil najden</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
