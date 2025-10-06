// app/api/customers/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db-connection';
import type { Customer } from '@/lib/database';

// GET - pridobi vse stranke
export async function GET() {
  try {
    const customers = await query('SELECT * FROM Stranka ORDER BY id DESC') as Customer[];
    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch customers',
      details: error.message 
    }, { status: 500 });
  }
}

// POST - dodaj novo stranko
export async function POST(request: Request) {
  try {
    const data: Customer = await request.json();
    
    const result: any = await query(
      `INSERT INTO Stranka (
        Stranka, Naslov, Kraj_postna_st, email, ID_DDV,
        Ukrep, JR, Pogodba, VLG, VLG_z_DDV,
        Gotovina_1, Status_1, Racun_izdal_1, Opomba_Ponudba, Provizija
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.Stranka || null,
        data.Naslov || null,
        data.Kraj_postna_st || null,
        data.email || null,
        data.ID_DDV || null,
        data.Ukrep || null,
        data.JR || null,
        data.Pogodba || null,
        data.VLG || 0,
        data.VLG_z_DDV || 0,
        data.Gotovina_1 || 0,
        data.Status_1 || null,
        data.Racun_izdal_1 || null,
        data.Opomba_Ponudba || null,
        data.Provizija || 0
      ]
    );

    // Vrni novo ustvarjeno stranko
    const newCustomer = await query(
      'SELECT * FROM Stranka WHERE id = ?',
      [result.insertId]
    ) as Customer[];

    return NextResponse.json(newCustomer[0], { status: 201 });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ 
      error: 'Failed to create customer',
      details: error.message 
    }, { status: 500 });
  }
}