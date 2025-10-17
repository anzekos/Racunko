import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db-connection';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const invoices = await query('SELECT * FROM Racuni WHERE id = ?', [id]);
      
      if (invoices.length === 0) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      const items = await query('SELECT * FROM RacunPostavke WHERE racunId = ?', [id]);
      
      const invoice = {
        ...invoices[0],
        items: items.map((item: any) => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price),
          total: parseFloat(item.total)
        }))
      };

      res.status(200).json(invoice);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ message: 'Error fetching invoice' });
    }
  } else if (req.method === 'PUT') {
    try {
      const invoice = req.body;
      
      // Update main invoice
      await query(
        `UPDATE Racuni SET 
          invoiceNumber = ?, customerId = ?, customerName = ?, customerAddress = ?, customerCity = ?, 
          customerEmail = ?, customerVatId = ?, serviceDescription = ?, issueDate = ?, dueDate = ?, 
          serviceDate = ?, totalWithoutVat = ?, vat = ?, totalPayable = ?, status = ?
         WHERE id = ?`,
        [
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
          invoice.status,
          id
        ]
      );

      // Delete old items and insert new ones
      await query('DELETE FROM RacunPostavke WHERE racunId = ?', [id]);
      
      for (const item of invoice.items) {
        await query(
          `INSERT INTO RacunPostavke (racunId, description, quantity, price, total) VALUES (?, ?, ?, ?, ?)`,
          [id, item.description, item.quantity, item.price, item.total]
        );
      }

      res.status(200).json(invoice);
    } catch (error) {
      console.error('Error updating invoice:', error);
      res.status(500).json({ message: 'Error updating invoice' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await query('DELETE FROM Racuni WHERE id = ?', [id]);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      res.status(500).json({ message: 'Error deleting invoice' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
