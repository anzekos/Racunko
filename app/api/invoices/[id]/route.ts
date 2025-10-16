import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await query(`
      SELECT i.*, 
             c.Stranka, c.Naslov, c.Kraj_postna_st, c.email, c.ID_DDV
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `, [params.id]);

    if (invoice.length === 0) {
      return NextResponse.json(
        { error: 'Račun ni bil najden' },
        { status: 404 }
      );
    }

    const items = await query(
      'SELECT * FROM invoice_items WHERE invoice_id = ?',
      [params.id]
    );

    const completeInvoice = {
      ...invoice[0],
      customer: {
        Stranka: invoice[0].Stranka,
        Naslov: invoice[0].Naslov,
        Kraj_postna_st: invoice[0].Kraj_postna_st,
        email: invoice[0].email,
        ID_DDV: invoice[0].ID_DDV
      },
      items
    };

    return NextResponse.json(completeInvoice);
  } catch (error) {
    return NextResponse.json(
      { error: 'Napaka pri pridobivanju računa' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceData = await request.json();
    
    // Posodobi glavo računa
    await query(
      `UPDATE invoices 
       SET invoice_number = ?, customer_id = ?, issue_date = ?, due_date = ?, 
           service_date = ?, service_description = ?, total_without_vat = ?, 
           vat = ?, total_payable = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        invoiceData.invoiceNumber,
        invoiceData.customer.id,
        invoiceData.issueDate,
        invoiceData.dueDate,
        invoiceData.serviceDate,
        invoiceData.serviceDescription || '',
        invoiceData.totalWithoutVat,
        invoiceData.vat,
        invoiceData.totalPayable,
        params.id
      ]
    );

    // Izbriši stare postavke in dodaj nove
    await query('DELETE FROM invoice_items WHERE invoice_id = ?', [params.id]);

    for (const item of invoiceData.items) {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await query(
        `INSERT INTO invoice_items (id, invoice_id, description, quantity, price, total) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          params.id,
          item.description,
          item.quantity,
          item.price,
          item.total
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Napaka pri posodabljanju računa' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await query('DELETE FROM invoices WHERE id = ?', [params.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Napaka pri brisanju računa' },
      { status: 500 }
    );
  }
}
