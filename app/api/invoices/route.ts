// app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-connection'

// GET - pridobi vse račune (OPTIMIZIRANO!)
export async function GET() {
  try {
    // ✅ EN SAM QUERY z JOIN namesto N+1
    const result = await query(`
      SELECT 
        i.id,
        i.invoice_number,
        i.customer_id,
        i.service_description,
        i.issue_date,
        i.due_date,
        i.service_date,
        i.total_without_vat,
        i.vat,
        i.total_payable,
        i.status,
        i.created_at,
        i.updated_at,
        s.Stranka,
        s.Naslov,
        s.Kraj_postna_st,
        s.email,
        s.ID_DDV,
        ii.id as item_id,
        ii.description as item_description,
        ii.quantity as item_quantity,
        ii.price as item_price,
        ii.total as item_total
      FROM Invoices i
      LEFT JOIN Stranka s ON i.customer_id = s.id
      LEFT JOIN InvoiceItems ii ON i.id = ii.invoice_id
      ORDER BY i.created_at DESC, ii.id ASC
    `)

    // Preoblikuj rezultate v pravilno strukturo
    const invoicesMap = new Map()
    
    result.forEach((row: any) => {
      if (!invoicesMap.has(row.id)) {
        invoicesMap.set(row.id, {
          id: row.id.toString(),
          invoiceNumber: row.invoice_number,
          customer: {
            id: row.customer_id,
            Stranka: row.Stranka,
            Naslov: row.Naslov,
            Kraj_postna_st: row.Kraj_postna_st,
            email: row.email,
            ID_DDV: row.ID_DDV,
          },
          items: [],
          serviceDescription: row.service_description,
          issueDate: row.issue_date,
          dueDate: row.due_date,
          serviceDate: row.service_date,
          totalWithoutVat: parseFloat(row.total_without_vat),
          vat: parseFloat(row.vat),
          totalPayable: parseFloat(row.total_payable),
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })
      }
      
      // Dodaj item če obstaja
      if (row.item_id) {
        invoicesMap.get(row.id).items.push({
          description: row.item_description,
          quantity: parseFloat(row.item_quantity),
          price: parseFloat(row.item_price),
          total: parseFloat(row.item_total),
        })
      }
    })

    return NextResponse.json(Array.from(invoicesMap.values()))
  } catch (error) {
    console.error('Napaka pri pridobivanju računov:', error)
    return NextResponse.json(
      { error: 'Napaka pri pridobivanju računov' },
      { status: 500 }
    )
  }
}

// POST ostane enak - ne spreminjaj!
export async function POST(request: NextRequest) {
  try {
    const invoice = await request.json()

    const existing = await query(
      'SELECT id FROM Invoices WHERE invoice_number = ?',
      [invoice.invoiceNumber]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Račun s to številko že obstaja' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO Invoices (
        invoice_number, customer_id, service_description,
        issue_date, due_date, service_date,
        total_without_vat, vat, total_payable, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        invoice.invoiceNumber,
        invoice.customer.id,
        invoice.serviceDescription || '',
        invoice.issueDate,
        invoice.dueDate,
        invoice.serviceDate,
        invoice.totalWithoutVat,
        invoice.vat,
        invoice.totalPayable,
      ]
    )

    const invoiceId = result.insertId

    for (const item of invoice.items) {
      await query(
        `INSERT INTO InvoiceItems (
          invoice_id, description, quantity, price, total
        ) VALUES (?, ?, ?, ?, ?)`,
        [invoiceId, item.description, item.quantity, item.price, item.total]
      )
    }

    return NextResponse.json({
      ...invoice,
      id: invoiceId.toString(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Napaka pri shranjevanju računa:', error)
    return NextResponse.json(
      { error: 'Napaka pri shranjevanju računa' },
      { status: 500 }
    )
  }
}
