// app/api/credit-notes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-connection'

// GET - pridobi vse dobropise
export async function GET() {
  try {
    const creditNotes = await query(
      `SELECT 
        cn.*,
        s.Stranka, s.Naslov, s.Kraj_postna_st, s.email, s.ID_DDV
      FROM CreditNotes cn
      LEFT JOIN Stranka s ON cn.customer_id = s.id
      ORDER BY cn.created_at DESC`
    )

    const creditNotesWithItems = await Promise.all(
      creditNotes.map(async (creditNote: any) => {
        const items = await query(
          'SELECT * FROM CreditNoteItems WHERE credit_note_id = ?',
          [creditNote.id]
        )

        return {
          id: creditNote.id.toString(),
          creditNoteNumber: creditNote.credit_note_number,
          customer: {
            id: creditNote.customer_id,
            Stranka: creditNote.Stranka,
            Naslov: creditNote.Naslov,
            Kraj_postna_st: creditNote.Kraj_postna_st,
            email: creditNote.email,
            ID_DDV: creditNote.ID_DDV,
          },
          items: items.map((item: any) => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            price: parseFloat(item.price),
            total: parseFloat(item.total),
          })),
          serviceDescription: creditNote.service_description,
          issueDate: creditNote.issue_date,
          dueDate: creditNote.due_date,
          serviceDate: creditNote.service_date,
          totalWithoutVat: parseFloat(creditNote.total_without_vat),
          vat: parseFloat(creditNote.vat),
          totalPayable: parseFloat(creditNote.total_payable),
          status: creditNote.status,
          createdAt: creditNote.created_at,
          updatedAt: creditNote.updated_at,
        }
      })
    )

    return NextResponse.json(creditNotesWithItems)
  } catch (error) {
    console.error('Napaka pri pridobivanju dobropisov:', error)
    return NextResponse.json(
      { error: 'Napaka pri pridobivanju dobropisov' },
      { status: 500 }
    )
  }
}

// POST - ustvari nov dobropis
export async function POST(request: NextRequest) {
  try {
    const creditNote = await request.json()

    // Preveri ali dobropis s to številko že obstaja
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

    // Vstavi dobropis
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

    // Vstavi postavke
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
