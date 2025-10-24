// app/api/quotes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-connection'

export async function GET() {
  try {
    const quotes = await query(
      `SELECT 
        q.*,
        s.Stranka, s.Naslov, s.Kraj_postna_st, s.email, s.ID_DDV
      FROM Quotes q
      LEFT JOIN Stranka s ON q.customer_id = s.id
      ORDER BY q.created_at DESC`
    )

    const quotesWithItems = await Promise.all(
      quotes.map(async (quote: any) => {
        const items = await query(
          'SELECT * FROM QuoteItems WHERE quote_id = ?',
          [quote.id]
        )

        return {
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
        }
      })
    )

    return NextResponse.json(quotesWithItems)
  } catch (error) {
    console.error('Napaka pri pridobivanju ponudb:', error)
    return NextResponse.json(
      { error: 'Napaka pri pridobivanju ponudb' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const quote = await request.json()

    const existing = await query(
      'SELECT id FROM Quotes WHERE quote_number = ?',
      [quote.quoteNumber]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Ponudba s to številko že obstaja' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO Quotes (
        quote_number, customer_id, service_description,
        issue_date, due_date, service_date,
        total_without_vat, vat, total_payable, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
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
      ]
    )

    const quoteId = result.insertId

    for (const item of quote.items) {
      await query(
        `INSERT INTO QuoteItems (
          quote_id, description, quantity, price, total
        ) VALUES (?, ?, ?, ?, ?)`,
        [quoteId, item.description, item.quantity, item.price, item.total]
      )
    }

    return NextResponse.json({
      ...quote,
      id: quoteId.toString(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Napaka pri shranjevanju ponudbe:', error)
    return NextResponse.json(
      { error: 'Napaka pri shranjevanju ponudbe' },
      { status: 500 }
    )
  }
}
