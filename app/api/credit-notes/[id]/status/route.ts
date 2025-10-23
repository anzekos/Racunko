// app/api/credit-notes/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-connection'

interface RouteParams {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { status } = await request.json()

    // Preverimo veljavnost statusa
    const validStatuses = ['draft', 'sent', 'processed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Neveljaven status' },
        { status: 400 }
      )
    }

    await query(
      'UPDATE CreditNotes SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, params.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Napaka pri posodabljanju statusa dobropisa:', error)
    return NextResponse.json(
      { error: 'Napaka pri posodabljanju statusa dobropisa' },
      { status: 500 }
    )
  }
}
