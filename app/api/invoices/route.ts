// app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-connection'

// GET - pridobi vse račune
export async function GET() {
  try {
    const invoices = await query(`
      SELECT 
        i.*,
        s.Stranka, s.Naslov, s.Kraj_postna_st, s.email, s.ID_DDV
      FROM Invoices i
      LEFT JOIN Stranka s ON i.customer_id = s.id
      ORDER BY i.created_at DESC
    `)

    // Pridobi postavke za vsak račun
    const invoicesWithItems = await Promise.all(
      invoices.map(async (invoice: any) => {
        const items = await query(
          'SELECT * FROM InvoiceItems WHERE invoice_id = ?',
          [invoice.id]
        )
        
        return {
          id: invoice.id.toString(),
          invoiceNumber: invoice.invoice_number,
          customer: {
            id: invoice.customer_id,
            Stranka: invoice.Stranka,
            Naslov: invoice.Naslov,
            Kraj_postna_st: invoice.Kraj_postna_st,
            email: invoice.email,
            ID_DDV: invoice.ID_DDV,
          },
          items: items.map((item: any) => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            price: parseFloat(item.price),
            total: parseFloat(item.total),
          })),
          serviceDescription: invoice.service_description,
          issueDate: invoice.issue_date,
          dueDate: invoice.due_date,
          serviceDate: invoice.service_date,
          totalWithoutVat: parseFloat(invoice.total_without_vat),
          vat: parseFloat(invoice.vat),
          totalPayable: parseFloat(invoice.total_payable),
          status: invoice.status,
          createdAt: invoice.created_at,
          updatedAt: invoice.updated_at,
        }
      })
    )

    return NextResponse.json(invoicesWithItems)
  } catch (error) {
    console.error('Napaka pri pridobivanju računov:', error)
    return NextResponse.json(
      { error: 'Napaka pri pridobivanju računov' },
      { status: 500 }
    )
  }
}

// POST - ustvari nov račun
export async function POST(request: NextRequest) {
  try {
    const invoice = await request.json()

    // Preveri ali račun s to številko že obstaja
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

    // Vstavi račun
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

    // Vstavi postavke
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
