// app/quotes/view/[id]/page.tsx
"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Send, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

interface Quote {
  id: string
  quoteNumber: string
  customer: {
    Stranka: string
    Naslov: string
    Kraj_postna_st: string
    email: string
    ID_DDV: string
  }
  items: Array<{
    description: string
    quantity: number
    price: number
    total: number
  }>
  serviceDescription: string
  issueDate: string
  dueDate: string
  serviceDate: string
  totalWithoutVat: number
  vat: number
  totalPayable: number
  status: string
}

const statusLabels: { [key: string]: string } = {
  draft: 'Osnutek',
  sent: 'Poslano',
  accepted: 'Sprejeto',
  rejected: 'Zavrnjeno',
  cancelled: 'Preklicano',
}

export default function ViewQuotePage() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchQuote(params.id as string)
    }
  }, [params.id])

  const fetchQuote = async (id: string) => {
    try {
      const response = await fetch(`/api/quotes/${id}`)
      if (response.ok) {
        const data = await response.json()
        setQuote(data)
      }
    } catch (error) {
      console.error('Error fetching quote:', error)
    }
  }

  const deleteQuote = async () => {
    if (!quote) return

    if (confirm('Ali ste prepričani, da želite izbrisati to ponudbo?')) {
      try {
        const response = await fetch(`/api/quotes/${quote.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          router.push('/quotes/list')
        }
      } catch (error) {
        console.error('Error deleting quote:', error)
      }
    }
  }

  if (!quote) {
    return <div className="container mx-auto p-6">Nalagam...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/quotes/list">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Ponudba {quote.quoteNumber}</h1>
            <p className="text-muted-foreground">Podrobnosti ponudbe</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm">
            <Send className="h-4 w-4 mr-2" />
            Pošlji
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/quotes/edit/${quote.id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Uredi
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={deleteQuote}>
            <Trash2 className="h-4 w-4 mr-2" />
            Izbriši
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Podatki o ponudbi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Številka ponudbe</p>
                  <p className="font-medium">{quote.quoteNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="secondary">{statusLabels[quote.status]}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Datum izdaje</p>
                  <p className="font-medium">{new Date(quote.issueDate).toLocaleDateString('sl-SI')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rok veljavnosti</p>
                  <p className="font-medium">{new Date(quote.dueDate).toLocaleDateString('sl-SI')}</p>
                </div>
              </div>
              
              {quote.serviceDescription && (
                <div>
                  <p className="text-sm text-muted-foreground">Opis storitve</p>
                  <p className="font-medium">{quote.serviceDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Postavke</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opis</TableHead>
                    <TableHead className="text-right">Količina</TableHead>
                    <TableHead className="text-right">Cena</TableHead>
                    <TableHead className="text-right">Skupaj</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.price.toFixed(2)} €</TableCell>
                      <TableCell className="text-right">{item.total.toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stranka</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{quote.customer.Stranka}</p>
              <p className="text-sm">{quote.customer.Naslov}</p>
              <p className="text-sm">{quote.customer.Kraj_postna_st}</p>
              <p className="text-sm">{quote.customer.email}</p>
              <p className="text-sm">ID za DDV: {quote.customer.ID_DDV}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zneski</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Osnova za DDV:</span>
                <span>{quote.totalWithoutVat.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span>DDV:</span>
                <span>{quote.vat.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>SKUPAJ:</span>
                <span>{quote.totalPayable.toFixed(2)} €</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
