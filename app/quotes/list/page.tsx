// app/quotes/list/page.tsx
"use client"
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Eye, Download, Send, Plus } from "lucide-react"
import Link from "next/link"

interface Quote {
  id: string
  quoteNumber: string
  customer: {
    Stranka: string
  }
  issueDate: string
  dueDate: string
  totalPayable: number
  status: string
}

const statusColors: { [key: string]: string } = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

const statusLabels: { [key: string]: string } = {
  draft: 'Osnutek',
  sent: 'Poslano',
  accepted: 'Sprejeto',
  rejected: 'Zavrnjeno',
  cancelled: 'Preklicano',
}

export default function QuotesListPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes')
      const data = await response.json()
      setQuotes(data)
    } catch (error) {
      console.error('Error fetching quotes:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Vse ponudbe</h1>
            <p className="text-muted-foreground">Pregled vseh ponudb</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/quotes">
            <Plus className="h-4 w-4 mr-2" />
            Nova ponudba
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seznam ponudb</CardTitle>
          <CardDescription>
            Skupno število ponudb: {quotes.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Številka ponudbe</TableHead>
                <TableHead>Stranka</TableHead>
                <TableHead>Datum izdaje</TableHead>
                <TableHead>Rok veljavnosti</TableHead>
                <TableHead>Znesek</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                  <TableCell>{quote.customer.Stranka}</TableCell>
                  <TableCell>{new Date(quote.issueDate).toLocaleDateString('sl-SI')}</TableCell>
                  <TableCell>{new Date(quote.dueDate).toLocaleDateString('sl-SI')}</TableCell>
                  <TableCell>{quote.totalPayable.toFixed(2)} €</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[quote.status]}>
                      {statusLabels[quote.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/quotes/view/${quote.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
