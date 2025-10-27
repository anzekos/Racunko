// app/api/credit-notes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-connection'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const creditNotes = await query(
      `SELECT 
        cn.*,
        s.Stranka, s.Naslov, s.Kraj_postna_st, s.email, s.ID_DDV
      FROM CreditNotes cn
      LEFT JOIN Stranka s ON cn.customer_id = s.id
      WHERE cn.id = ?`,
      [params.id]
    )

    if (creditNotes.length === 0) {
      return NextResponse.json(
        { error: 'Dobropis ni najden' },
        { status: 404 }
      )
    }

    const creditNote = creditNotes[0]
    const items = await query(
      'SELECT * FROM CreditNoteItems WHERE credit_note_id = ?',
      [params.id]
    )

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('Napaka pri pridobivanju dobropisa:', error)
    return NextResponse.json(
      { error: 'Napaka pri pridobivanju dobropisa' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const creditNote = await request.json()

    await query(
      `UPDATE CreditNotes SET
        credit_note_number = ?,
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
        creditNote.creditNoteNumber,
        creditNote.customer.id,
        creditNote.serviceDescription || '',
        creditNote.issueDate,
        creditNote.dueDate,
        creditNote.serviceDate,
        creditNote.totalWithoutVat,
        creditNote.vat,
        creditNote.totalPayable,
        params.id,
      ]
    )

    await query('DELETE FROM CreditNoteItems WHERE credit_note_id = ?', [params.id])

    for (const item of creditNote.items) {
      await query(
        `INSERT INTO CreditNoteItems (
          credit_note_id, description, quantity, price, total
        ) VALUES (?, ?, ?, ?, ?)`,
        [params.id, item.description, item.quantity, item.price, item.total]
      )
    }

    return NextResponse.json({
      ...creditNote,
      id: params.id,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Napaka pri posodabljanju dobropisa:', error)
    return NextResponse.json(
      { error: 'Napaka pri posodabljanju dobropisa' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await query('DELETE FROM CreditNotes WHERE id = ?', [params.id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Napaka pri brisanju dobropisa:', error)
    return NextResponse.json(
      { error: 'Napaka pri brisanju dobropisa' },
      { status: 500 }
    )
  }
}
