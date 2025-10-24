// components/document-form.tsx
"use client"
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

interface Customer {
  id: number
  Stranka: string
  Naslov: string
  Kraj_postna_st: string
  email: string
  ID_DDV: string
}

interface DocumentItem {
  description: string
  quantity: number
  price: number
  total: number
}

interface DocumentFormProps {
  type: 'invoice' | 'quote' | 'credit-note' | 'contract'
  onSubmit: (data: any) => void
  initialData?: any
}

const documentLabels = {
  invoice: {
    title: 'račun',
    number: 'Številka računa',
    new: 'Nov račun',
    list: 'Vsi računi'
  },
  quote: {
    title: 'ponudba',
    number: 'Številka ponudbe',
    new: 'Nova ponudba',
    list: 'Vse ponudbe'
  },
  'credit-note': {
    title: 'dobropis',
    number: 'Številka dobropisa',
    new: 'Nov dobropis',
    list: 'Vsi dobropisi'
  },
  contract: {
    title: 'pogodba',
    number: 'Številka pogodbe',
    new: 'Nova pogodba',
    list: 'Vse pogodbe'
  }
}

export function DocumentForm({ type, onSubmit, initialData }: DocumentFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [items, setItems] = useState<DocumentItem[]>([
    { description: '', quantity: 1, price: 0, total: 0 }
  ])
  const [formData, setFormData] = useState({
    documentNumber: '',
    customerId: '',
    serviceDescription: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    serviceDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchCustomers()
    if (initialData) {
      setFormData({
        documentNumber: initialData.documentNumber,
        customerId: initialData.customerId,
        serviceDescription: initialData.serviceDescription,
        issueDate: initialData.issueDate,
        dueDate: initialData.dueDate,
        serviceDate: initialData.serviceDate,
      })
      setItems(initialData.items)
    }
  }, [initialData])

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

  const updateItem = (index: number, field: keyof DocumentItem, value: string | number) => {
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
    const vat = totalWithoutVat * 0.22
    const totalPayable = totalWithoutVat + vat

    return { totalWithoutVat, vat, totalPayable }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const { totalWithoutVat, vat, totalPayable } = calculateTotals()
    const selectedCustomer = customers.find(c => c.id === parseInt(formData.customerId))

    if (!selectedCustomer) {
      alert('Izberite stranko')
      return
    }

    const documentData = {
      documentNumber: formData.documentNumber,
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

    onSubmit(documentData)
  }

  const { totalWithoutVat, vat, totalPayable } = calculateTotals()
  const labels = documentLabels[type]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Osnovni podatki</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentNumber">{labels.number}</Label>
              <Input
                id="documentNumber"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                placeholder={`${type.toUpperCase()}-2024-001`}
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
        <Button type="submit">Shrani {labels.title}</Button>
      </div>
    </form>
  )
}
