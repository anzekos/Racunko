import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db-connection';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const invoices = await query(`
        SELECT r.*, 
               GROUP_CONCAT(CONCAT(rp.description, '|', rp.quantity, '|', rp.price, '|', rp.total) SEPARATOR ';;') as items
        FROM Racuni r
        LEFT JOIN RacunPostavke rp ON r.id = rp.racunId
        GROUP BY r.id
        ORDER BY r.createdAt DESC
      `);
      
      const formattedInvoices = invoices.map((invoice: any) => ({
        ...invoice,
        items: invoice.items ? invoice.items.split(';;').map((item: string) => {
          const [description, quantity, price, total] = item.split('|');
          return {
            description,
            quantity: parseFloat(quantity),
            price: parseFloat(price),
            total: parseFloat(total)
          };
        }) : []
      }));

      res.status(200).json(formattedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ message: 'Error fetching invoices' });
    }
  } else if (req.method === 'POST') {
    try {
      const invoice = req.body;
      
      // Insert main invoice
      await query(
        `INSERT INTO Racuni (id, invoiceNumber, customerId, customerName, customerAddress, customerCity, customerEmail, customerVatId, serviceDescription, issueDate, dueDate, serviceDate, totalWithoutVat, vat, totalPayable, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoice.id,
          invoice.invoiceNumber,
          invoice.customer.id,
          invoice.customer.Stranka,
          invoice.customer.Naslov,
          invoice.customer.Kraj_postna_st,
          invoice.customer.email,
          invoice.customer.ID_DDV,
          invoice.serviceDescription,
          invoice.issueDate,
          invoice.dueDate,
          invoice.serviceDate,
          invoice.totalWithoutVat,
          invoice.vat,
          invoice.totalPayable,
          'draft'
        ]
      );

      // Insert items
      for (const item of invoice.items) {
        await query(
          `INSERT INTO RacunPostavke (racunId, description, quantity, price, total) VALUES (?, ?, ?, ?, ?)`,
          [invoice.id, item.description, item.quantity, item.price, item.total]
        );
      }

      res.status(201).json({ ...invoice, status: 'draft' });
    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(500).json({ message: 'Error creating invoice' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
