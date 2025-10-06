"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X, ArrowUpDown } from "lucide-react"

interface Customer {
  id?: number
  Stranka: string
  Naslov: string
  Kraj_postna_st: string
  email: string
  ID_DDV: string
  Ukrep: string
  JR: string
  Pogodba: string
  VLG: number
  VLG_z_DDV: number
  Gotovina_1: number
  Status_1: string
  Racun_izdal_1: string
  Opomba_Ponudba: string
  Provizija: number
  ODL: number
  ODL_z_DDV: number
  Gotovina_2: number
  Status_2: string
  Racun_izdal_2: string
  Delež_odločba: number
  ZAH1: number
  ZAH1_z_DDV: number
  Gotovina_3: number
  Status_3: string
  Racun_izdal_3: string
  Delež_zah1: number
  ZAH2: number
  ZAH2_z_DDV: number
  Gotovina_4: number
  Status_4: string
  Racun_izdal_4: string
  Delež_zah2: number
  ZAH3: number
  ZAH3_z_DDV: number
  Gotovina_5: number
  Status_5: string
  Racun_izdal_5: string
  Delež_zah3: number
  ZAH4: number
  ZAH4_z_DDV: number
  Gotovina_6: number
  Status_6: string
  Racun_izdal_6: string
  Delež_zah4: number
  ZAH5: number
  ZAH5_z_DDV: number
  Gotovina_7: number
  Status_7: string
  Racun_izdal_7: string
  Delež_zah5: number
  Informacije: string
  ODL_izplacano: number
  ZAH1_izplacano: number
  ZAH2_izplacano: number
  ZAH3_izplacano: number
  ZAH4_izplacano: number
  ZAH5_izplacano: number
  Izplacano: number
  Status_8: string
  SKUPAJ: number
  KONTROLA: number
}

const columns = [
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

const numericFields = [
  "VLG",
  "VLG_z_DDV",
  "Gotovina_1",
  "Gotovina_2",
  "Gotovina_3",
  "Gotovina_4",
  "Gotovina_5",
  "Gotovina_6",
  "Gotovina_7",
  "Provizija",
  "ODL",
  "ODL_z_DDV",
  "ODL_izplacano",
  "Delež_odločba",
  "Delež_zah1",
  "Delež_zah2",
  "Delež_zah3",
  "Delež_zah4",
  "Delež_zah5",
  "ZAH1",
  "ZAH1_z_DDV",
  "ZAH1_izplacano",
  "ZAH2",
  "ZAH2_z_DDV",
  "ZAH2_izplacano",
  "ZAH3",
  "ZAH3_z_DDV",
  "ZAH3_izplacano",
  "ZAH4",
  "ZAH4_z_DDV",
  "ZAH4_izplacano",
  "ZAH5",
  "ZAH5_z_DDV",
  "ZAH5_izplacano",
  "Izplacano",
  "SKUPAJ",
]

const formulaFields = ["ODL", "ZAH1", "ZAH2", "ZAH3", "ZAH4", "ZAH5"]

const ddvMap: Record<string, string> = {
  VLG: "VLG_z_DDV",
  ODL: "ODL_z_DDV",
  ZAH1: "ZAH1_z_DDV",
  ZAH2: "ZAH2_z_DDV",
  ZAH3: "ZAH3_z_DDV",
  ZAH4: "ZAH4_z_DDV",
  ZAH5: "ZAH5_z_DDV",
}

// Debounce funkcija za zamudo iskanja
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [formData, setFormData] = useState<Partial<Customer>>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [apiError, setApiError] = useState(false)
  const [autocompleteData, setAutocompleteData] = useState<Customer[]>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteIndex, setAutocompleteIndex] = useState(-1)
  const autocompleteRef = useRef<HTMLDivElement>(null)
  const [fieldAutocompleteIndex, setFieldAutocompleteIndex] = useState(-1)

  const [formulaInputs, setFormulaInputs] = useState<Record<string, string>>({})

  const [fieldAutocomplete, setFieldAutocomplete] = useState<{
    show: boolean
    field: string
    suggestions: string[]
    inputRef: HTMLInputElement | null
  }>({
    show: false,
    field: "",
    suggestions: [],
    inputRef: null,
  })

  // Dodani state-ji za filtre in iskanje
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300) // Povečal na 300ms za boljše uporabniško izkušnjo
  const [filters, setFilters] = useState({
    status: "",
    minAmount: "",
    maxAmount: "",
    hasEmail: false,
    hasContract: false,
  })
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Ref za sledenje iskalnemu polju in ohranjanje fokusa
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Ref za sledenje vnosnim poljem
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Popravljen seznam imen polj za avtomatsko dopolnjevanje formul
  const fieldNames = [
    "vlg", "odl", "zah1", "zah2", "zah3", "zah4", "zah5", 
    "delez", "gotovina", "provizija", "skupaj", "kontrola",
    "vlg_z_ddv", "odl_z_ddv", "zah1_z_ddv", "zah2_z_ddv", 
    "zah3_z_ddv", "zah4_z_ddv", "zah5_z_ddv",
    "gotovina_1", "gotovina_2", "gotovina_3", "gotovina_4", 
    "gotovina_5", "gotovina_6", "gotovina_7",
    "delez_odlocba", "delez_zah1", "delez_zah2", "delez_zah3", 
    "delez_zah4", "delez_zah5",
    "odl_izplacano", "zah1_izplacano", "zah2_izplacano", 
    "zah3_izplacano", "zah4_izplacano", "zah5_izplacano", "izplacano"
  ]

  useEffect(() => {
    loadCustomers()
  }, [])

  // Ohrani fokus na iskalnem polju ob renderju
  // useEffect(() => {
  //   if (searchInputRef.current) {
  //     searchInputRef.current.focus();
  //   }
  // }, [searchTerm, showFilters]);

  const loadCustomers = async () => {
    try {
      const response = await fetch("/api/customers")
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
        setAutocompleteData(data)
        setApiError(false)
      } else {
        throw new Error("API not available")
      }
    } catch (error) {
      console.error("Error loading customers:", error)
      setApiError(true)
      // Demo podatki
      const mockData: Customer[] = [
        {
          id: 1,
          Stranka: "Podjetje d.o.o.",
          Naslov: "Glavna cesta 1",
          Kraj_postna_st: "1000 Ljubljana",
          email: "info@podjetje.si",
          ID_DDV: "SI12345678",
          Ukrep: "Svetovanje",
          JR: "JR001",
          Pogodba: "P001",
          VLG: 1000,
          VLG_z_DDV: 1220,
          Gotovina_1: 500,
          Status_1: "Plačano",
          Racun_izdal_1: "DA",
          Opomba_Ponudba: "Prva ponudba",
          Provizija: 0.15,
          ODL: 800,
          ODL_z_DDV: 976,
          Gotovina_2: 400,
          Status_2: "V obdelavi",
          Racun_izdal_2: "NE",
          Delež_odločba: 0.8,
          ZAH1: 600,
          ZAH1_z_DDV: 732,
          Gotovina_3: 300,
          Status_3: "Čaka",
          Racun_izdal_3: "NE",
          Delež_zah1: 0.6,
          ZAH2: 400,
          ZAH2_z_DDV: 488,
          Gotovina_4: 200,
          Status_4: "Novo",
          Racun_izdal_4: "NE",
          Delež_zah2: 0.4,
          ZAH3: 300,
          ZAH3_z_DDV: 366,
          Gotovina_5: 150,
          Status_5: "Novo",
          Racun_izdal_5: "NE",
          Delež_zah3: 0.3,
          ZAH4: 200,
          ZAH4_z_DDV: 244,
          Gotovina_6: 100,
          Status_6: "Novo",
          Racun_izdal_6: "NE",
          Delež_zah4: 0.2,
          ZAH5: 100,
          ZAH5_z_DDV: 122,
          Gotovina_7: 50,
          Status_7: "Novo",
          Racun_izdal_7: "NE",
          Delež_zah5: 0.1,
          Informacije: "Pomemben stranka",
          ODL_izplacano: 400,
          ZAH1_izplacano: 300,
          ZAH2_izplacano: 200,
          ZAH3_izplacano: 150,
          ZAH4_izplacano: 100,
          ZAH5_izplacano: 50,
          Izplacano: 1200,
          Status_8: "Aktivno",
          SKUPAJ: 2400,
          KONTROLA: 1180,
        },
      ]
      setCustomers(mockData)
      setAutocompleteData(mockData)
    }
  }

  // Optimizirana funkcija za spremembo iskanja
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  // Optimizirane funkcije za filtre
  const handleFilterChange = useCallback((key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev)
  }, [])

  const handleResetFilters = useCallback(() => {
    setSearchTerm("")
    setFilters({
      status: "",
      minAmount: "",
      maxAmount: "",
      hasEmail: false,
      hasContract: false,
    })
    setSortConfig(null)
  }, [])

  // Filtriranje in sortiranje podatkov z uporabo debounced search term
  const filteredAndSortedCustomers = useMemo(() => {
    let result = [...customers]

    // Iskanje po vseh poljih z debounced search term
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase()
      result = result.filter(customer => 
        Object.values(customer).some(value => 
          value?.toString().toLowerCase().includes(term)
        )
      )
    }

    // Filtri
    if (filters.status) {
      result = result.filter(customer => 
        Object.entries(customer).some(([key, value]) => 
          key.startsWith('Status_') && value === filters.status
        )
      )
    }

    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount)
      result = result.filter(customer => 
        customer.SKUPAJ >= min
      )
    }

    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount)
      result = result.filter(customer => 
        customer.SKUPAJ <= max
      )
    }

    if (filters.hasEmail) {
      result = result.filter(customer => 
        customer.email && customer.email.length > 0
      )
    }

    if (filters.hasContract) {
      result = result.filter(customer => 
        customer.Pogodba && customer.Pogodba.length > 0
      )
    }

    // Sortiranje
    if (sortConfig !== null) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Customer]
        const bValue = b[sortConfig.key as keyof Customer]

        if (aValue === bValue) return 0
        
        if (sortConfig.direction === 'asc') {
          return aValue < bValue ? -1 : 1
        } else {
          return aValue > bValue ? -1 : 1
        }
      })
    }

    return result
  }, [customers, debouncedSearchTerm, filters, sortConfig])

  // Funkcija za sortiranje
  const handleSort = useCallback((key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  // Pridobi unikatne statuse za filter
  const statusOptions = useMemo(() => {
    const statuses = new Set<string>()
    customers.forEach(customer => {
      Object.entries(customer).forEach(([key, value]) => {
        if (key.startsWith('Status_') && value) {
          statuses.add(value as string)
        }
      })
    })
    return Array.from(statuses).sort()
  }, [customers])

  // Popravljena funkcija za izračun formul
  const calculateFormula = (formula: string, currentData: Partial<Customer>) => {
    try {
      if (!formula || formula.trim() === "") {
        return 0
      }

      const fieldMap: Record<string, number> = {}

      numericFields.forEach((field) => {
        const value = Number(currentData[field as keyof Customer]) || 0
        fieldMap[field.toLowerCase()] = value
      })

      let expression = formula.toLowerCase()

      Object.keys(fieldMap).forEach((fieldName) => {
        const regex = new RegExp(`\\b${fieldName}\\b`, "g")
        if (expression.includes(fieldName)) {
          expression = expression.replace(regex, fieldMap[fieldName].toString())
        }
      })

      if (/^-?\d*\.?\d+$/.test(expression.trim())) {
        return parseFloat(expression)
      }

      if (!/^[0-9+\-*/(). ]+$/.test(expression)) {
        return null
      }

      const result = eval(expression)
      return isNaN(result) ? 0 : Number(result.toFixed(2))
    } catch (error) {
      return null
    }
  }

  // Popravljena funkcija za avtomatsko dopolnjevanje polj
  const handleFieldAutocomplete = (field: string, value: string, inputElement: HTMLInputElement) => {
    const cursorPosition = inputElement.selectionStart || 0
    const textBeforeCursor = value.substring(0, cursorPosition)
    
    const words = textBeforeCursor.split(/[\s+\-*/()]+/)
    const lastWord = words[words.length - 1] || ""

    if (lastWord.length > 0) {
      const suggestions = fieldNames.filter((name) => 
        name.toLowerCase().includes(lastWord.toLowerCase())
      ).slice(0, 5)

      if (suggestions.length > 0) {
        setFieldAutocomplete({
          show: true,
          field,
          suggestions,
          inputRef: inputElement,
        })
      } else {
        setFieldAutocomplete((prev) => ({ ...prev, show: false }))
      }
    } else {
      setFieldAutocomplete((prev) => ({ ...prev, show: false }))
    }
  }

  // Popravljena funkcija za izbiro predloge
  const selectFieldSuggestion = (suggestion: string) => {
    if (!fieldAutocomplete.inputRef) return

    const input = fieldAutocomplete.inputRef
    const cursorPosition = input.selectionStart || 0
    const value = input.value
    const textBeforeCursor = value.substring(0, cursorPosition)
    const textAfterCursor = value.substring(cursorPosition)

    const words = textBeforeCursor.split(/[\s+\-*/()]+/)
    const lastWord = words[words.length - 1] || ""
    const beforeLastWord = textBeforeCursor.substring(0, textBeforeCursor.length - lastWord.length)

    const newValue = beforeLastWord + suggestion + " " + textAfterCursor

    setFormulaInputs((prev) => ({ ...prev, [fieldAutocomplete.field]: newValue }))
    
    input.value = newValue

    const event = new Event("input", { bubbles: true })
    input.dispatchEvent(event)

    const newCursorPos = beforeLastWord.length + suggestion.length + 1
    setTimeout(() => {
      input.setSelectionRange(newCursorPos, newCursorPos)
      input.focus()
      
      const result = calculateFormula(newValue, formData)
      if (result !== null) {
        const updatedData = { ...formData }
        updatedData[fieldAutocomplete.field as keyof Customer] = result as any
        const finalData = updateCalculations(updatedData)
        setFormData(finalData)
      }
    }, 10)
    
    setFieldAutocomplete((prev) => ({ ...prev, show: false }))
  }

  // Funkcija za pridobivanje pozicije dropdowna
  const getDropdownPosition = () => {
    if (!fieldAutocomplete.inputRef) return { top: 0, left: 0 }
    
    const rect = fieldAutocomplete.inputRef.getBoundingClientRect()
    return {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width
    }
  }

  // Popravljena funkcija za obdelavo sprememb vnosa
  const handleInputChange = (field: string, value: string) => {
    const updatedData = { ...formData }

    if (numericFields.includes(field)) {
      if (formulaFields.includes(field)) {
        setFormulaInputs((prev) => ({ ...prev, [field]: value }))

        const result = calculateFormula(value, updatedData)
        if (result !== null) {
          updatedData[field as keyof Customer] = result as any
        }
      } else {
        updatedData[field as keyof Customer] = Number(value) || (0 as any)
      }
    } else {
      updatedData[field as keyof Customer] = value as any
    }

    const finalData = updateCalculations(updatedData)
    setFormData(finalData)
  }

  const handleFormulaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: string) => {
    if (fieldAutocomplete.show) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setFieldAutocompleteIndex((prev) => 
          prev < fieldAutocomplete.suggestions.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setFieldAutocompleteIndex((prev) => 
          prev > 0 ? prev - 1 : fieldAutocomplete.suggestions.length - 1
        )
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        if (fieldAutocompleteIndex >= 0) {
          selectFieldSuggestion(fieldAutocomplete.suggestions[fieldAutocompleteIndex])
        } else if (fieldAutocomplete.suggestions.length > 0) {
          selectFieldSuggestion(fieldAutocomplete.suggestions[0])
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        setFieldAutocomplete((prev) => ({ ...prev, show: false }))
        setFieldAutocompleteIndex(-1)
        e.currentTarget.blur()
      }
    } else if (e.key === "Enter") {
      e.preventDefault()
      const value = e.currentTarget.value
      const result = calculateFormula(value, formData)
      if (result !== null) {
        const updatedData = { ...formData }
        updatedData[field as keyof Customer] = result as any
        const finalData = updateCalculations(updatedData)
        setFormData(finalData)
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      setFieldAutocomplete((prev) => ({ ...prev, show: false }))
      e.currentTarget.blur()
    }
  }

  // Popravljena funkcija za posodobitev izračunov
  const updateCalculations = (data: Partial<Customer>) => {
    const updatedData = { ...data }

    Object.keys(ddvMap).forEach((baseField) => {
      const ddvField = ddvMap[baseField]
      const baseValue = Number(updatedData[baseField as keyof Customer]) || 0
      updatedData[ddvField as keyof Customer] = Number((baseValue * 1.22).toFixed(2)) as any
    })

    const skupaj = formulaFields.reduce((acc, field) => {
      const value = Number(updatedData[field as keyof Customer]) || 0
      return acc + value
    }, 0)
    updatedData.SKUPAJ = Number(skupaj.toFixed(2))

    const izplacanoFields = [
      "ODL_izplacano", "ZAH1_izplacano", "ZAH2_izplacano", 
      "ZAH3_izplacano", "ZAH4_izplacano", "ZAH5_izplacano"
    ]
    const izplacano = izplacanoFields.reduce((acc, field) => {
      const value = Number(updatedData[field as keyof Customer]) || 0
      return acc + value
    }, 0)
    updatedData.Izplacano = Number(izplacano.toFixed(2))

    const vlg = Number(updatedData.VLG) || 0
    const provizija = Number(updatedData.Provizija) || 0
    updatedData.KONTROLA = Number((vlg + izplacano * provizija).toFixed(2))

    return updatedData
  }

  // Funkcija za avtomatsko dopolnjevanje strank
  const handleCustomerAutocomplete = (value: string) => {
    setFormData((prev) => ({ ...prev, Stranka: value }))

    if (value.length > 1) {
      const filtered = customers.filter((customer) => 
        customer.Stranka?.toLowerCase().includes(value.toLowerCase())
      )
      setAutocompleteData(filtered.slice(0, 5))
      setShowAutocomplete(filtered.length > 0)
      setAutocompleteIndex(-1)
    } else {
      setShowAutocomplete(false)
    }
  }

  // Funkcija za izbiro stranke
  const selectCustomer = (customer: Customer) => {
    const updatedData = {
      ...formData,
      Stranka: customer.Stranka,
      Naslov: customer.Naslov || "",
      Kraj_postna_st: customer.Kraj_postna_st || "",
      email: customer.email || "",
      ID_DDV: customer.ID_DDV || "",
    }
    setFormData(updatedData)
    setShowAutocomplete(false)
    setAutocompleteIndex(-1)
  }

  // Funkcija za navigacijo pri avtomatskem dopolnjevanju
  const handleCustomerKeyDown = (e: React.KeyboardEvent) => {
    if (!showAutocomplete) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setAutocompleteIndex((prev) => 
          prev < autocompleteData.length - 1 ? prev + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setAutocompleteIndex((prev) => 
          prev > 0 ? prev - 1 : autocompleteData.length - 1
        )
        break
      case "Enter":
        e.preventDefault()
        if (autocompleteIndex >= 0 && autocompleteData[autocompleteIndex]) {
          selectCustomer(autocompleteData[autocompleteIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        setShowAutocomplete(false)
        setAutocompleteIndex(-1)
        ;(e.currentTarget as HTMLInputElement).blur()
        break
    }
  }

  const handleSubmit = async () => {
    try {
      const finalData = updateCalculations(formData)

      if (editingId) {
        const response = await fetch(`/api/customers/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...finalData, id: editingId }),
        })

        if (response.ok) {
          setCustomers((prev) => prev.map((c) => (c.id === editingId ? { ...finalData, id: editingId } as Customer : c)))
          setEditingId(null)
        }
      } else {
        const response = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalData),
        })

        if (response.ok) {
          const newCustomer = await response.json()
          setCustomers((prev) => [...prev, newCustomer])
        }
      }

      setFormData({})
      setFormulaInputs({})
      alert(editingId ? "Stranka uspešno posodobljena!" : "Stranka uspešno dodana!")
    } catch (error) {
      console.error("Error saving customer:", error)
      alert("Napaka pri shranjevanju stranke")
    }
  }

  const handleEdit = (customer: Customer) => {
    setFormData(customer)
    setEditingId(customer.id || null)
    
    const formulaValues: Record<string, string> = {}
    formulaFields.forEach(field => {
      formulaValues[field] = String(customer[field as keyof Customer] || "")
    })
    setFormulaInputs(formulaValues)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Ali ste prepričani, da želite izbrisati to stranko?")) {
      try {
        await fetch(`/api/customers/${id}`, { method: "DELETE" })
        setCustomers((prev) => prev.filter((c) => c.id !== id))
        alert("Stranka uspešno izbrisana!")
      } catch (error) {
        console.error("Error deleting customer:", error)
        alert("Napaka pri brisanju stranke")
      }
    }
  }

  // Komponenta za prikaz dropdown menija
  const AutocompleteDropdown = () => {
    if (!fieldAutocomplete.show || !fieldAutocomplete.inputRef) return null

    return (
      <div
        className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto"
        style={{ top: "100%", left: 0, width: "100%", minWidth: "200px" }}
      >
        {fieldAutocomplete.suggestions.map((suggestion, index) => (
          <div
            key={suggestion}
            className={`p-2 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm ${
              index === fieldAutocompleteIndex ? "bg-blue-100" : "hover:bg-gray-100"
            }`}
            onClick={() => selectFieldSuggestion(suggestion)}
            onMouseEnter={() => setFieldAutocompleteIndex(index)}
          >
            {suggestion}
          </div>
        ))}
      </div>
    )
  }

  // Komponenta za filtre in iskanje - OPTIMIZIRANA
  const FiltersAndSearch = () => {
    return (
      <div className="mb-6 space-y-4">
        {/* Iskalna vrstica */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              ref={searchInputRef}
              placeholder="Išči po vseh podatkih..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-10"
              // Samo ob prvem renderju ali brez avtomatskega fokusa
              autoFocus={false}
            />
            {searchTerm && (
              <X 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 cursor-pointer" 
                onClick={() => {
                  setSearchTerm("")
                  // Opcijsko: postavi fokus nazaj na iskalno polje ob brisanju
                  searchInputRef.current?.focus()
                }} 
              />
            )}
          </div>
          {/* Ostali elementi ostanejo nespremenjeni */}
          <Button variant="outline" onClick={toggleFilters} className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtri
            {Object.values(filters).some(val => val !== "" && val !== false) && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                !
              </Badge>
            )}
          </Button>
          <Button variant="outline" onClick={handleResetFilters}>
            Počisti
          </Button>
        </div>

        {/* Področje s filtri */}
        {showFilters && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filter po statusu */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select 
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Vsi statusi</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Filter po znesku */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Znesek od</label>
                <Input
                  type="number"
                  placeholder="Min znesek"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Znesek do</label>
                <Input
                  type="number"
                  placeholder="Max znesek"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                />
              </div>

              {/* Checkbox filtri */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Dodatni filtri</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.hasEmail}
                      onChange={(e) => handleFilterChange('hasEmail', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Samo z emailom</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.hasContract}
                      onChange={(e) => handleFilterChange('hasContract', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Samo s pogodbo</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informacije o rezultatih */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Prikazano {filteredAndSortedCustomers.length} od {customers.length} strank
            {debouncedSearchTerm && (
              <span> za iskalni niz "{debouncedSearchTerm}"</span>
            )}
          </div>
          
          {sortConfig && (
            <div className="text-sm text-gray-600">
              Sortirano po: {sortConfig.key} ({sortConfig.direction === 'asc' ? 'naraščajoče' : 'padajoče'})
            </div>
          )}
        </div>
      </div>
    )
  }

  // Komponenta za prikaz tabele s podatki - OPTIMIZIRANA
  const DataTable = () => {
    return (
      <div className="overflow-x-auto mt-6">
        <table className="w-full border-collapse border border-gray-300" style={{ minWidth: '1500px' }}>
          <thead>
            <tr className="bg-gray-100">
              {columns.map((col) => (
                <th key={col} className="border border-gray-300 p-2 text-left text-sm font-medium min-w-[120px]">
                  <div 
                    className="flex items-center gap-1 cursor-pointer hover:bg-gray-200 p-1 rounded"
                    onClick={() => handleSort(col)}
                  >
                    {col}
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
              ))}
              <th className="border border-gray-300 p-2 text-left text-sm font-medium sticky right-0 bg-gray-100">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="border border-gray-300 p-2 text-sm">
                    {numericFields.includes(col)
                      ? Number(customer[col as keyof Customer] || 0).toFixed(2)
                      : customer[col as keyof Customer] || ""}
                  </td>
                ))}
                <td className="border border-gray-300 p-2 sticky right-0 bg-white">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(customer)}>
                      Uredi
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => customer.id && handleDelete(customer.id)}
                    >
                      Izbriši
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredAndSortedCustomers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Ni strank, ki bi ustrezale iskalnim kriterijem
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {apiError && (
        <Alert>
          <AlertDescription>
            Deluje v demo načinu - baza podatkov ni povezana. Podatki se ne bodo shranili.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingId ? "Uredi stranko" : "Dodaj novo stranko"}
            {editingId && <Badge variant="secondary">ID: {editingId}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Osnovni podatki</TabsTrigger>
              <TabsTrigger value="contract">Pogodba</TabsTrigger>
              <TabsTrigger value="vlg">VLG & Provizija</TabsTrigger>
              <TabsTrigger value="odl">Odločba</TabsTrigger>
              <TabsTrigger value="zahtevki">Zahtevki</TabsTrigger>
              <TabsTrigger value="summary">Povzetek</TabsTrigger>
            </TabsList>

            {/* Ostala vsebina zavihkov ostaja enaka ... */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stranka *</label>
                  <div className="relative" ref={autocompleteRef}>
                    <Input
                      value={formData.Stranka || ""}
                      onChange={(e) => handleCustomerAutocomplete(e.target.value)}
                      onKeyDown={handleCustomerKeyDown}
                      placeholder="Vnesite ime stranke..."
                      className="w-full"
                      autoComplete="off"
                    />
                    {showAutocomplete && autocompleteData.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {autocompleteData.map((customer, index) => (
                          <div
                            key={customer.id}
                            className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              index === autocompleteIndex ? "bg-blue-100" : "hover:bg-gray-100"
                            }`}
                            onClick={() => selectCustomer(customer)}
                            onMouseEnter={() => setAutocompleteIndex(index)}
                          >
                            <div className="font-medium text-sm">{customer.Stranka}</div>
                            <div className="text-xs text-gray-600">
                              {customer.Naslov} • {customer.ID_DDV}
                            </div>
                            <div className="text-xs text-gray-500">{customer.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ID DDV</label>
                  <Input
                    value={formData.ID_DDV || ""}
                    onChange={(e) => handleInputChange("ID_DDV", e.target.value)}
                    placeholder="SI12345678"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Naslov</label>
                  <Input
                    value={formData.Naslov || ""}
                    onChange={(e) => handleInputChange("Naslov", e.target.value)}
                    placeholder="Glavna cesta 1"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Kraj in poštna številka</label>
                  <Input
                    value={formData.Kraj_postna_st || ""}
                    onChange={(e) => handleInputChange("Kraj_postna_st", e.target.value)}
                    placeholder="1000 Ljubljana"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="info@podjetje.si"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Informacije</label>
                  <Input
                    value={formData.Informacije || ""}
                    onChange={(e) => handleInputChange("Informacije", e.target.value)}
                    placeholder="Dodatne informacije..."
                  />
                </div>
              </div>
            </TabsContent>

            {/* Ostali tabovi ostanejo nespremenjeni ... */}
            <TabsContent value="contract" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ukrep</label>
                  <Input
                    value={formData.Ukrep || ""}
                    onChange={(e) => handleInputChange("Ukrep", e.target.value)}
                    placeholder="Vrsta ukrepa"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">JR</label>
                  <Input
                    value={formData.JR || ""}
                    onChange={(e) => handleInputChange("JR", e.target.value)}
                    placeholder="JR številka"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Pogodba</label>
                  <Input
                    value={formData.Pogodba || ""}
                    onChange={(e) => handleInputChange("Pogodba", e.target.value)}
                    placeholder="Številka pogodbe"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Opomba/Ponudba</label>
                  <Input
                    value={formData.Opomba_Ponudba || ""}
                    onChange={(e) => handleInputChange("Opomba_Ponudba", e.target.value)}
                    placeholder="Opombe ali ponudba"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vlg" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">VLG</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.VLG || ""}
                    onChange={(e) => handleInputChange("VLG", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">VLG z DDV</label>
                  <Input value={formData.VLG_z_DDV || ""} readOnly className="bg-gray-100" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Provizija</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.Provizija || ""}
                    onChange={(e) => handleInputChange("Provizija", e.target.value)}
                    placeholder="0.15"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Gotovina 1</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.Gotovina_1 || ""}
                    onChange={(e) => handleInputChange("Gotovina_1", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status 1</label>
                  <Input
                    value={formData.Status_1 || ""}
                    onChange={(e) => handleInputChange("Status_1", e.target.value)}
                    placeholder="Status"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Račun izdal 1</label>
                  <Input
                    value={formData.Racun_izdal_1 || ""}
                    onChange={(e) => handleInputChange("Racun_izdal_1", e.target.value)}
                    placeholder="DA/NE"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="odl" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ODL (formula)</label>
                  <div className="relative">
                    <Input
                      value={formulaInputs.ODL || ""}
                      onChange={(e) => {
                        handleInputChange("ODL", e.target.value)
                        handleFieldAutocomplete("ODL", e.target.value, e.target)
                      }}
                      onKeyDown={(e) => handleFormulaKeyDown(e, "ODL")}
                      onBlur={() => setFieldAutocomplete((prev) => ({ ...prev, show: false }))}
                      placeholder="npr. vlg * 0.8"
                      data-field="ODL"
                      autoComplete="off"
                    />
                    {fieldAutocomplete.show && fieldAutocomplete.field === "ODL" && (
                      <AutocompleteDropdown />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ODL z DDV</label>
                  <Input value={formData.ODL_z_DDV || ""} readOnly className="bg-gray-100" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Delež odločba</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.Delež_odločba || ""}
                    onChange={(e) => handleInputChange("Delež_odločba", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Gotovina 2</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.Gotovina_2 || ""}
                    onChange={(e) => handleInputChange("Gotovina_2", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status 2</label>
                  <Input
                    value={formData.Status_2 || ""}
                    onChange={(e) => handleInputChange("Status_2", e.target.value)}
                    placeholder="Status"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Račun izdal 2</label>
                  <Input
                    value={formData.Racun_izdal_2 || ""}
                    onChange={(e) => handleInputChange("Racun_izdal_2", e.target.value)}
                    placeholder="DA/NE"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ODL izplačano</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.ODL_izplacano || ""}
                    onChange={(e) => handleInputChange("ODL_izplacano", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="zahtevki" className="space-y-6">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-4">Zahtevek {num}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">ZAH{num} (formula)</label>
                      <div className="relative">
                        <Input
                          value={formulaInputs[`ZAH${num}`] || ""}
                          onChange={(e) => {
                            handleInputChange(`ZAH${num}`, e.target.value)
                            handleFieldAutocomplete(`ZAH${num}`, e.target.value, e.target)
                          }}
                          onKeyDown={(e) => handleFormulaKeyDown(e, `ZAH${num}`)}
                          onBlur={() => setFieldAutocomplete((prev) => ({ ...prev, show: false }))}
                          placeholder={`npr. vlg * 0.${7 - num}`}
                          data-field={`ZAH${num}`}
                          autoComplete="off"
                        />
                        {fieldAutocomplete.show && fieldAutocomplete.field === `ZAH${num}` && (
                          <AutocompleteDropdown />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">ZAH{num} z DDV</label>
                      <Input 
                        value={formData[`ZAH${num}_z_DDV` as keyof Customer] || ""} 
                        readOnly 
                        className="bg-gray-100" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Delež zah{num}</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData[`Delež_zah${num}` as keyof Customer] || ""}
                        onChange={(e) => handleInputChange(`Delež_zah${num}`, e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">ZAH{num} izplačano</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData[`ZAH${num}_izplacano` as keyof Customer] || ""}
                        onChange={(e) => handleInputChange(`ZAH${num}_izplacano`, e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Gotovina {num + 2}</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData[`Gotovina_${num + 2}` as keyof Customer] || ""}
                        onChange={(e) => handleInputChange(`Gotovina_${num + 2}`, e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status {num + 2}</label>
                      <Input
                        value={formData[`Status_${num + 2}` as keyof Customer] || ""}
                        onChange={(e) => handleInputChange(`Status_${num + 2}`, e.target.value)}
                        placeholder="Status"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Račun izdal {num + 2}</label>
                      <Input
                        value={formData[`Racun_izdal_${num + 2}` as keyof Customer] || ""}
                        onChange={(e) => handleInputChange(`Racun_izdal_${num + 2}`, e.target.value)}
                        placeholder="DA/NE"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Skupaj</label>
                  <Input value={formData.SKUPAJ || ""} readOnly className="bg-gray-100 font-medium" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Izplačano</label>
                  <Input value={formData.Izplacano || ""} readOnly className="bg-gray-100" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Kontrola</label>
                  <Input value={formData.KONTROLA || ""} readOnly className="bg-gray-100" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status 8</label>
                  <Input
                    value={formData.Status_8 || ""}
                    onChange={(e) => handleInputChange("Status_8", e.target.value)}
                    placeholder="Skupni status"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-4 mt-6">
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              {editingId ? "Posodobi stranko" : "Dodaj stranko"}
            </Button>
            {editingId && (
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({})
                  setEditingId(null)
                  setFormulaInputs({})
                }}
              >
                Prekliči urejanje
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seznam strank</CardTitle>
        </CardHeader>
        <CardContent>
          <FiltersAndSearch />
          <DataTable />
        </CardContent>
      </Card>
    </div>
  )
}