// components/offer-form.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Calculator, Loader2, Copy } from "lucide-react"
import type { Customer, Offer, InvoiceItem, SavedOffer } from "@/lib/database"
import { CustomerAutocomplete } from "./customer-autocomplete"

interface OfferFormProps {
  customers: Customer[]
  onOfferCreate: (offer: Offer, isSaveAs?: boolean) => void
  onSaveAs?: () => void
  loading: boolean
  saving?: boolean
  editingOffer?: SavedOffer | null
  saveAsMode?: boolean
}

export function OfferForm({ 
  customers, 
  onOfferCreate, 
  onSaveAs,
  loading, 
  saving, 
  editingOffer,
  saveAsMode = false 
}: OfferFormProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [offerNumber, setOfferNumber] = useState("")
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0])
  const [serviceDescription, setServiceDescription] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, price: 0, total: 0 }])

  useEffect(() => {
    if (editingOffer) {
      setSelectedCustomer(editingOffer.customer)
      setOfferNumber(editingOffer.offerNumber)
      setIssueDate(editingOffer.issueDate)
      setDueDate(editingOffer.dueDate)
      setServiceDate(editingOffer.serviceDate)
      setServiceDescription(editingOffer.serviceDescription)
      setItems(editingOffer.items.length > 0 ? editingOffer.items : [{ description: "", quantity: 1, price: 0, total: 0 }])
      
      if (saveAsMode) {
        setOfferNumber("")
      }
    }
  }, [editingOffer, saveAsMode])

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

    if (!selectedCustomer || !offerNumber || items.some((item) => !item.description)) {
      alert("Prosimo, izpolnite vsa obvezna polja")
      return
    }

    const offer: Offer = {
      id: editingOffer?.id,
      offerNumber,
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

    onOfferCreate(offer, saveAsMode)
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
            <CardTitle>Podatki o ponudbi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="offer-number">Številka ponudbe *</Label>
              <Input
                id="offer-number"
                value={offerNumber}
                onChange={(e) => setOfferNumber(e.target.value)}
                placeholder={saveAsMode ? "Vnesite novo številko ponudbe..." : "npr. PON-2024-001"}
                required
              />
              {saveAsMode && (
                <p className="text-sm text-muted-foreground">
                  Vnesite novo številko ponudbe za kopijo
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue-date">Datum izdaje</Label>
                <Input id="issue-date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due-date">Veljavnost do</Label>
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

      {/* Ostala koda je podobna kot pri InvoiceForm... */}
    </form>
  )
}
