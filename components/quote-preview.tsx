// components/quote-preview.tsx
import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Mail, FileText } from "lucide-react"
import type { SavedQuote } from "@/lib/database"

interface QuotePreviewProps {
  quote: SavedQuote
  onDownload: () => void
  onSendEmail: () => void
}

export function QuotePreview({ quote, onDownload, onSendEmail }: QuotePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (previewRef.current) {
      // Inicializacija za print stil
      const element = previewRef.current
      element.classList.add('print-optimized')
    }
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sl-SI')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sl-SI', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Akcijski gumbi */}
      <Card className="p-4 print:hidden">
        <div className="flex flex-wrap gap-2">
          <Button onClick={onDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Prenesi PDF
          </Button>
          <Button variant="outline" onClick={onSendEmail} className="gap-2">
            <Mail className="h-4 w-4" />
            Pošlji po e-pošti
          </Button>
        </div>
      </Card>

      {/* Vsebina predogleda */}
      <div ref={previewRef} id="quote-preview-content">
        <Card className="p-8 print:p-0 print:shadow-none print:border-0">
          {/* Glava dokumenta */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#934435] mb-2">PONUDBA</h1>
              <p className="text-lg text-gray-600">Številka: {quote.quoteNumber}</p>
            </div>
            <div className="text-right">
              <div className="p-4 bg-[#f8ecec] rounded-lg inline-block">
                <FileText className="h-8 w-8 text-[#934435]" />
              </div>
            </div>
          </div>

          {/* Informacije o podjetju in stranki */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-[#934435] mb-2">Ponudnik:</h3>
              <p className="font-bold">2KM Consulting d.o.o.</p>
              <p>Športna ulica 22</p>
              <p>1000 Ljubljana</p>
              <p>DŠ: SI 10628169</p>
              <p>TRR: SI56 0223 6026 1489 640 (NLB)</p>
            </div>
            <div>
              <h3 className="font-semibold text-[#934435] mb-2">Stranka:</h3>
              <p className="font-bold">{quote.customer.Stranka}</p>
              <p>{quote.customer.Naslov}</p>
              <p>{quote.customer.Kraj_postna_st}</p>
              {quote.customer.email && <p>E-pošta: {quote.customer.email}</p>}
              {quote.customer.ID_DDV && <p>ID za DDV: {quote.customer.ID_DDV}</p>}
            </div>
          </div>

          {/* Datumi */}
          <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Datum izdaje:</p>
              <p className="font-semibold">{formatDate(quote.issueDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Veljavna do:</p>
              <p className="font-semibold">{formatDate(quote.validUntil)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Datum storitve:</p>
              <p className="font-semibold">{formatDate(quote.serviceDate)}</p>
            </div>
          </div>

          {/* Opis storitve */}
          {quote.serviceDescription && (
            <div className="mb-8">
              <h3 className="font-semibold text-[#934435] mb-2">Opis storitve:</h3>
              <p className="text-gray-700">{quote.serviceDescription}</p>
            </div>
          )}

          {/* Postavke */}
          <div className="mb-8">
            <h3 className="font-semibold text-[#934435] mb-4">Postavke:</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f8ecec]">
                  <th className="text-left p-3 border border-gray-300">Opis</th>
                  <th className="text-center p-3 border border-gray-300">Količina</th>
                  <th className="text-right p-3 border border-gray-300">Cena</th>
                  <th className="text-right p-3 border border-gray-300">Znesek</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="p-3 border border-gray-300">{item.description}</td>
                    <td className="p-3 border border-gray-300 text-center">{item.quantity}</td>
                    <td className="p-3 border border-gray-300 text-right">{formatCurrency(item.price)}</td>
                    <td className="p-3 border border-gray-300 text-right">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Skupni zneski */}
          <div className="ml-auto w-64 space-y-2">
            <div className="flex justify-between">
              <span>Osnova za DDV:</span>
              <span>{formatCurrency(quote.totalWithoutVat)}</span>
            </div>
            <div className="flex justify-between">
              <span>DDV (22%):</span>
              <span>{formatCurrency(quote.vat)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>SKUPAJ ZA PLAČILO:</span>
              <span>{formatCurrency(quote.totalPayable)}</span>
            </div>
          </div>

          {/* Pogoji */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-[#934435] mb-4">Pogoji ponudbe:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Ponudba je veljavna do {formatDate(quote.validUntil)}</li>
              <li>• Cene so v EUR in vsebujejo DDV po veljavni stopnji</li>
              <li>• Rok izvedbe: do dogovora</li>
              <li>• Način plačila: po predračunu ali po izvedbi storitve</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-300 normal-footer">
            <div className="text-center text-sm text-gray-500">
              <p>Hvala za vaše zaupanje!</p>
              <p className="mt-2">Za morebitna vprašanja smo vam na voljo na e-pošti ali telefonu.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
