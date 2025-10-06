"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Customer } from "@/app/page"
import {
  Edit,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CustomerTableProps {
  customers: Customer[]
  loading: boolean
  onEdit: (customer: Customer) => void
  onRefresh: () => void
  demoMode?: boolean
}

export function CustomerTable({ customers, loading, onEdit, onRefresh, demoMode = false }: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(
    new Set([
      "Kraj_postna_st",
      "ID_DDV",
      "Ukrep",
      "JR",
      "Pogodba",
      "Gotovina_1",
      "Status_1",
      "Racun_izdal_1",
      "Gotovina_2",
      "Status_2",
      "Racun_izdal_2",
      "Gotovina_3",
      "Status_3",
      "Racun_izdal_3",
      "Gotovina_4",
      "Status_4",
      "Racun_izdal_4",
      "Gotovina_5",
      "Status_5",
      "Racun_izdal_5",
      "Gotovina_6",
      "Status_6",
      "Racun_izdal_6",
      "Gotovina_7",
      "Status_7",
      "Racun_izdal_7",
      "Status_8",
    ]),
  )

  const allColumns = [
    "Stranka",
    "Naslov",
    "Kraj_postna_st",
    "email",
    "ID_DDV",
    "Ukrep",
    "JR",
    "Pogodba",
    "VLG",
    "VLG_z_DDV",
    "Gotovina_1",
    "Status_1",
    "Racun_izdal_1",
    "Opomba_Ponudba",
    "Provizija",
    "ODL",
    "ODL_z_DDV",
    "Gotovina_2",
    "Status_2",
    "Racun_izdal_2",
    "Delež_odločba",
    "ZAH1",
    "ZAH1_z_DDV",
    "Gotovina_3",
    "Status_3",
    "Racun_izdal_3",
    "Delež_zah1",
    "ZAH2",
    "ZAH2_z_DDV",
    "Gotovina_4",
    "Status_4",
    "Racun_izdal_4",
    "Delež_zah2",
    "ZAH3",
    "ZAH3_z_DDV",
    "Gotovina_5",
    "Status_5",
    "Racun_izdal_5",
    "Delež_zah3",
    "ZAH4",
    "ZAH4_z_DDV",
    "Gotovina_6",
    "Status_6",
    "Racun_izdal_6",
    "Delež_zah4",
    "ZAH5",
    "ZAH5_z_DDV",
    "Gotovina_7",
    "Status_7",
    "Racun_izdal_7",
    "Delež_zah5",
    "Informacije",
    "ODL_izplacano",
    "ZAH1_izplacano",
    "ZAH2_izplacano",
    "ZAH3_izplacano",
    "ZAH4_izplacano",
    "ZAH5_izplacano",
    "Izplacano",
    "Status_8",
    "SKUPAJ",
    "KONTROLA",
  ]

  const visibleColumns = allColumns.filter((col) => !hiddenColumns.has(col))

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.Stranka?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.Naslov?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage)

  const toggleColumn = (column: string) => {
    const newHidden = new Set(hiddenColumns)
    if (newHidden.has(column)) {
      newHidden.delete(column)
    } else {
      newHidden.add(column)
    }
    setHiddenColumns(newHidden)
  }

  const formatValue = (value: any, column: string) => {
    if (value === null || value === undefined) return ""

    const numericColumns = [
      "VLG",
      "VLG_z_DDV",
      "Gotovina_1",
      "Provizija",
      "ODL",
      "ODL_z_DDV",
      "Gotovina_2",
      "Delež_odločba",
      "ZAH1",
      "ZAH1_z_DDV",
      "Gotovina_3",
      "Delež_zah1",
      "ZAH2",
      "ZAH2_z_DDV",
      "Gotovina_4",
      "Delež_zah2",
      "ZAH3",
      "ZAH3_z_DDV",
      "Gotovina_5",
      "Delež_zah3",
      "ZAH4",
      "ZAH4_z_DDV",
      "Gotovina_6",
      "Delež_zah4",
      "ZAH5",
      "ZAH5_z_DDV",
      "Gotovina_7",
      "Delež_zah5",
      "ODL_izplacano",
      "ZAH1_izplacano",
      "ZAH2_izplacano",
      "ZAH3_izplacano",
      "ZAH4_izplacano",
      "ZAH5_izplacano",
      "Izplacano",
      "SKUPAJ",
      "KONTROLA",
    ]

    if (numericColumns.includes(column)) {
      const num = Number(value)
      return isNaN(num) ? "0.00" : `€${num.toFixed(2)}`
    }

    return String(value)
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">
              {demoMode ? "Nalagam demo podatke..." : "Nalagam podatke..."}
            </span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      {/* Table Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Išči stranke..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Stolpci ({visibleColumns.length}/{allColumns.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
              {allColumns.map((column) => (
                <DropdownMenuItem key={column} onClick={() => toggleColumn(column)} className="flex items-center gap-2">
                  {hiddenColumns.has(column) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {column}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Izvozi
          </Button>
          <Button onClick={onRefresh} variant="outline" className="gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            {demoMode ? "Osveži demo" : "Osveži"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {visibleColumns.map((column) => (
                  <th key={column} className="text-left p-4 font-medium text-muted-foreground whitespace-nowrap">
                    {column}
                  </th>
                ))}
                <th className="text-left p-4 font-medium text-muted-foreground sticky right-0 bg-card">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((customer, index) => (
                <tr key={customer.id || index} className="border-b border-border hover:bg-muted/50 transition-colors">
                  {visibleColumns.map((column) => (
                    <td key={column} className="p-4 whitespace-nowrap">
                      {column === "Stranka" ? (
                        <div className="font-medium">{customer[column]}</div>
                      ) : column === "email" ? (
                        <div className="text-primary">{customer[column]}</div>
                      ) : column.includes("Status") ? (
                        <Badge variant="secondary" className="text-xs">
                          {customer[column as keyof Customer] || "N/A"}
                        </Badge>
                      ) : (
                        <div className="text-sm">{formatValue(customer[column as keyof Customer], column)}</div>
                      )}
                    </td>
                  ))}
                  <td className="p-4 sticky right-0 bg-card">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(customer)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Uredi
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Prikazujem {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCustomers.length)} od{" "}
            {filteredCustomers.length} strank
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8"
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
