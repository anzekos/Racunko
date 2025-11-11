// app/api/offers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-connection'

// GET - pridobi vse ponudbe (OPTIMIZIRANO!)
export async function GET() {
  try {
    const result = await query(`
      SELECT 
        o.id,
        o.offer_number,
        o.customer_id,
        o.service_description,
        o.issue_date,
        o.due_date,
        o.service_date,
        o.total_without_vat,
        o.vat,
        o.total_payable,
        o.status,
        o.created_at,
        o.updated_at,
        s.Stranka,
        s.Naslov,
        s.Kraj_postna_st,
        s.email,
        s.ID_DDV,
        oi.id as item_id,
        oi.description as item_description,
        oi.quantity as item_quantity,
        oi.price as item_price,
        oi.total as item_total
      FROM Offers o
      LEFT JOIN Stranka s ON o.customer_id = s.id
      LEFT JOIN OfferItems oi ON o.id = oi.offer_id
      ORDER BY o.created_at DESC, oi.id ASC
    `)

    const offersMap = new Map()
    
    result.forEach((row: any) => {
      if (!offersMap.has(row.id)) {
        offersMap.set(row.id, {
          id: row.id.toString(),
          offerNumber: row.offer_number,
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
      
      if (row.item_id) {
        offersMap.get(row.id).items.push({
          description: row.item_description,
          quantity: parseFloat(row.item_quantity),
          price: parseFloat(row.item_price),
          total: parseFloat(row.item_total),
        })
      }
    })

    return NextResponse.json(Array.from(offersMap.values()))
  } catch (error) {
    console.error('Napaka pri pridobivanju ponudb:', error)
    return NextResponse.json(
      { error: 'Napaka pri pridobivanju ponudb' },
      { status: 500 }
    )
  }
}

// POST ostane enak - ne spreminjaj!
export async function POST(request: NextRequest) {
  try {
    const offer = await request.json()

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
