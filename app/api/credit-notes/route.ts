// app/api/credit-notes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-connection'

// GET - pridobi vse dobropise (OPTIMIZIRANO!)
export async function GET() {
  try {
    const result = await query(`
      SELECT 
        cn.id,
        cn.credit_note_number,
        cn.customer_id,
        cn.service_description,
        cn.issue_date,
        cn.due_date,
        cn.service_date,
        cn.total_without_vat,
        cn.vat,
        cn.total_payable,
        cn.status,
        cn.created_at,
        cn.updated_at,
        s.Stranka,
        s.Naslov,
        s.Kraj_postna_st,
        s.email,
        s.ID_DDV,
        cni.id as item_id,
        cni.description as item_description,
        cni.quantity as item_quantity,
        cni.price as item_price,
        cni.total as item_total
      FROM CreditNotes cn
      LEFT JOIN Stranka s ON cn.customer_id = s.id
      LEFT JOIN CreditNoteItems cni ON cn.id = cni.credit_note_id
      ORDER BY cn.created_at DESC, cni.id ASC
    `)

    const creditNotesMap = new Map()
    
    result.forEach((row: any) => {
      if (!creditNotesMap.has(row.id)) {
        creditNotesMap.set(row.id, {
          id: row.id.toString(),
          creditNoteNumber: row.credit_note_number,
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
        creditNotesMap.get(row.id).items.push({
          description: row.item_description,
          quantity: parseFloat(row.item_quantity),
          price: parseFloat(row.item_price),
          total: parseFloat(row.item_total),
        })
      }
    })

    return NextResponse.json(Array.from(creditNotesMap.values()))
  } catch (error) {
    console.error('Napaka pri pridobivanju dobropisov:', error)
    return NextResponse.json(
      { error: 'Napaka pri pridobivanju dobropisov' },
      { status: 500 }
    )
  }
}

// POST ostane enak - ne spreminjaj!
export async function POST(request: NextRequest) {
  try {
    const creditNote = await request.json()

    const existing = await query(
      'SELECT id FROM CreditNotes WHERE credit_note_number = ?',
      [creditNote.creditNoteNumber]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Dobropis s to številko že obstaja' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO CreditNotes (
        credit_note_number, customer_id, service_description,
        issue_date, due_date, service_date,
        total_without_vat, vat, total_payable, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        creditNote.creditNoteNumber,
        creditNote.customer.id,
        creditNote.serviceDescription || '',
        creditNote.issueDate,
        creditNote.dueDate,
        creditNote.serviceDate,
        creditNote.totalWithoutVat,
        creditNote.vat,
        creditNote.totalPayable,
      ]
    )

    const creditNoteId = result.insertId

    for (const item of creditNote.items) {
      await query(
        `INSERT INTO CreditNoteItems (
          credit_note_id, description, quantity, price, total
        ) VALUES (?, ?, ?, ?, ?)`,
        [creditNoteId, item.description, item.quantity, item.price, item.total]
      )
    }

    return NextResponse.json({
      ...creditNote,
      id: creditNoteId.toString(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Napaka pri shranjevanju dobropisa:', error)
    return NextResponse.json(
      { error: 'Napaka pri shranjevanju dobropisa' },
      { status: 500 }
    )
  }
}
