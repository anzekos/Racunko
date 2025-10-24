// app/api/quotes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-connection'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const quotes = await query(
      `SELECT 
        q.*,
        s.Stranka, s.Naslov, s.Kraj_postna_st, s.email, s.ID_DDV
      FROM Quotes q
      LEFT JOIN Stranka s ON q.customer_id = s.id
      WHERE q.id = ?`,
      [params.id]
    )

    if (quotes.length === 0) {
      return NextResponse.json(
        { error: 'Ponudba ni najdena' },
        { status: 404 }
      )
    }

    const quote = quotes[0]
    const items = await query(
      'SELECT * FROM QuoteItems WHERE quote_id = ?',
      [params.id]
    )

    return NextResponse.json({
      id: quote.id.toString(),
      quoteNumber: quote.quote_number,
      customer: {
        id: quote.customer_id,
        Stranka: quote.Stranka,
        Naslov: quote.Naslov,
        Kraj_postna_st: quote.Kraj_postna_st,
        email: quote.email,
        ID_DDV: quote.ID_DDV,
      },
      items: items.map((item: any) => ({
        description: item.description,
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.price),
        total: parseFloat(item.total),
      })),
      serviceDescription: quote.service_description,
      issueDate: quote.issue_date,
      dueDate: quote.due_date,
      serviceDate: quote.service_date,
      totalWithoutVat: parseFloat(quote.total_without_vat),
      vat: parseFloat(quote.vat),
      totalPayable: parseFloat(quote.total_payable),
      status: quote.status,
      createdAt: quote.created_at,
      updatedAt: quote.updated_at,
    })
  } catch (error) {
    console.error('Napaka pri pridobivanju ponudbe:', error)
    return NextResponse.json(
      { error: 'Napaka pri pridobivanju ponudbe' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const quote = await request.json()

    await query(
      `UPDATE Quotes SET
        quote_number = ?,
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
        quote.quoteNumber,
        quote.customer.id,
        quote.serviceDescription || '',
        quote.issueDate,
        quote.dueDate,
        quote.serviceDate,
        quote.totalWithoutVat,
        quote.vat,
        quote.totalPayable,
        params.id,
      ]
    )

    await query('DELETE FROM QuoteItems WHERE quote_id = ?', [params.id])

    for (const item of quote.items) {
      await query(
        `INSERT INTO QuoteItems (
          quote_id, description, quantity, price, total
        ) VALUES (?, ?, ?, ?, ?)`,
        [params.id, item.description, item.quantity, item.price, item.total]
      )
    }

    return NextResponse.json({
      ...quote,
      id: params.id,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Napaka pri posodabljanju ponudbe:', error)
    return NextResponse.json(
      { error: 'Napaka pri posodabljanju ponudbe' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await query('DELETE FROM Quotes WHERE id = ?', [params.id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Napaka pri brisanju ponudbe:', error)
    return NextResponse.json(
      { error: 'Napaka pri brisanju ponudbe' },
      { status: 500 }
    )
  }
}
