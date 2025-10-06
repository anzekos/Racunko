// app/api/customers/[id]/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db-connection';
import type { Customer } from '@/lib/database';

// GET - pridobi eno stranko
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customers = await query(
      'SELECT * FROM Stranka WHERE id = ?',
      [params.id]
    ) as Customer[];

    if (customers.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customers[0]);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch customer',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - posodobi stranko
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data: Customer = await request.json();
    
    await query(
      `UPDATE Stranka SET 
        Stranka = ?, Naslov = ?, Kraj_postna_st = ?, 
        email = ?, ID_DDV = ?, Ukrep = ?, JR = ?, 
        Pogodba = ?, VLG = ?, VLG_z_DDV = ?,
        Gotovina_1 = ?, Status_1 = ?, Racun_izdal_1 = ?,
        Opomba_Ponudba = ?, Provizija = ?
      WHERE id = ?`,
      [
        data.Stranka,
        data.Naslov,
        data.Kraj_postna_st,
        data.email,
        data.ID_DDV,
        data.Ukrep,
        data.JR,
        data.Pogodba,
        data.VLG || 0,
        data.VLG_z_DDV || 0,
        data.Gotovina_1 || 0,
        data.Status_1,
        data.Racun_izdal_1,
        data.Opomba_Ponudba,
        data.Provizija || 0,
        params.id
      ]
    );

    // Vrni posodobljeno stranko
    const updatedCustomer = await query(
      'SELECT * FROM Stranka WHERE id = ?',
      [params.id]
    ) as Customer[];

    return NextResponse.json(updatedCustomer[0]);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ 
      error: 'Failed to update customer',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - izbriši stranko
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await query('DELETE FROM Stranka WHERE id = ?', [params.id]);
    return NextResponse.json({ success: true, message: 'Customer deleted' });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete customer',
      details: error.message 
    }, { status: 500 });
  }
}