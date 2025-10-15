"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Mail, Printer } from "lucide-react"
import type { Invoice } from "@/lib/database"
import Image from "next/image"
import { downloadInvoicePDF, downloadInvoicePDFFromPreview } from "@/lib/pdf-generator"
import { openEmailClient } from "@/lib/email-service"

interface InvoicePreviewProps {
  invoice: Invoice
  onDownload: () => void
  onSendEmail: () => void
}

export function InvoicePreview({ invoice, onDownload, onSendEmail }: InvoicePreviewProps) {
  const handlePrint = () => {
    window.print()
  }

  const handleDirectDownload = () => {
    downloadInvoicePDFFromPreview(invoice, 'invoice-preview-content')
  }

  const handleDirectEmail = () => {
    openEmailClient(invoice)
  }

  return (
    <div className="space-y-6">
      {/* CSS stili za print in PDF */}
      <style jsx>{`
        @media print {
          .invoice-preview-content {
            font-size: 12pt !important;
            font-family: Arial, sans-serif !important;
          }
          .invoice-title {
            font-size: 20pt !important;
            font-weight: bold !important;
          }
          .invoice-customer-name {
            font-size: 14pt !important;
            font-weight: bold !important;
          }
          .invoice-company-info {
            font-size: 9pt !important;
          }
          .invoice-section-title {
            font-size: 12pt !important;
            font-weight: bold !important;
          }
          .invoice-table {
            font-size: 10pt !important;
          }
          .invoice-table-header {
            font-size: 10pt !important;
            font-weight: bold !important;
          }
          .invoice-total {
            font-size: 11pt !important;
            font-weight: bold !important;
          }
          .invoice-footer {
            font-size: 8pt !important;
          }
          .invoice-payment-info {
            font-size: 11pt !important;
          }
        }
        
        /* Stili za PDF generiranje */
        .invoice-preview-content {
          font-family: Arial, sans-serif;
        }
        .invoice-title {
          font-size: 1.5rem;
          font-weight: bold;
        }
        .invoice-customer-name {
          font-size: 1.125rem;
          font-weight: bold;
        }
        .invoice-company-info {
          font-size: 0.75rem;
        }
        .invoice-section-title {
          font-size: 0.875rem;
          font-weight: bold;
        }
        .invoice-table {
          font-size: 0.875rem;
        }
        .invoice-table-header {
          font-size: 0.875rem;
          font-weight: bold;
        }
        .invoice-total {
          font-size: 0.875rem;
          font-weight: bold;
        }
        .invoice-footer {
          font-size: 0.7rem;
        }
        .invoice-payment-info {
          font-size: 0.875rem;
        }
      `}</style>

      {/* Action Buttons */}
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

      {/* Invoice Document */}
      <Card className="max-w-4xl mx-auto">
        <CardContent id="invoice-preview-content" className="p-8 print:p-0 invoice-preview-content">
          {/* Header with Logo */}
          <div className="flex justify-end mb-6">
            <div className="relative w-30 h-18">
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

          {/* Customer and Company Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Customer Info */}
            <div className="space-y-2">
              <div className="invoice-customer-name">{invoice.customer.Stranka}</div>
              <div>{invoice.customer.Naslov}</div>
              <div>{invoice.customer.Kraj_postna_st}</div>
              <div>{invoice.customer.email}</div>
              <div className="mt-4">
                <strong>ID za DDV:</strong> {invoice.customer.ID_DDV}
              </div>

              <div className="mt-6 space-y-1">
                <div>
                  <strong>Ljubljana:</strong> {new Date(invoice.issueDate).toLocaleDateString("sl-SI")}
                </div>
                <div>
                  <strong>Valuta:</strong> {new Date(invoice.dueDate).toLocaleDateString("sl-SI")}
                </div>
                <div>
                  <strong>Datum opr. storitve:</strong> {new Date(invoice.serviceDate).toLocaleDateString("sl-SI")}
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="text-right invoice-company-info space-y-1">
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

          {/* Invoice Number - POVEČANO */}
          <div className="mb-6">
            <div className="invoice-title">
              <strong>Račun:</strong> {invoice.invoiceNumber}
            </div>
          </div>

          <hr className="mb-6" />

          {/* Service Description */}
          {invoice.serviceDescription && (
            <div className="mb-6">
              <h4 className="invoice-section-title mb-2">Opis storitve:</h4>
              <div className="whitespace-pre-wrap">{invoice.serviceDescription}</div>
            </div>
          )}

          {/* Invoice Items Table */}
          <div className="mb-8">
            <table className="w-full border-collapse border border-gray-300 invoice-table">
              <thead>
                <tr className="bg-[#f8ecec]">
                  <th className="border border-gray-300 p-3 text-left invoice-table-header">Postavka</th>
                  <th className="border border-gray-300 p-3 text-left invoice-table-header">Količina</th>
                  <th className="border border-gray-300 p-3 text-left invoice-table-header">Cena (EUR)</th>
                  <th className="border border-gray-300 p-3 text-left invoice-table-header">Skupaj (EUR)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-3">{item.description}</td>
                    <td className="border border-gray-300 p-3">{item.quantity}</td>
                    <td className="border border-gray-300 p-3">{item.price.toFixed(2)}</td>
                    <td className="border border-gray-300 p-3">{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="invoice-total">
                  <td colSpan={3} className="border border-gray-300 p-3 text-left">
                    Skupaj brez DDV:
                  </td>
                  <td className="border border-gray-300 p-3">{invoice.totalWithoutVat.toFixed(2)}</td>
                </tr>
                <tr className="invoice-total">
                  <td colSpan={3} className="border border-gray-300 p-3 text-left">
                    DDV (22%):
                  </td>
                  <td className="border border-gray-300 p-3">{invoice.vat.toFixed(2)}</td>
                </tr>
                <tr className="invoice-total">
                  <td colSpan={3} className="border border-gray-300 p-3 text-left">
                    Skupaj za plačilo:
                  </td>
                  <td className="border border-gray-300 p-3">{invoice.totalPayable.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Info */}
          <div className="space-y-2 mb-8 invoice-payment-info">
            <div className="flex justify-between">
              <span>Znesek nakažite na TRR:</span>
              <strong className="pr-8">SI56 0223 6026 1489 640</strong>
            </div>
            <div className="flex justify-between">
              <span>Pri plačilu se sklicujte na št. računa:</span>
              <strong className="pr-8">{invoice.invoiceNumber}</strong>
            </div>
            <div>V primeru zamude se zaračunavajo zamudne obresti.</div>
            <div className="mt-4 font-semibold">Hvala za sodelovanje!</div>
          </div>

          {/* Signature */}
          <div className="flex justify-left mb-6">
            <div className="relative w-32 h-20">
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

          {/* Footer */}
          <hr className="border-[#934435] border-1 mb-4" />
          <div className="text-right invoice-footer text-[#934435] space-y-1">
            <div className="font-semibold">2KM Consulting d.o.o., podjetniško in poslovno svetovanje</div>
            <div>Športna ulica 22, 1000 Ljubljana</div>
            <div>DŠ: SI 10628169</div>
            <div>TRR: SI56 0223 6026 1489 640 (NLB)</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
