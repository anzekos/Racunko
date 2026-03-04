// app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-connection'

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(n)))
}

function parseBoolParam(v: string | null) {
  if (!v) return false
  return v === '1' || v.toLowerCase() === 'true' || v.toLowerCase() === 'yes'
}

// GET - paginiran seznam računov (hitreje) ali all=true (legacy)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const all = parseBoolParam(url.searchParams.get('all'))

    if (all) {
      // Legacy: vrni vse (lahko je počasno na veliki bazi)
      const result = await query(`
        SELECT 
          i.id,
          i.invoice_number,
          i.customer_id,
          i.service_description,
          i.issue_date,
          i.due_date,
          i.service_date,
          i.total_without_vat,
          i.vat,
          i.total_payable,
          i.paid_amount,   
          i.notes,         
          i.status,
          i.created_at,
          i.updated_at,
          s.Stranka,
          s.Naslov,
          s.Kraj_postna_st,
          s.email,
          s.ID_DDV,
          ii.id as item_id,
          ii.description as item_description,
          ii.quantity as item_quantity,
          ii.price as item_price,
          ii.total as item_total
        FROM Invoices i
        LEFT JOIN Stranka s ON i.customer_id = s.id
        LEFT JOIN InvoiceItems ii ON i.id = ii.invoice_id
        ORDER BY i.created_at DESC, ii.id ASC
      `)

      const invoicesMap = new Map()
      result.forEach((row: any) => {
        if (!invoicesMap.has(row.id)) {
          invoicesMap.set(row.id, {
            id: row.id.toString(),
            invoiceNumber: row.invoice_number,
            customer: {
              id: row.customer_id,
              Stranka: row.Stranka,
              Naslov: row.Naslov,
              Kraj_postna_st: row.Kraj_postna_st,
              email: row.email,
              ID_DDV: row.ID_DDV,
            },
            items: [],
            serviceDescription: row.service_description,
            issueDate: row.issue_date,
            dueDate: row.due_date,
            serviceDate: row.service_date,
            totalWithoutVat: parseFloat(row.total_without_vat),
            vat: parseFloat(row.vat),
            totalPayable: parseFloat(row.total_payable),
            paidAmount: parseFloat(row.paid_amount || 0),
            unpaidAmount: parseFloat(row.total_payable) - parseFloat(row.paid_amount || 0),
            notes: row.notes || '',
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          })
        }

        if (row.item_id) {
          invoicesMap.get(row.id).items.push({
            description: row.item_description,
            quantity: parseFloat(row.item_quantity),
            price: parseFloat(row.item_price),
            total: parseFloat(row.item_total),
          })
        }
      })

      return NextResponse.json(Array.from(invoicesMap.values()))
    }

    // Default: paginiran seznam
    const page = clampInt(Number(url.searchParams.get('page') || 1), 1, 1000000)
    const pageSize = clampInt(Number(url.searchParams.get('pageSize') || 50), 1, 200)
    const offset = (page - 1) * pageSize

    const q = (url.searchParams.get('q') || '').trim()
    const status = (url.searchParams.get('status') || '').trim()

    const whereParts: string[] = []
    const whereParams: any[] = []

    if (status) {
      whereParts.push('i.status = ?')
      whereParams.push(status)
    }
    if (q) {
      whereParts.push('(i.invoice_number LIKE ? OR s.Stranka LIKE ?)')
      const like = `%${q}%`
      whereParams.push(like, like)
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

    const totalRows: any[] = await query(
      `
      SELECT COUNT(*) as total
      FROM Invoices i
      LEFT JOIN Stranka s ON i.customer_id = s.id
      ${whereSql}
      `,
      whereParams
    )
    const total = Number(totalRows?.[0]?.total ?? 0)
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    const invoiceRows: any[] = await query(
      `
      SELECT 
        i.id,
        i.invoice_number,
        i.customer_id,
        i.service_description,
        i.issue_date,
        i.due_date,
        i.service_date,
        i.total_without_vat,
        i.vat,
        i.total_payable,
        i.paid_amount,
        i.notes,
        i.status,
        i.created_at,
        i.updated_at,
        s.Stranka,
        s.Naslov,
        s.Kraj_postna_st,
        s.email,
        s.ID_DDV
      FROM Invoices i
      LEFT JOIN Stranka s ON i.customer_id = s.id
      ${whereSql}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...whereParams, pageSize, offset]
    )

    const invoiceIds = invoiceRows.map((r) => r.id).filter(Boolean)

    let itemRows: any[] = []
    if (invoiceIds.length > 0) {
      const placeholders = invoiceIds.map(() => '?').join(',')
      itemRows = await query(
        `
        SELECT
          invoice_id,
          id,
          description,
          quantity,
          price,
          total
        FROM InvoiceItems
        WHERE invoice_id IN (${placeholders})
        ORDER BY invoice_id ASC, id ASC
        `,
        invoiceIds
      )
    }

    const itemsByInvoiceId = new Map<any, any[]>()
    itemRows.forEach((row: any) => {
      if (!itemsByInvoiceId.has(row.invoice_id)) itemsByInvoiceId.set(row.invoice_id, [])
      itemsByInvoiceId.get(row.invoice_id)!.push({
        description: row.description,
        quantity: parseFloat(row.quantity),
        price: parseFloat(row.price),
        total: parseFloat(row.total),
      })
    })

    const data = invoiceRows.map((row: any) => {
      const paidAmount = parseFloat(row.paid_amount || 0)
      const totalPayable = parseFloat(row.total_payable)
      return {
        id: row.id.toString(),
        invoiceNumber: row.invoice_number,
        customer: {
          id: row.customer_id,
          Stranka: row.Stranka,
          Naslov: row.Naslov,
          Kraj_postna_st: row.Kraj_postna_st,
          email: row.email,
          ID_DDV: row.ID_DDV,
        },
        items: itemsByInvoiceId.get(row.id) || [],
        serviceDescription: row.service_description,
        issueDate: row.issue_date,
        dueDate: row.due_date,
        serviceDate: row.service_date,
        totalWithoutVat: parseFloat(row.total_without_vat),
        vat: parseFloat(row.vat),
        totalPayable,
        paidAmount,
        unpaidAmount: totalPayable - paidAmount,
        notes: row.notes || '',
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    })

    return NextResponse.json({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasMore: page * pageSize < total,
      },
    })
  } catch (error) {
    console.error('Napaka pri pridobivanju računov:', error)
    return NextResponse.json(
      { error: 'Napaka pri pridobivanju računov' },
      { status: 500 }
    )
  }
}

// POST ostane enak - ne spreminjaj!
export async function POST(request: NextRequest) {
  try {
    const invoice = await request.json()

    const existing = await query(
      'SELECT id FROM Invoices WHERE invoice_number = ?',
      [invoice.invoiceNumber]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Račun s to številko že obstaja' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO Invoices (
        invoice_number, customer_id, service_description,
        issue_date, due_date, service_date,
        total_without_vat, vat, total_payable, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        invoice.invoiceNumber,
        invoice.customer.id,
        invoice.serviceDescription || '',
        invoice.issueDate,
        invoice.dueDate,
        invoice.serviceDate,
        invoice.totalWithoutVat,
        invoice.vat,
        invoice.totalPayable,
      ]
    )

    const invoiceId = result.insertId

    for (const item of invoice.items) {
      await query(
        `INSERT INTO InvoiceItems (
          invoice_id, description, quantity, price, total
        ) VALUES (?, ?, ?, ?, ?)`,
        [invoiceId, item.description, item.quantity, item.price, item.total]
      )
    }

    return NextResponse.json({
      ...invoice,
      id: invoiceId.toString(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Napaka pri shranjevanju računa:', error)
    return NextResponse.json(
      { error: 'Napaka pri shranjevanju računa' },
      { status: 500 }
    )
  }
}
