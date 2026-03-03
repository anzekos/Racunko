"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Save } from "lucide-react"
import { fetchInvoices, updateInvoicePayment, type SavedInvoice } from "@/lib/database"

const MONTHS = [
  "Januar","Februar","Marec","April","Maj","Junij",
  "Julij","Avgust","September","Oktober","November","December"
]

type LocalEdit = { paidAmount: number; notes: string }

function EditableCell({
  value,
  type = "text",
  onSave,
}: {
  value: string | number
  type?: "text" | "number"
  onSave: (val: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(String(value))

  useEffect(() => { setLocal(String(value)) }, [value])

  if (!editing) {
    return (
      <span
        className="cursor-pointer hover:bg-yellow-50 rounded px-1 min-w-[40px] inline-block"
        onClick={() => setEditing(true)}
        title="Klikni za urejanje"
      >
        {local || "—"}
      </span>
    )
  }

  return (
    <input
      autoFocus
      type={type}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { setEditing(false); onSave(local) }}
      onKeyDown={e => {
        if (e.key === "Enter") { setEditing(false); onSave(local) }
        if (e.key === "Escape") { setEditing(false); setLocal(String(value)) }
      }}
      className="border border-blue-400 rounded px-1 w-full text-sm"
    />
  )
}

export default function InvoiceLedgerPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [invoices, setInvoices] = useState<SavedInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [localEdits, setLocalEdits] = useState<Record<string, LocalEdit>>({})

  useEffect(() => {
    fetchInvoices().then(data => {
      setInvoices(data)
      const init: Record<string, LocalEdit> = {}
      data.forEach(inv => {
        init[inv.id!] = {
          paidAmount: inv.paidAmount ?? 0,
          notes: inv.notes ?? "",
        }
      })
      setLocalEdits(init)
      setLoading(false)
    })
  }, [])

  const monthInvoices = invoices.filter(inv => {
    const d = new Date(inv.issueDate)
    return d.getFullYear() === year && d.getMonth() === month
  })

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const handlePaidChange = (id: string, val: string) => {
    const num = parseFloat(val) || 0
    setLocalEdits(prev => ({
      ...prev,
      [id]: { ...prev[id], paidAmount: num }
    }))
  }

  const handleNotesChange = (id: string, val: string) => {
    setLocalEdits(prev => ({
      ...prev,
      [id]: { ...prev[id], notes: val }
    }))
  }

  const handleSave = async (id: string) => {
    setSaving(id)
    const edit = localEdits[id] || { paidAmount: 0, notes: "" }
    try {
      await updateInvoicePayment(id, edit.paidAmount, edit.notes)
      setInvoices(prev => prev.map(inv =>
        inv.id === id
          ? { ...inv, paidAmount: edit.paidAmount, notes: edit.notes,
              unpaidAmount: inv.totalPayable - edit.paidAmount }
          : inv
      ))
    } catch (e) {
      alert("Napaka pri shranjevanju")
    } finally {
      setSaving(null)
    }
  }

  const totals = monthInvoices.reduce((acc, inv) => {
    const paid = localEdits[inv.id!]?.paidAmount ?? inv.paidAmount ?? 0
    const unpaid = inv.totalPayable - paid
    return {
      cena: acc.cena + inv.totalWithoutVat,
      ddv: acc.ddv + inv.vat,
      znesek: acc.znesek + inv.totalPayable,
      placano: acc.placano + paid,
      neplacano: acc.neplacano + Math.max(0, unpaid),
    }
  }, { cena: 0, ddv: 0, znesek: 0, placano: 0, neplacano: 0 })

  const quickMonths: Array<{ label: string; y: number; m: number }> = []
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    quickMonths.push({
      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      y: d.getFullYear(),
      m: d.getMonth()
    })
  }

  const fmt = (n: number) =>
    n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <Header />

        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              <div className="max-w-7xl mx-auto">

                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">Baza računov</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pregled računov po mesecih z evidentiranjem plačil
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      className="border rounded px-3 py-2 text-sm bg-background"
                      value={`${year}-${month}`}
                      onChange={e => {
                        const parts = e.target.value.split("-")
                        setYear(Number(parts[0]))
                        setMonth(Number(parts[1]))
                      }}
                    >
                      {quickMonths.map(qm => (
                        <option key={`${qm.y}-${qm.m}`} value={`${qm.y}-${qm.m}`}>
                          {qm.label}
                        </option>
                      ))}
                    </select>

                    <Button variant="outline" size="icon" onClick={prevMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-lg min-w-[180px] text-center">
                      {MONTHS[month]} {year}
                    </span>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">Računi</p>
                      <p className="text-xl font-semibold">{monthInvoices.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">Skupaj brez DDV</p>
                      <p className="text-lg font-semibold">{fmt(totals.cena)} €</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">Skupaj z DDV</p>
                      <p className="text-lg font-semibold">{fmt(totals.znesek)} €</p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-green-700">Plačano</p>
                      <p className="text-lg font-semibold text-green-700">{fmt(totals.placano)} €</p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-red-700">Neplačano</p>
                      <p className="text-lg font-semibold text-red-700">{fmt(totals.neplacano)} €</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-100 border-b">
                            <th className="border px-3 py-2 text-left min-w-[150px]">Stranka</th>
                            <th className="border px-3 py-2 text-left min-w-[180px]">Storitev</th>
                            <th className="border px-3 py-2 text-right min-w-[100px]">Cena</th>
                            <th className="border px-3 py-2 text-right min-w-[90px]">DDV 22%</th>
                            <th className="border px-3 py-2 text-right min-w-[110px]">Znesek</th>
                            <th className="border px-3 py-2 text-left min-w-[120px]">Št. računa</th>
                            <th className="border px-3 py-2 text-left min-w-[110px]">Datum računa</th>
                            <th className="border px-3 py-2 text-left min-w-[100px]">Val.</th>
                            <th className="border px-3 py-2 text-right min-w-[110px] bg-green-50">Plačano</th>
                            <th className="border px-3 py-2 text-right min-w-[110px] bg-red-50">Neplačano</th>
                            <th className="border px-3 py-2 text-left min-w-[160px]">Opombe</th>
                            <th className="border px-3 py-2 text-center min-w-[70px]">Shrani</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={12} className="text-center py-10 text-muted-foreground">
                                Nalagam račune...
                              </td>
                            </tr>
                          ) : monthInvoices.length === 0 ? (
                            <tr>
                              <td colSpan={12} className="text-center py-10 text-muted-foreground">
                                Ni računov za {MONTHS[month]} {year}
                              </td>
                            </tr>
                          ) : (
                            <>
                              {monthInvoices.map(inv => {
                                const edit = localEdits[inv.id!] || { paidAmount: 0, notes: "" }
                                const unpaid = Math.max(0, inv.totalPayable - edit.paidAmount)
                                const isPaid = unpaid <= 0
                                const isPartial = edit.paidAmount > 0 && !isPaid
                                return (
                                  <tr
                                    key={inv.id}
                                    className={`border-b hover:bg-gray-50 ${
                                      isPaid
                                        ? "bg-green-50"
                                        : isPartial
                                        ? "bg-yellow-50"
                                        : ""
                                    }`}
                                  >
                                    <td className="border px-3 py-2 font-medium">
                                      {inv.customer.Stranka}
                                    </td>
                                    <td className="border px-3 py-2 text-gray-600 text-xs">
                                      {inv.items.length > 0
                                        ? inv.items.map(i => i.description).join(", ")
                                        : inv.serviceDescription || "—"}
                                    </td>
                                    <td className="border px-3 py-2 text-right">
                                      {fmt(inv.totalWithoutVat)}
                                    </td>
                                    <td className="border px-3 py-2 text-right">
                                      {fmt(inv.vat)}
                                    </td>
                                    <td className="border px-3 py-2 text-right font-medium">
                                      {fmt(inv.totalPayable)}
                                    </td>
                                    <td className="border px-3 py-2 text-blue-700 font-mono text-xs">
                                      {inv.invoiceNumber}
                                    </td>
                                    <td className="border px-3 py-2">
                                      {new Date(inv.issueDate).toLocaleDateString("sl-SI")}
                                    </td>
                                    <td className="border px-3 py-2">
                                      {new Date(inv.dueDate).toLocaleDateString("sl-SI")}
                                    </td>
                                    <td className="border px-3 py-2 bg-green-50">
                                      <EditableCell
                                        value={edit.paidAmount === 0 ? "" : edit.paidAmount}
                                        type="number"
                                        onSave={val => handlePaidChange(inv.id!, val)}
                                      />
                                    </td>
                                    <td className={`border px-3 py-2 text-right font-medium ${
                                      unpaid > 0 ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"
                                    }`}>
                                      {unpaid > 0 ? fmt(unpaid) : "✓"}
                                    </td>
                                    <td className="border px-3 py-2">
                                      <EditableCell
                                        value={edit.notes}
                                        onSave={val => handleNotesChange(inv.id!, val)}
                                      />
                                    </td>
                                    <td className="border px-3 py-2 text-center">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSave(inv.id!)}
                                        disabled={saving === inv.id}
                                        className="h-7 px-2"
                                      >
                                        {saving === inv.id
                                          ? <span className="text-xs">...</span>
                                          : <Save className="h-3 w-3" />
                                        }
                                      </Button>
                                    </td>
                                  </tr>
                                )
                              })}

                              {/* SKUPAJ */}
                              <tr className="bg-gray-200 font-bold border-t-2 border-gray-400">
                                <td className="border px-3 py-2" colSpan={2}>
                                  SKUPAJ — {MONTHS[month]} {year}
                                </td>
                                <td className="border px-3 py-2 text-right">{fmt(totals.cena)}</td>
                                <td className="border px-3 py-2 text-right">{fmt(totals.ddv)}</td>
                                <td className="border px-3 py-2 text-right">{fmt(totals.znesek)}</td>
                                <td className="border px-3 py-2" colSpan={3}></td>
                                <td className="border px-3 py-2 text-right bg-green-100 text-green-800">
                                  {fmt(totals.placano)}
                                </td>
                                <td className="border px-3 py-2 text-right bg-red-100 text-red-700">
                                  {fmt(totals.neplacano)}
                                </td>
                                <td className="border px-3 py-2" colSpan={2}></td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <p className="text-xs text-muted-foreground mt-3">
                  Klikni na vrednost v stolpcih <strong>Plačano</strong> ali <strong>Opombe</strong> za urejanje, nato pritisni <strong>Shrani</strong>.
                </p>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
