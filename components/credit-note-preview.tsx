// components/credit-note-preview.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Mail, Printer } from "lucide-react"
import type { CreditNote } from "@/lib/database"
import Image from "next/image"
import { downloadCreditNotePDFFromPreview, generateCreditNotePDFFromElement } from "@/lib/pdf-generator-credit-note"
import { openEmailClient, sendCreditNoteEmail } from "@/lib/email-service-credit-note"

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('sl-SI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

interface CreditNotePreviewProps {
  creditNote: CreditNote
  onDownload: () => void
  onSendEmail: () => void
}

export function CreditNotePreview({ creditNote, onDownload, onSendEmail }: CreditNotePreviewProps) {
  const handlePrint = () => {
    window.print()
  }

  const handleDirectDownload = () => {
    downloadCreditNotePDFFromPreview(creditNote, 'credit-note-preview-content')
  }

  const handleDirectEmail = () => {
    openEmailClient(creditNote, 'credit-note')
  }

  return (
    <div className="space-y-6">
      <style jsx>{`
        @media print {
          .credit-note-preview-content {
            font-size: 12pt !important;
            font-family: Arial, sans-serif !important;
          }
          .credit-note-title {
            font-size: 12pt !important;
            font-weight: bold !important;
          }
          .credit-note-customer-name {
            font-size: 14pt !important;
            font-weight: bold !important;
          }
          .credit-note-company-info {
            font-size: 9pt !important;
          }
          .credit-note-section-title {
            font-size: 12pt !important;
            font-weight: bold !important;
          }
          .credit-note-table {
            font-size: 9pt !important;
          }
          .credit-note-table-header {
            font-size: 9pt !important;
            font-weight: bold !important;
          }
          .credit-note-total {
            font-size: 10pt !important;
            font-weight: bold !important;
          }
          .credit-note-footer {
            font-size: 8pt !important;
          }
          .credit-note-payment-info {
            font-size: 11pt !important;
          }
          .podpis {
            font-size: 8pt !important;
          }
        }
        
        .credit-note-preview-content {
          font-family: Arial, sans-serif;
        }
        .credit-note-title {
          font-size: 1.2rem;
          font-weight: bold;
        }
        .credit-note-customer-name {
          font-size: 1.125rem;
          font-weight: bold;
        }
        .credit-note-company-info {
          font-size: 0.75rem;
        }
        .credit-note-section-title {
          font-size: 0.875rem;
          font-weight: bold;
        }
        .credit-note-table {
          font-size: 0.8rem;
        }
        .credit-note-table-header {
          font-size: 0.8rem;
          font-weight: bold;
        }
        .credit-note-total {
          font-size: 0.85rem;
          font-weight: bold;
        }
        .credit-note-footer {
          font-size: 0.7rem;
        }
        .credit-note-payment-info {
          font-size: 0.875rem;
        }
      `}</style>

      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={handlePrint} className="gap-2 bg-transparent">
          <Printer className="h-4 w-4" />
          Natisni
        </Button>
        <Button variant="outline" onClick={handleDirectDownload} className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Prenesi PDF
        </Button>
        <Button onClick={handleDirectEmail} className="gap-2">
          <Mail className="h-4 w-4" />
          Pošlji po e-pošti
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardContent id="credit-note-preview-content" className="p-8 print:p-0 credit-note-preview-content">
          <div className="flex justify-end mb-6">
            <div className="relative w-35 h-18">
              <Image 
                src="/images/2km-logo.png" 
                alt="2KM Consulting Logo" 
                fill 
                className="object-contain"
                priority
                onError={(e) => {
                  console.warn('Logo se ni naložil:', e)
                }} 
              />
            </div>
          </div>

          <hr className="border-[#934435] border-1 mb-6" />

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="space-y-0 -my-1">
              <div className="py-0.1"><strong>{creditNote.customer.Stranka}</strong></div>
              <div className="py-0.1">{creditNote.customer.Naslov}</div>
              <div className="py-0.1">{creditNote.customer.Kraj_postna_st}</div>
              <div className="py-0.1">{creditNote.customer.email}</div>
              <div className="py-0.1">
                <strong>ID za DDV:</strong> {creditNote.customer.ID_DDV}
              </div>

              <div className="mt-6 space-y-0">
                <div className="py-0.1">
                  <strong>Ljubljana:</strong> {new Date(creditNote.issueDate).toLocaleDateString("sl-SI")}
                </div>
                <div className="py-0.1">
                  <strong>Valuta:</strong> {new Date(creditNote.dueDate).toLocaleDateString("sl-SI")}
                </div>
                <div className="py-0.1">
                  <strong>Datum opr. storitve:</strong> {new Date(creditNote.serviceDate).toLocaleDateString("sl-SI")}
                </div>
              </div>
            </div>

            <div className="text-right credit-note-company-info space-y-1">
              <div className="font-semibold">2KM Consulting d.o.o., podjetniško in poslovno svetovanje</div>
              <div>Športna ulica 22, 1000 Ljubljana</div>
              <div>MŠ: 6315992000</div>
              <div>ID. št. za DDV: SI 10628169</div>
              <div>Osnovni kapital: 7.500,00 EUR</div>
              <div>Datum vpisa v SR: 13.2.2013, Okrožno sodišče Koper</div>
              <div className="mt-2">Poslovni račun št:</div>
              <div>IBAN: SI56 0223 6026 1489 640</div>
              <div>Nova Ljubljanska banka d.d., Ljubljana</div>
              <div>Trg republike 2, 1520 Ljubljana</div>
              <div>SWIFT: LJBASI2X</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-xl">
              <strong>Dobropis:</strong> {creditNote.creditNoteNumber}
            </div>
          </div>

          <hr className="mb-6" />

          {creditNote.serviceDescription && (
            <div className="mb-6">
              <h4 className="credit-note-section-title mb-2">Razlog za dobropis:</h4>
              <div className="whitespace-pre-wrap">{creditNote.serviceDescription}</div>
            </div>
          )}

          <div className="mb-8">
            <table className="w-full border-collapse border border-gray-300 credit-note-table">
              <thead>
                <tr className="bg-[#f8ecec]">
                  <th className="border border-gray-300 p-2 text-left credit-note-table-header">Postavka</th>
                  <th className="border border-gray-300 p-2 text-right credit-note-table-header">Količina</th>
                  <th className="border border-gray-300 p-2 text-right credit-note-table-header">Cena (EUR)</th>
                  <th className="border border-gray-300 p-2 text-right credit-note-table-header">Skupaj (EUR)</th>
                </tr>
              </thead>
              <tbody>
                {creditNote.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{item.description}</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(item.quantity)}</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(item.price)}</td>
                    <td className="border border-gray-300 p-2 text-right">{formatNumber(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="credit-note-total">
                  <td colSpan={3} className="border border-gray-300 p-2 text-left">
                    Skupaj brez DDV:
                  </td>
                  <td className="border border-gray-300 p-2 text-right">{formatNumber(creditNote.totalWithoutVat)}</td>
                </tr>
                <tr className="credit-note-total">
                  <td colSpan={3} className="border border-gray-300 p-2 text-left">
                    DDV (22%):
                  </td>
                  <td className="border border-gray-300 p-2 text-right">{formatNumber(creditNote.vat)}</td>
                </tr>
                <tr className="credit-note-total">
                  <td colSpan={3} className="border border-gray-300 p-2 text-left">
                    Skupaj za vračilo:
                  </td>
                  <td className="border border-gray-300 p-2 text-right">{formatNumber(creditNote.totalPayable)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="space-y-2 mb-8 credit-note-payment-info">
            <div className="flex justify-between">
              <span>Znesek vračila na TRR:</span>
              <strong className="pr-80">SI56 0223 6026 1489 640</strong>
            </div>
            <div className="flex justify-between">
              <span>Pri vračilu se sklicujte na št. dobropisa:</span>
              <strong className="pr-80">{creditNote.creditNoteNumber}</strong>
            </div>
            <div>Vračilo zneska bo izvedeno v roku 14 dni.</div>
            <div className="mt-4 font-semibold">Hvala za sodelovanje!</div>
          </div>

          <div className="flex flex-col items-end gap-0">
            <strong className="podpis text-sm mb-0.5">2KM Consulting d.o.o.</strong>
            <div className="relative w-45 h-26">
              <Image 
                src="/images/signature-logo.png" 
                alt="Signature" 
                fill 
                className="object-contain"
                onError={(e) => {
                  console.warn('Podpis se ni naložil:', e)
                }} 
              />
            </div>
          </div>

          <div className="normal-footer">
            <hr className="border-[#934435] border-1 mb-4" />
            <div className="text-right credit-note-footer text-[#934435] space-y-2">
              <div className="font-semibold">2KM Consulting d.o.o., podjetniško in poslovno svetovanje</div>
              <div>Športna ulica 22, 1000 Ljubljana</div>
              <div>DŠ: SI 10628169</div>
              <div>TRR: SI56 0223 6026 1489 640 (NLB)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
