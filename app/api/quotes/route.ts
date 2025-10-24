// app/quotes/page.tsx
"use client"
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, Download, Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Customer {
  id: number
  Stranka: string
  Naslov: string
  Kraj_postna_st: string
  email: string
  ID_DDV: string
}

interface QuoteItem {
  description: string
  quantity: number
  price: number
  total: number
}

export default function NewQuotePage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [items, setItems] = useState<QuoteItem[]>([
    { description: '', quantity: 1, price: 0, total: 0 }
  ])
  const [formData, setFormData] = useState({
    quoteNumber: '',
    customerId: '',
    serviceDescription: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    serviceDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index)
      setItems(newItems)
    }
  }

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'price') {
      const quantity = field === 'quantity' ? Number(value) : newItems[index].quantity
      const price = field === 'price' ? Number(value) : newItems[index].price
      newItems[index].total = quantity * price
    }
    
    setItems(newItems)
  }

  const calculateTotals = () => {
    const totalWithoutVat = items.reduce((sum, item) => sum + item.total, 0)
    const vat = totalWithoutVat * 0.22 // 22% DDV
    const totalPayable = totalWithoutVat + vat

    return { totalWithoutVat, vat, totalPayable }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { totalWithoutVat, vat, totalPayable } = calculateTotals()
    const selectedCustomer = customers.find(c => c.id === parseInt(formData.customerId))

    if (!selectedCustomer) {
      alert('Izberite stranko')
      return
    }

    const quoteData = {
      quoteNumber: formData.quoteNumber,
      customer: selectedCustomer,
      items,
      serviceDescription: formData.serviceDescription,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      serviceDate: formData.serviceDate,
      totalWithoutVat,
      vat,
      totalPayable,
    }

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      })

      if (response.ok) {
        const savedQuote = await response.json()
        router.push(`/quotes/view/${savedQuote.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Napaka pri shranjevanju ponudbe')
      }
    } catch (error) {
      console.error('Error saving quote:', error)
      alert('Napaka pri shranjevanju ponudbe')
    }
  }

  const { totalWithoutVat, vat, totalPayable } = calculateTotals()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nova ponudba</h1>
          <p className="text-muted-foreground">Ustvarite novo ponudbo za stranko</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Osnovni podatki</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quoteNumber">Številka ponudbe</Label>
                <Input
                  id="quoteNumber"
                  value={formData.quoteNumber}
                  onChange={(e) => setFormData({ ...formData, quoteNumber: e.target.value })}
                  placeholder="PON-2024-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerId">Stranka</Label>
                <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Izberite stranko" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.Stranka}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceDescription">Opis storitve</Label>
              <Textarea
                id="serviceDescription"
                value={formData.serviceDescription}
                onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
                placeholder="Podroben opis storitve..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Datum izdaje</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Rok veljavnosti</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceDate">Datum opravljanja storitve</Label>
                <Input
                  id="serviceDate"
                  type="date"
                  value={formData.serviceDate}
                  onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Postavke
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Dodaj postavko
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-5">
                    <Label>Opis</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Opis postavke..."
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Količina</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Cena (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Skupaj (€)</Label>
                    <Input
                      type="number"
                      value={item.total.toFixed(2)}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      onClick={() => removeItem(index)}
                      variant="outline"
                      size="icon"
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Povzetek</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Osnova za DDV:</span>
                <span>{totalWithoutVat.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span>DDV (22%):</span>
                <span>{vat.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>SKUPAJ ZA PLAČILO:</span>
                <span>{totalPayable.toFixed(2)} €</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href="/">Prekliči</Link>
          </Button>
          <Button type="submit">Shrani ponudbo</Button>
        </div>
      </form>
    </div>
  )
}
