// app/api/invoices/[id]/status/route.ts
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
    const validStatuses = ['draft', 'sent', 'paid', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Neveljaven status' },
        { status: 400 }
      )
    }

    await query(
      'UPDATE Invoices SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, params.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Napaka pri posodabljanju statusa računa:', error)
    return NextResponse.json(
      { error: 'Napaka pri posodabljanju statusa računa' },
      { status: 500 }
    )
  }
}
