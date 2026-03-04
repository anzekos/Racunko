"use client"

import { useState, useEffect, useMemo } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Save, BarChart2, Calendar } from "lucide-react"
import { fetchInvoices, updateInvoicePayment, type SavedInvoice } from "@/lib/database"

const MONTHS = [
  "Januar","Februar","Marec","April","Maj","Junij",
  "Julij","Avgust","September","Oktober","November","December"
]

type LocalEdit = { paidAmount: number; notes: string }
type ViewMode = "month" | "year"

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
      className="border border-blue-400 rounded px-1 w-full"
      style={{ fontSize: "inherit", fontFamily: "inherit" }}
    />
  )
}

// Parse invoice number for sorting (handles formats like 2024-001, RAC-2024-001, etc.)
function parseInvoiceNumber(num: string): number {
  const digits = num.replace(/\D/g, "")
  return parseInt(digits, 10) || 0
}

const fmt = (n: number) =>
  n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const TABLE_STYLE: React.CSSProperties = {
  fontFamily: "Arial, sans-serif",
  fontSize: "12px",
}

const TH_STYLE: React.CSSProperties = {
  fontFamily: "Arial, sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  padding: "5px 8px",
  whiteSpace: "nowrap",
  borderBottom: "2px solid #e5e7eb",
  borderRight: "1px solid #e5e7eb",
  background: "#f9fafb",
}

const TD_STYLE: React.CSSProperties = {
  fontFamily: "Arial, sans-serif",
  fontSize: "12px",
  padding: "3px 8px",
  borderBottom: "1px solid #f0f0f0",
  borderRight: "1px solid #f0f0f0",
  lineHeight: "1.4",
}

export default function InvoiceLedgerPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [invoices, setInvoices] = useState<SavedInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("month")

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [localEdits, setLocalEdits] = useState<Record<string, LocalEdit>>({})

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        setLoading(true)
        const data = await fetchInvoices()
        if (cancelled) return

        setInvoices(data)
        const init: Record<string, LocalEdit> = {}
        data.forEach(inv => {
          if (!inv.id) return
          init[inv.id] = {
            paidAmount: inv.paidAmount ?? 0,
            notes: inv.notes ?? "",
          }
        })
        setLocalEdits(init)
      } catch (e) {
        console.error("Error loading invoices:", e)
        if (cancelled) return
        setInvoices([])
        setLocalEdits({})
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

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
    setLocalEdits(prev => ({ ...prev, [id]: { ...prev[id], paidAmount: num } }))
  }

  const handleNotesChange = (id: string, val: string) => {
    setLocalEdits(prev => ({ ...prev, [id]: { ...prev[id], notes: val } }))
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

  // Month view invoices - sorted by invoice number
  const monthInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        const d = new Date(inv.issueDate)
        return d.getFullYear() === year && d.getMonth() === month
      })
      .sort((a, b) => parseInvoiceNumber(a.invoiceNumber) - parseInvoiceNumber(b.invoiceNumber))
  }, [invoices, year, month])

  // Year view: group by month, sorted by invoice number within each month
  const yearData = useMemo(() => {
    const yearInvoices = invoices.filter(inv => new Date(inv.issueDate).getFullYear() === year)
    const byMonth: SavedInvoice[][] = Array.from({ length: 12 }, () => [])
    yearInvoices.forEach(inv => {
      const m = new Date(inv.issueDate).getMonth()
      byMonth[m].push(inv)
    })
    byMonth.forEach(arr => arr.sort((a, b) => parseInvoiceNumber(a.invoiceNumber) - parseInvoiceNumber(b.invoiceNumber)))
    return byMonth
  }, [invoices, year])

  const calcTotals = (invList: SavedInvoice[]) =>
    invList.reduce((acc, inv) => {
      const paid = localEdits[inv.id!]?.paidAmount ?? inv.paidAmount ?? 0
      const unpaid = inv.totalPayable - paid
      return {
        cena: acc.cena + inv.totalWithoutVat,
        ddv: acc.ddv + inv.vat,
        znesek: acc.znesek + inv.totalPayable,
        placano: acc.placano + paid,
        neplacano: acc.neplacano + Math.max(0, unpaid),
        count: acc.count + 1,
      }
    }, { cena: 0, ddv: 0, znesek: 0, placano: 0, neplacano: 0, count: 0 })

  const monthTotals = useMemo(() => calcTotals(monthInvoices), [monthInvoices, localEdits])

  const yearTotals = useMemo(() => {
    const allYearInvoices = invoices.filter(inv => new Date(inv.issueDate).getFullYear() === year)
    return calcTotals(allYearInvoices)
  }, [invoices, year, localEdits])

  const quickMonths: Array<{ label: string; y: number; m: number }> = []
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    quickMonths.push({ label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, y: d.getFullYear(), m: d.getMonth() })
  }

  const availableYears = useMemo(() => {
    const years = new Set(invoices.map(inv => new Date(inv.issueDate).getFullYear()))
    return Array.from(years).sort((a, b) => b - a)
  }, [invoices])

  // ---- RENDER ----
  const renderInvoiceRow = (inv: SavedInvoice) => {
    const edit = localEdits[inv.id!] || { paidAmount: 0, notes: "" }
    const unpaid = Math.max(0, inv.totalPayable - edit.paidAmount)
    const isPaid = unpaid <= 0
    const isPartial = edit.paidAmount > 0 && !isPaid

    let rowBg = "white"
    if (isPaid) rowBg = "#f0fdf4"
    else if (isPartial) rowBg = "#fefce8"

    return (
      <tr key={inv.id} style={{ backgroundColor: rowBg }}>
        <td style={{ ...TD_STYLE, textAlign: "left", fontWeight: 500 }}>{inv.customer.Stranka}</td>
        <td style={{ ...TD_STYLE, textAlign: "left", color: "oklch", fontSize: "12px" }}>
          {inv.items.length > 0 ? inv.items.map(i => i.description).join(", ") : inv.serviceDescription || "—"}
        </td>
        <td style={{ ...TD_STYLE, textAlign: "right" }}>{fmt(inv.totalWithoutVat)}</td>
        <td style={{ ...TD_STYLE, textAlign: "right" }}>{fmt(inv.vat)}</td>
        <td style={{ ...TD_STYLE, textAlign: "right", fontWeight: 600 }}>{fmt(inv.totalPayable)}</td>
        <td style={{ ...TD_STYLE, textAlign: "right", color: "oklch", fontFamily: "Arial, sans-serif", fontSize: "12px" }}>
          {inv.invoiceNumber}
        </td>
        <td style={{ ...TD_STYLE, textAlign: "right" }}>
          {new Date(inv.issueDate).toLocaleDateString("sl-SI")}
        </td>
        <td style={{ ...TD_STYLE, textAlign: "right" }}>
          {new Date(inv.dueDate).toLocaleDateString("sl-SI")}
        </td>
        <td style={{ ...TD_STYLE, textAlign: "right", background: "#f0fdf4" }}>
          <EditableCell
            value={edit.paidAmount === 0 ? "" : edit.paidAmount}
            type="number"
            onSave={val => handlePaidChange(inv.id!, val)}
          />
        </td>
        <td style={{
          ...TD_STYLE,
          textAlign: "right",
          fontWeight: 600,
          color: unpaid > 0 ? "#dc2626" : "#16a34a",
          background: unpaid > 0 ? "#fef2f2" : "#f0fdf4",
        }}>
          {unpaid > 0 ? fmt(unpaid) : "✓"}
        </td>
        <td style={{ ...TD_STYLE, textAlign: "right" }}>
          <EditableCell value={edit.notes} onSave={val => handleNotesChange(inv.id!, val)} />
        </td>
        <td style={{ ...TD_STYLE, textAlign: "center" }}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSave(inv.id!)}
            disabled={saving === inv.id}
            style={{ height: "24px", padding: "0 8px", fontSize: "11px" }}
          >
            {saving === inv.id ? "..." : <Save className="h-3 w-3" />}
          </Button>
        </td>
      </tr>
    )
  }

  const renderTotalsRow = (totals: ReturnType<typeof calcTotals>, label: string, bg = "#e5e7eb") => (
    <tr style={{ backgroundColor: bg, fontWeight: 700, fontFamily: "Arial, sans-serif", fontSize: "12px" }}>
      <td style={{ ...TD_STYLE, textAlign: "left", fontWeight: 700 }} colSpan={2}>
        {label} ({totals.count} računov)
      </td>
      <td style={{ ...TD_STYLE, textAlign: "right", fontWeight: 700 }}>{fmt(totals.cena)}</td>
      <td style={{ ...TD_STYLE, textAlign: "right", fontWeight: 700 }}>{fmt(totals.ddv)}</td>
      <td style={{ ...TD_STYLE, textAlign: "right", fontWeight: 700 }}>{fmt(totals.znesek)}</td>
      <td style={{ ...TD_STYLE }} colSpan={3}></td>
      <td style={{ ...TD_STYLE, textAlign: "right", fontWeight: 700, color: "#16a34a", background: "#dcfce7" }}>{fmt(totals.placano)}</td>
      <td style={{ ...TD_STYLE, textAlign: "right", fontWeight: 700, color: "#dc2626", background: "#fee2e2" }}>{fmt(totals.neplacano)}</td>
      <td style={{ ...TD_STYLE }} colSpan={2}></td>
    </tr>
  )

  const tableHeaders = (
    <thead>
      <tr>
        <th style={{ ...TH_STYLE, textAlign: "left", minWidth: 140 }}>Stranka</th>
        <th style={{ ...TH_STYLE, textAlign: "left", minWidth: 160 }}>Storitev</th>
        <th style={{ ...TH_STYLE, textAlign: "right", minWidth: 90 }}>Brez DDV</th>
        <th style={{ ...TH_STYLE, textAlign: "right", minWidth: 80 }}>DDV 22%</th>
        <th style={{ ...TH_STYLE, textAlign: "right", minWidth: 90 }}>Znesek</th>
        <th style={{ ...TH_STYLE, textAlign: "right", minWidth: 110 }}>Št. računa</th>
        <th style={{ ...TH_STYLE, textAlign: "right", minWidth: 100 }}>Datum</th>
        <th style={{ ...TH_STYLE, textAlign: "right", minWidth: 90 }}>Valuta</th>
        <th style={{ ...TH_STYLE, textAlign: "right", minWidth: 90, background: "#f0fdf4" }}>Plačano</th>
        <th style={{ ...TH_STYLE, textAlign: "right", minWidth: 90, background: "#fef2f2" }}>Neplačano</th>
        <th style={{ ...TH_STYLE, textAlign: "right", minWidth: 140 }}>Opombe</th>
        <th style={{ ...TH_STYLE, textAlign: "center", minWidth: 60 }}>Shrani</th>
      </tr>
    </thead>
  )

  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <Header />

        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              <div className="max-w-full mx-auto">

                {/* HEADER */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">Baza računov</h1>
                    <p className="text-sm text-muted-foreground mt-1">Pregled računov z evidentiranjem plačil</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View mode toggle */}
                    <div className="flex border rounded overflow-hidden">
                      <button
                        onClick={() => setViewMode("month")}
                        className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${viewMode === "month" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Mesec
                      </button>
                      <button
                        onClick={() => setViewMode("year")}
                        className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${viewMode === "year" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                      >
                        <BarChart2 className="h-3.5 w-3.5" />
                        Letni pregled
                      </button>
                    </div>

                    {viewMode === "month" ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded px-2 py-1.5 text-sm bg-background"
                          value={`${year}-${month}`}
                          onChange={e => {
                            const parts = e.target.value.split("-")
                            setYear(Number(parts[0]))
                            setMonth(Number(parts[1]))
                          }}
                        >
                          {quickMonths.map(qm => (
                            <option key={`${qm.y}-${qm.m}`} value={`${qm.y}-${qm.m}`}>{qm.label}</option>
                          ))}
                        </select>
                        <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold text-base min-w-[160px] text-center">
                          {MONTHS[month]} {year}
                        </span>
                        <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded px-2 py-1.5 text-sm bg-background"
                          value={year}
                          onChange={e => setYear(Number(e.target.value))}
                        >
                          {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                          {!availableYears.includes(now.getFullYear()) && (
                            <option value={now.getFullYear()}>{now.getFullYear()}</option>
                          )}
                        </select>
                        <Button variant="outline" size="icon" onClick={() => setYear(y => y - 1)} className="h-8 w-8">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold text-base min-w-[60px] text-center">{year}</span>
                        <Button variant="outline" size="icon" onClick={() => setYear(y => y + 1)} className="h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* STATS CARDS */}
                {viewMode === "month" ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    {[
                      { label: "Računi", val: monthTotals.count, unit: "" },
                      { label: "Skupaj brez DDV", val: fmt(monthTotals.cena), unit: " €" },
                      { label: "Skupaj z DDV", val: fmt(monthTotals.znesek), unit: " €" },
                      { label: "Plačano", val: fmt(monthTotals.placano), unit: " €", green: true },
                      { label: "Neplačano", val: fmt(monthTotals.neplacano), unit: " €", red: true },
                    ].map((c, i) => (
                      <Card key={i} className={c.green ? "border-green-200 bg-green-50" : c.red ? "border-red-200 bg-red-50" : ""}>
                        <CardContent className="p-3 text-center">
                          <p className={`text-xs ${c.green ? "text-green-700" : c.red ? "text-red-700" : "text-muted-foreground"}`}>{c.label}</p>
                          <p className={`text-base font-semibold ${c.green ? "text-green-700" : c.red ? "text-red-700" : ""}`}>{c.val}{c.unit}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    {[
                      { label: `Skupaj računov ${year}`, val: yearTotals.count, unit: "" },
                      { label: "Skupaj brez DDV", val: fmt(yearTotals.cena), unit: " €" },
                      { label: "Skupaj z DDV", val: fmt(yearTotals.znesek), unit: " €" },
                      { label: "Plačano", val: fmt(yearTotals.placano), unit: " €", green: true },
                      { label: "Neplačano", val: fmt(yearTotals.neplacano), unit: " €", red: true },
                    ].map((c, i) => (
                      <Card key={i} className={c.green ? "border-green-200 bg-green-50" : c.red ? "border-red-200 bg-red-50" : ""}>
                        <CardContent className="p-3 text-center">
                          <p className={`text-xs ${c.green ? "text-green-700" : c.red ? "text-red-700" : "text-muted-foreground"}`}>{c.label}</p>
                          <p className={`text-base font-semibold ${c.green ? "text-green-700" : c.red ? "text-red-700" : ""}`}>{c.val}{c.unit}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* TABLE */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">

                      {loading ? (
                        <div className="text-center py-10 text-muted-foreground text-sm">Nalagam račune...</div>
                      ) : viewMode === "month" ? (
                        /* ---- MONTH VIEW ---- */
                        <table style={{ ...TABLE_STYLE, width: "100%", borderCollapse: "collapse" }}>
                          {tableHeaders}
                          <tbody>
                            {monthInvoices.length === 0 ? (
                              <tr>
                                <td colSpan={12} style={{ ...TD_STYLE, textAlign: "center", padding: "32px", color: "#888" }}>
                                  Ni računov za {MONTHS[month]} {year}
                                </td>
                              </tr>
                            ) : (
                              <>
                                {monthInvoices.map(renderInvoiceRow)}
                                {renderTotalsRow(monthTotals, `SKUPAJ — ${MONTHS[month]} ${year}`)}
                              </>
                            )}
                          </tbody>
                        </table>
                      ) : (
                        /* ---- YEAR VIEW ---- */
                        <table style={{ ...TABLE_STYLE, width: "100%", borderCollapse: "collapse" }}>
                          {tableHeaders}
                          <tbody>
                            {MONTHS.map((mName, mIdx) => {
                              const mInvoices = yearData[mIdx]
                              if (mInvoices.length === 0) return null
                              const mTotals = calcTotals(mInvoices)
                              return (
                                <>
                                  {/* Month header */}
                                  <tr key={`mh-${mIdx}`}>
                                    <td
                                      colSpan={12}
                                      style={{
                                        ...TD_STYLE,
                                        background: "#f1f5f9",
                                        fontWeight: 700,
                                        fontSize: "12px",
                                        color: "#374151",
                                        paddingTop: "8px",
                                        paddingBottom: "4px",
                                        borderTop: "2px solid #cbd5e1",
                                      }}
                                    >
                                      {mName} {year}
                                    </td>
                                  </tr>
                                  {mInvoices.map(renderInvoiceRow)}
                                  {renderTotalsRow(mTotals, `Skupaj ${mName}`, "#e2e8f0")}
                                </>
                              )
                            })}
                            {/* GRAND TOTAL */}
                            <tr style={{ backgroundColor: "#1e293b", fontWeight: 700 }}>
                              <td style={{ ...TD_STYLE, textAlign: "left", fontWeight: 800, color: "white", fontSize: "13px", borderTop: "3px solid #0f172a" }} colSpan={2}>
                                LETNI SKUPAJ {year} ({yearTotals.count} računov)
                              </td>
                              <td style={{ ...TD_STYLE, textAlign: "right", fontWeight: 800, color: "white", fontSize: "13px", borderTop: "3px solid #0f172a" }}>{fmt(yearTotals.cena)}</td>
                              <td style={{ ...TD_STYLE, textAlign: "right", fontWeight: 800, color: "white", fontSize: "13px", borderTop: "3px solid #0f172a" }}>{fmt(yearTotals.ddv)}</td>
                              <td style={{ ...TD_STYLE, textAlign: "right", fontWeight: 800, color: "white", fontSize: "13px", borderTop: "3px solid #0f172a" }}>{fmt(yearTotals.znesek)}</td>
                              <td style={{ ...TD_STYLE, color: "white", borderTop: "3px solid #0f172a" }} colSpan={3}></td>
                              <td style={{ ...TD_STYLE, textAlign: "right", fontWeight: 800, color: "#4ade80", fontSize: "13px", background: "#14532d", borderTop: "3px solid #0f172a" }}>{fmt(yearTotals.placano)}</td>
                              <td style={{ ...TD_STYLE, textAlign: "right", fontWeight: 800, color: "#f87171", fontSize: "13px", background: "#7f1d1d", borderTop: "3px solid #0f172a" }}>{fmt(yearTotals.neplacano)}</td>
                              <td style={{ ...TD_STYLE, color: "white", borderTop: "3px solid #0f172a" }} colSpan={2}></td>
                            </tr>
                          </tbody>
                        </table>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {viewMode === "month" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Klikni na vrednost v stolpcih <strong>Plačano</strong> ali <strong>Opombe</strong> za urejanje, nato pritisni <strong>Shrani</strong>.
                    Računi so razvrščeni po številki računa.
                  </p>
                )}
                {viewMode === "year" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Letni pregled prikazuje vse račune za leto <strong>{year}</strong>, razvrščene po mesecih in znotraj meseca po številki računa.
                  </p>
                )}

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
