// components/credit-note-form.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Calculator, Loader2, Copy } from "lucide-react"
import type { Customer, InvoiceItem, SavedCreditNote, CreditNote } from "@/lib/database"
import { CustomerAutocomplete } from "@/components/invoice-form"

interface CreditNoteFormProps {
  customers: Customer[]
  onCreditNoteCreate: (creditNote: CreditNote, isSaveAs?: boolean) => void
  onSaveAs?: () => void
  loading: boolean
  saving?: boolean
  editingCreditNote?: SavedCreditNote | null
  saveAsMode?: boolean
}

export function CreditNoteForm({ 
  customers, 
  onCreditNoteCreate, 
  onSaveAs,
  loading, 
  saving, 
  editingCreditNote,
  saveAsMode = false 
}: CreditNoteFormProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [creditNoteNumber, setCreditNoteNumber] = useState("")
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0])
  const [serviceDescription, setServiceDescription] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, price: 0, total: 0 }])

  useEffect(() => {
    if (editingCreditNote) {
      setSelectedCustomer(editingCreditNote.customer)
      setCreditNoteNumber(editingCreditNote.creditNoteNumber)
      setIssueDate(editingCreditNote.issueDate)
      setDueDate(editingCreditNote.dueDate)
      setServiceDate(editingCreditNote.serviceDate)
      setServiceDescription(editingCreditNote.serviceDescription)
      setItems(editingCreditNote.items.length > 0 ? editingCreditNote.items : [{ description: "", quantity: 1, price: 0, total: 0 }])
      
      if (saveAsMode) {
        setCreditNoteNumber("")
      }
    }
  }, [editingCreditNote, saveAsMode])

  useEffect(() => {
    if (issueDate) {
      const issue = new Date(issueDate)
      const due = new Date(issue)
      due.setDate(due.getDate() + 30)
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

    if (!selectedCustomer || !creditNoteNumber || items.some((item) => !item.description)) {
      alert("Prosimo, izpolnite vsa obvezna polja")
      return
    }

    const creditNote: CreditNote = {
      id: editingCreditNote?.id,
      creditNoteNumber,
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

    onCreditNoteCreate(creditNote, saveAsMode)
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
            <CardTitle>Podatki o dobropisu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credit-note-number">Številka dobropisa *</Label>
              <Input
                id="credit-note-number"
                value={creditNoteNumber}
                onChange={(e) => setCreditNoteNumber(e.target.value)}
                placeholder={saveAsMode ? "Vnesite novo številko dobropisa..." : "npr. D-2024-001"}
                required
              />
              {saveAsMode && (
                <p className="text-sm text-muted-foreground">
                  Vnesite novo številko dobropisa za kopijo
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue-date">Datum izdaje</Label>
                <Input id="issue-date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due-date">Valuta</Label>
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
          <CardTitle>Razlog za dobropis</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Vnesite razlog za izdajo dobropisa..."
            value={serviceDescription}
            onChange={(e) => setServiceDescription(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Postavke dobropisa
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
              <span>Skupaj za vračilo:</span>
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
              {editingCreditNote 
                ? (saveAsMode ? "Shrani kot nov dobropis" : "Posodobi dobropis")
                : "Generiraj dobropis"
              }
            </>
          )}
        </Button>
        
        {editingCreditNote && !saveAsMode && onSaveAs && (
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
        
        {saveAsMode && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.href = `/credit-notes?edit=${editingCreditNote?.id}`
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
