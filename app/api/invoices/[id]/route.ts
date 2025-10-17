// app/api/invoices/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-connection'

interface RouteParams {
  params: {
    id: string
  }
}

// GET - pridobi posamezen račun
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const invoices = await query(
      `SELECT 
        i.*,
        s.Stranka, s.Naslov, s.Kraj_postna_st, s.email, s.ID_DDV
      FROM Invoices i
      LEFT JOIN Stranka s ON i.customer_id = s.id
      WHERE i.id = ?`,
      [params.id]
    )

    if (invoices.length === 0) {
      return NextResponse.json(
        { error: 'Račun ni najden' },
        { status: 404 }
      )
    }

    const invoice = invoices[0]
    const items = await query(
      'SELECT * FROM InvoiceItems WHERE invoice_id = ?',
      [params.id]
    )

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('Napaka pri pridobivanju računa:', error)
    return NextResponse.json(
      { error: 'Napaka pri pridobivanju računa' },
      { status: 500 }
    )
  }
}

// PUT - posodobi račun
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const invoice = await request.json()

    // Posodobi račun
    await query(
      `UPDATE Invoices SET
        invoice_number = ?,
        customer_id = ?,
        service_description = ?,
        issue_date = ?,
        due_date = ?,
        service_date = ?,
        total_without_vat = ?,
        vat = ?,
        total_payable = ?
      WHERE id = ?`,
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
        params.id,
      ]
    )

    // Izbriši stare postavke
    await query('DELETE FROM InvoiceItems WHERE invoice_id = ?', [params.id])

    // Vstavi nove postavke
    for (const item of invoice.items) {
      await query(
        `INSERT INTO InvoiceItems (
          invoice_id, description, quantity, price, total
        ) VALUES (?, ?, ?, ?, ?)`,
        [params.id, item.description, item.quantity, item.price, item.total]
      )
    }

    return NextResponse.json({
      ...invoice,
      id: params.id,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Napaka pri posodabljanju računa:', error)
    return NextResponse.json(
      { error: 'Napaka pri posodabljanju računa' },
      { status: 500 }
    )
  }
}

// DELETE - izbriši račun
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await query('DELETE FROM Invoices WHERE id = ?', [params.id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Napaka pri brisanju računa:', error)
    return NextResponse.json(
      { error: 'Napaka pri brisanju računa' },
      { status: 500 }
    )
  }
}
  try {
    const invoices = await query(
      `SELECT 
        i.*,
        s.Stranka, s.Naslov, s.Kraj_postna_st, s.email, s.ID_DDV
      FROM Invoices i
      LEFT JOIN Stranka s ON i.customer_id = s.id
      WHERE i.id = ?`,
      [params.id]
    )

    if (invoices.length === 0) {
      return NextResponse.json(
        { error: 'Račun ni najden' },
        { status: 404 }
      )
    }

    const invoice = invoices[0]
    const items = await query(
      'SELECT * FROM InvoiceItems WHERE invoice_id = ?',
      [params.id]
    )

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('Napaka pri pridobivanju računa:', error)
    return NextResponse.json(
      { error: 'Napaka pri pridobivanju računa' },
      { status: 500 }
    )
  }
}

// PUT - posodobi račun
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await request.json()

    // Posodobi račun
    await query(
      `UPDATE Invoices SET
        invoice_number = ?,
        customer_id = ?,
        service_description = ?,
        issue_date = ?,
        due_date = ?,
        service_date = ?,
        total_without_vat = ?,
        vat = ?,
        total_payable = ?
      WHERE id = ?`,
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
        params.id,
      ]
    )

    // Izbriši stare postavke
    await query('DELETE FROM InvoiceItems WHERE invoice_id = ?', [params.id])

    // Vstavi nove postavke
    for (const item of invoice.items) {
      await query(
        `INSERT INTO InvoiceItems (
          invoice_id, description, quantity, price, total
        ) VALUES (?, ?, ?, ?, ?)`,
        [params.id, item.description, item.quantity, item.price, item.total]
      )
    }

    return NextResponse.json({
      ...invoice,
      id: params.id,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Napaka pri posodabljanju računa:', error)
    return NextResponse.json(
      { error: 'Napaka pri posodabljanju računa' },
      { status: 500 }
    )
  }
}

// DELETE - izbriši račun
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await query('DELETE FROM Invoices WHERE id = ?', [params.id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Napaka pri brisanju računa:', error)
    return NextResponse.json(
      { error: 'Napaka pri brisanju računa' },
      { status: 500 }
    )
  }
}
