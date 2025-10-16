import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const invoices = await query(`
      SELECT i.*, 
             c.Stranka, c.Naslov, c.Kraj_postna_st, c.email, c.ID_DDV
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
    `);

    const invoicesWithItems = await Promise.all(
      invoices.map(async (invoice: any) => {
        const items = await query(
          'SELECT * FROM invoice_items WHERE invoice_id = ?',
          [invoice.id]
        );
        return {
          ...invoice,
          customer: {
            Stranka: invoice.Stranka,
            Naslov: invoice.Naslov,
            Kraj_postna_st: invoice.Kraj_postna_st,
            email: invoice.email,
            ID_DDV: invoice.ID_DDV
          },
          items
        };
      })
    );

    return NextResponse.json(invoicesWithItems);
  } catch (error) {
    return NextResponse.json(
      { error: 'Napaka pri pridobivanju računov' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const invoiceData = await request.json();
    
    // Generiraj ID za račun
    const invoiceId = `inv_${Date.now()}`;
    
    // Shrani glavo računa
    await query(
      `INSERT INTO invoices (id, invoice_number, customer_id, issue_date, due_date, service_date, 
       service_description, total_without_vat, vat, total_payable, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        invoiceData.invoiceNumber,
        invoiceData.customer.id,
        invoiceData.issueDate,
        invoiceData.dueDate,
        invoiceData.serviceDate,
        invoiceData.serviceDescription || '',
        invoiceData.totalWithoutVat,
        invoiceData.vat,
        invoiceData.totalPayable,
        'draft'
      ]
    );

    // Shrani postavke računa
    for (const item of invoiceData.items) {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await query(
        `INSERT INTO invoice_items (id, invoice_id, description, quantity, price, total) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          invoiceId,
          item.description,
          item.quantity,
          item.price,
          item.total
        ]
      );
    }

    // Vrni celoten račun
    const savedInvoice = await query(`
      SELECT i.*, 
             c.Stranka, c.Naslov, c.Kraj_postna_st, c.email, c.ID_DDV
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `, [invoiceId]);

    const items = await query(
      'SELECT * FROM invoice_items WHERE invoice_id = ?',
      [invoiceId]
    );

    const completeInvoice = {
      ...savedInvoice[0],
      customer: {
        Stranka: savedInvoice[0].Stranka,
        Naslov: savedInvoice[0].Naslov,
        Kraj_postna_st: savedInvoice[0].Kraj_postna_st,
        email: savedInvoice[0].email,
        ID_DDV: savedInvoice[0].ID_DDV
      },
      items
    };

    return NextResponse.json(completeInvoice);
  } catch (error) {
    console.error('Error saving invoice:', error);
    return NextResponse.json(
      { error: 'Napaka pri shranjevanju računa' },
      { status: 500 }
    );
  }
}
