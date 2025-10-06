// Database connection utilities
import { query } from './db-connection'

export interface Customer {
  id?: number
  Stranka?: string
  Naslov?: string
  Kraj_postna_st?: string
  email?: string
  ID_DDV?: string
  Ukrep?: string
  JR?: string
  Pogodba?: string
  VLG?: number
  VLG_z_DDV?: number
  Gotovina_1?: number
  Status_1?: string
  Racun_izdal_1?: string
  Opomba_Ponudba?: string
  Provizija?: number
  ODL?: number
  ODL_z_DDV?: number
  Gotovina_2?: number
  Status_2?: string
  Racun_izdal_2?: string
  Delež_odločba?: number
  ZAH1?: number
  ZAH1_z_DDV?: number
  Gotovina_3?: number
  Status_3?: string
  Racun_izdal_3?: string
  Delež_zah1?: number
  ZAH2?: number
  ZAH2_z_DDV?: number
  Gotovina_4?: number
  Status_4?: string
  Racun_izdal_4?: string
  Delež_zah2?: number
  ZAH3?: number
  ZAH3_z_DDV?: number
  Gotovina_5?: number
  Status_5?: string
  Racun_izdal_5?: string
  Delež_zah3?: number
  ZAH4?: number
  ZAH4_z_DDV?: number
  Gotovina_6?: number
  Status_6?: string
  Racun_izdal_6?: string
  Delež_zah4?: number
  ZAH5?: number
  ZAH5_z_DDV?: number
  Gotovina_7?: number
  Status_7?: string
  Racun_izdal_7?: string
  Delež_zah5?: number
  Informacije?: string
  ODL_izplacano?: number
  ZAH1_izplacano?: number
  ZAH2_izplacano?: number
  ZAH3_izplacano?: number
  ZAH4_izplacano?: number
  ZAH5_izplacano?: number
  Izplacano?: number
  Status_8?: string
  SKUPAJ?: number
  KONTROLA?: number
}

export interface InvoiceItem {
  description: string
  quantity: number
  price: number
  total: number
}

export interface Invoice {
  id?: string
  invoiceNumber: string
  customer: Customer
  items: InvoiceItem[]
  serviceDescription: string
  issueDate: string
  dueDate: string
  serviceDate: string
  totalWithoutVat: number
  vat: number
  totalPayable: number
}

// API functions
export async function fetchCustomers(): Promise<Customer[]> {
  try {
    const response = await fetch("/api/customers")
    if (!response.ok) {
      throw new Error("Failed to fetch customers")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching customers:", error)
    // Return mock data if API fails
    return [
      {
        id: 1,
        Stranka: "Podjetje ABC d.o.o.",
        Naslov: "Glavna cesta 123",
        Kraj_postna_st: "1000 Ljubljana",
        email: "info@abc.si",
        ID_DDV: "SI12345678",
        VLG: 1500.0,
        Provizija: 150.0,
      },
      {
        id: 2,
        Stranka: "XYZ Storitve s.p.",
        Naslov: "Tržaška 45",
        Kraj_postna_st: "2000 Maribor",
        email: "kontakt@xyz.si",
        ID_DDV: "SI87654321",
        VLG: 2300.0,
        Provizija: 230.0,
      },
    ]
  }
}

export async function createCustomer(customer: Customer): Promise<Customer> {
  try {
    const response = await fetch("/api/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customer),
    })

    if (!response.ok) {
      throw new Error("Failed to create customer")
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating customer:", error)
    throw error
  }
}

export async function updateCustomer(id: number, customer: Customer): Promise<Customer> {
  try {
    const response = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customer),
    })

    if (!response.ok) {
      throw new Error("Failed to update customer")
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating customer:", error)
    throw error
  }
}
