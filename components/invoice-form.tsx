"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Calculator, Loader2, Copy } from "lucide-react"
import type { Customer, Invoice, InvoiceItem, SavedInvoice } from "@/lib/database"

interface InvoiceFormProps {
  customers: Customer[]
  onInvoiceCreate: (invoice: Invoice, isSaveAs?: boolean) => void
  onSaveAs?: () => void
  loading: boolean
  saving?: boolean
  editingInvoice?: SavedInvoice | null
  saveAsMode?: boolean
}

interface AutocompleteProps {
  customers: Customer[]
  onCustomerSelect: (customer: Customer) => void
  selectedCustomer: Customer | null
}

function CustomerAutocomplete({ customers, onCustomerSelect, selectedCustomer }: AutocompleteProps) {
  const [query, setQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])

  useEffect(() => {
    if (selectedCustomer) {
      setQuery(selectedCustomer.Stranka || "")
    }
  }, [selectedCustomer])

  useEffect(() => {
    if (query.length > 0) {
      const filtered = customers.filter((customer) => customer.Stranka?.toLowerCase().includes(query.toLowerCase()))
      setFilteredCustomers(filtered)
      setShowSuggestions(true)
    } else {
      setFilteredCustomers([])
      setShowSuggestions(false)
    }
  }, [query, customers])

  const handleCustomerSelect = (customer: Customer) => {
    setQuery(customer.Stranka || "")
    setShowSuggestions(false)
    onCustomerSelect(customer)
  }

  return (
    <div className="relative">
      <Input
        placeholder="Začnite tipkati ime podjetja..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length > 0 && setShowSuggestions(true)}
      />

      {showSuggestions && filteredCustomers.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
              onClick={() => handleCustomerSelect(customer)}
            >
              <div className="font-medium">{customer.Stranka}</div>
              <div className="text-sm text-muted-foreground">
                {customer.Naslov}, {customer.Kraj_postna_st}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function InvoiceForm({ 
  customers, 
  onInvoiceCreate, 
  onSaveAs,
  loading, 
  saving, 
  editingInvoice,
  saveAsMode = false 
}: InvoiceFormProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0])
  const [serviceDescription, setServiceDescription] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, price: 0, total: 0 }])

  // Naloži podatke za urejanje
  useEffect(() => {
    if (editingInvoice) {
      setSelectedCustomer(editingInvoice.customer)
      setInvoiceNumber(editingInvoice.invoiceNumber)
      setIssueDate(editingInvoice.issueDate)
      setDueDate(editingInvoice.dueDate)
      setServiceDate(editingInvoice.serviceDate)
      setServiceDescription(editingInvoice.serviceDescription)
      setItems(editingInvoice.items.length > 0 ? editingInvoice.items : [{ description: "", quantity: 1, price: 0, total: 0 }])
      
      // Če smo v saveAs načinu, počistimo številko računa
      if (saveAsMode) {
        setInvoiceNumber("")
      }
    }
  }, [editingInvoice, saveAsMode])

  // SPREMENJENO: Valuta 15 dni namesto 30
  useEffect(() => {
    if (issueDate) {
      const issue = new Date(issueDate)
      const due = new Date(issue)
      due.setDate(due.getDate() + 15) // Spremenil iz 30 na 15 dni
      setDueDate(due.toISOString().split("T")[0])
    }
  }, [issueDate])

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, price: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    if (field === "quantity" || field === "price") {
      newItems[index].total = Number(newItems[index].quantity) * Number(newItems[index].price)
    }

    setItems(newItems)
  }

  const totalWithoutVat = items.reduce((sum, item) => sum + item.total, 0)
  const vat = totalWithoutVat * 0.22
  const totalPayable = totalWithoutVat + vat

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCustomer || !invoiceNumber || items.some((item) => !item.description)) {
      alert("Prosimo, izpolnite vsa obvezna polja")
      return
    }

    const invoice: Invoice = {
      id: editingInvoice?.id,
      invoiceNumber,
      customer: selectedCustomer,
      items: items.filter((item) => item.description.trim() !== ""),
      serviceDescription,
      issueDate,
      dueDate,
      serviceDate,
      totalWithoutVat,
      vat,
      totalPayable,
    }

    onInvoiceCreate(invoice, saveAsMode)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Nalagam podatke o strankah...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Podatki o stranki</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Podjetje *</Label>
              <CustomerAutocomplete
                customers={customers}
                onCustomerSelect={setSelectedCustomer}
                selectedCustomer={selectedCustomer}
              />
            </div>

            {selectedCustomer && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div>
                  <strong>Naslov:</strong> {selectedCustomer.Naslov}
                </div>
                <div>
                  <strong>Kraj:</strong> {selectedCustomer.Kraj_postna_st}
                </div>
                <div>
                  <strong>E-pošta:</strong> {selectedCustomer.email}
                </div>
                <div>
                  <strong>ID za DDV:</strong> {selectedCustomer.ID_DDV}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Podatki o računu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-number">Številka računa *</Label>
              <Input
                id="invoice-number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder={saveAsMode ? "Vnesite novo številko računa..." : "npr. 2024-001"}
                required
              />
              {saveAsMode && (
                <p className="text-sm text-muted-foreground">
                  Vnesite novo številko računa za kopijo
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue-date">Datum izdaje</Label>
                <Input id="issue-date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due-date">Valuta (15 dni)</Label>
                <Input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-date">Datum opravljene storitve</Label>
              <Input
                id="service-date"
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opis storitve</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Vnesite dodatni opis storitve..."
            value={serviceDescription}
            onChange={(e) => setServiceDescription(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Postavke računa
            <Button type="button" onClick={addItem} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Dodaj postavko
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-5 space-y-2">
                  <Label>Postavka</Label>
                  <Input
                    placeholder="Opis postavke"
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Količina</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Cena (EUR)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(index, "price", Number(e.target.value))}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Skupaj (EUR)</Label>
                  <Input type="number" value={item.total.toFixed(2)} readOnly className="bg-muted" />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span>Skupaj brez DDV:</span>
              <span className="font-medium">{totalWithoutVat.toFixed(2)} EUR</span>
            </div>
            <div className="flex justify-between">
              <span>DDV (22%):</span>
              <span className="font-medium">{vat.toFixed(2)} EUR</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Skupaj za plačilo:</span>
              <span>{totalPayable.toFixed(2)} EUR</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 pt-6 border-t">
        <Button 
          type="submit"
          size="lg" 
          className="gap-2 flex-1" 
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Shranjujem...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4" />
              {editingInvoice 
                ? (saveAsMode ? "Shrani kot nov račun" : "Posodobi račun")
                : "Generiraj račun"
              }
            </>
          )}
        </Button>
        
        {/* Gumb za Save As - prikaže se samo ko urejamo obstoječ račun in nismo v saveAs načinu */}
        {editingInvoice && !saveAsMode && onSaveAs && (
          <Button
            type="button"
            variant="outline"
            onClick={onSaveAs}
            disabled={saving}
            className="gap-2"
            size="lg"
          >
            <Copy className="h-4 w-4" />
            Shrani kot nov
          </Button>
        )}
        
        {/* Gumb za preklic Save As načina */}
        {saveAsMode && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // Preusmeri nazaj na normalno urejanje
              window.location.href = `/invoices?edit=${editingInvoice?.id}`
            }}
            disabled={saving}
            size="lg"
          >
            Prekliči
          </Button>
        )}
      </div>
    </form>
  )
}
