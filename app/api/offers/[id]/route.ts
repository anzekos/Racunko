// app/api/offers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-connection'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const offers = await query(
      `SELECT 
        o.*,
        s.Stranka, s.Naslov, s.Kraj_postna_st, s.email, s.ID_DDV
      FROM Offers o
      LEFT JOIN Stranka s ON o.customer_id = s.id
      WHERE o.id = ?`,
      [params.id]
    )

    if (offers.length === 0) {
      return NextResponse.json(
        { error: 'Ponudba ni najdena' },
        { status: 404 }
      )
    }

    const offer = offers[0]
    const items = await query(
      'SELECT * FROM OfferItems WHERE offer_id = ?',
      [params.id]
    )

    return NextResponse.json({
      id: offer.id.toString(),
      offerNumber: offer.offer_number,
      customer: {
        id: offer.customer_id,
        Stranka: offer.Stranka,
        Naslov: offer.Naslov,
        Kraj_postna_st: offer.Kraj_postna_st,
        email: offer.email,
        ID_DDV: offer.ID_DDV,
      },
      items: items.map((item: any) => ({
        description: item.description,
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.price),
        total: parseFloat(item.total),
      })),
      serviceDescription: offer.service_description,
      issueDate: offer.issue_date,
      dueDate: offer.due_date,
      serviceDate: offer.service_date,
      totalWithoutVat: parseFloat(offer.total_without_vat),
      vat: parseFloat(offer.vat),
      totalPayable: parseFloat(offer.total_payable),
      status: offer.status,
      createdAt: offer.created_at,
      updatedAt: offer.updated_at,
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
    const offer = await request.json()

    await query(
      `UPDATE Offers SET
        offer_number = ?,
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
        offer.offerNumber,
        offer.customer.id,
        offer.serviceDescription || '',
        offer.issueDate,
        offer.dueDate,
        offer.serviceDate,
        offer.totalWithoutVat,
        offer.vat,
        offer.totalPayable,
        params.id,
      ]
    )

    await query('DELETE FROM OfferItems WHERE offer_id = ?', [params.id])

    for (const item of offer.items) {
      await query(
        `INSERT INTO OfferItems (
          offer_id, description, quantity, price, total
        ) VALUES (?, ?, ?, ?, ?)`,
        [params.id, item.description, item.quantity, item.price, item.total]
      )
    }

    return NextResponse.json({
      ...offer,
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

// app/api/offers/[id]/route.ts - DELETE funkcija
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Najprej izbrišemo vse povezane postavke
    await query('DELETE FROM OfferItems WHERE offer_id = ?', [params.id])
    
    // Nato izbrišemo ponudbo
    await query('DELETE FROM Offers WHERE id = ?', [params.id])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Napaka pri brisanju ponudbe:', error)
    return NextResponse.json(
      { error: 'Napaka pri brisanju ponudbe: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
