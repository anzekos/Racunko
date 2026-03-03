// app/api/invoices/[id]/payment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-connection'

interface RouteParams {
  params: { id: string }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { paid_amount, notes } = await request.json()

    await query(
      'UPDATE Invoices SET paid_amount = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [paid_amount ?? 0, notes ?? '', params.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Napaka pri posodabljanju plačila:', error)
    return NextResponse.json(
      { error: 'Napaka pri posodabljanju plačila' },
      { status: 500 }
    )
  }
}
