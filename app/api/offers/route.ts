// app/api/offers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-connection'

// GET - pridobi vse ponudbe
export async function GET() {
  try {
    const offers = await query(
      `SELECT 
        o.*,
        s.Stranka, s.Naslov, s.Kraj_postna_st, s.email, s.ID_DDV
      FROM Offers o
      LEFT JOIN Stranka s ON o.customer_id = s.id
      ORDER BY o.created_at DESC`
    )

    const offersWithItems = await Promise.all(
      offers.map(async (offer: any) => {
        const items = await query(
          'SELECT * FROM OfferItems WHERE offer_id = ?',
          [offer.id]
        )

        return {
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
        }
      })
    )

    return NextResponse.json(offersWithItems)
  } catch (error) {
    console.error('Napaka pri pridobivanju ponudb:', error)
    return NextResponse.json(
      { error: 'Napaka pri pridobivanju ponudb' },
      { status: 500 }
    )
  }
}

// POST - ustvari novo ponudbo
export async function POST(request: NextRequest) {
  try {
    const offer = await request.json()

    // Preveri ali ponudba s to številko že obstaja
    const existing = await query(
      'SELECT id FROM Offers WHERE offer_number = ?',
      [offer.offerNumber]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Ponudba s to številko že obstaja' },
        { status: 400 }
      )
    }

    // Vstavi ponudbo
    const result = await query(
      `INSERT INTO Offers (
        offer_number, customer_id, service_description,
        issue_date, due_date, service_date,
        total_without_vat, vat, total_payable, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
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
      ]
    )

    const offerId = result.insertId

    // Vstavi postavke
    for (const item of offer.items) {
      await query(
        `INSERT INTO OfferItems (
          offer_id, description, quantity, price, total
        ) VALUES (?, ?, ?, ?, ?)`,
        [offerId, item.description, item.quantity, item.price, item.total]
      )
    }

    return NextResponse.json({
      ...offer,
      id: offerId.toString(),
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
