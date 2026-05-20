import { query, getClient } from '@/lib/postgres';

// GET - Fetch all quotations
export async function GET() {
  try {
    const result = await query(`
      SELECT
        q.id,
        q.quotation_number as "quotationNum",
        q.quote_date::text as date,
        q.valid_until::text as "validUntil",
        json_build_object(
          'name', c.name,
          'email', c.email,
          'phone', c.phone,
          'address', c.address
        ) as "clientInfo",
        q.subtotal,
        q.tax_rate as "taxRate",
        q.tax_amount as tax,
        q.grand_total as "grandTotal",
        q.status,
        q.created_at as "createdAt",
        COALESCE(
          json_agg(
            json_build_object(
              'id', qi.id,
              'companyName', qi.company_name,
              'tileSize', qi.tile_size,
              'ratePerSqft', qi.rate_per_sqft,
              'qtyPerBox', qi.qty_per_box,
              'perBoxRate', qi.per_box_rate,
              'numBoxes', qi.number_of_boxes,
              'totalAmount', qi.total_amount,
              'photoUrl', qi.photo_url
            ) ORDER BY qi.id
          ) FILTER (WHERE qi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
      WHERE (q.is_deleted IS NULL OR q.is_deleted = false)
        AND q.status != 'deleted'
      GROUP BY q.id, c.id
      ORDER BY q.created_at DESC
    `);

    return Response.json({
      success: true,
      data: result.rows || []
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST - Create new quotation
export async function POST(request) {
  const client = await getClient();

  try {
    const body = await request.json();
    const {
      quotationNum,
      date,
      validUntil,
      clientInfo,
      items,
      subtotal,
      taxRate,
      tax,
      grandTotal,
      createdById = null
    } = body;

    if (!quotationNum || !date || !clientInfo || !clientInfo.name || !Array.isArray(items)) {
      return Response.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    await client.query('BEGIN');

    // Upsert client — only use ON CONFLICT when a real email is provided
    const email = clientInfo.email || null;
    let clientId;

    if (email) {
      const r = await client.query(
        `INSERT INTO clients (name, address, phone, email, created_by_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           address = EXCLUDED.address,
           phone = EXCLUDED.phone,
           updated_at = NOW()
         RETURNING id`,
        [clientInfo.name, clientInfo.address || '', clientInfo.phone || '', email, createdById]
      );
      clientId = r.rows[0].id;
    } else {
      const r = await client.query(
        `INSERT INTO clients (name, address, phone, created_by_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
        [clientInfo.name, clientInfo.address || '', clientInfo.phone || '', createdById]
      );
      clientId = r.rows[0].id;
    }

    const quotationResult = await client.query(
      `INSERT INTO quotations
       (quotation_number, client_id, quote_date, valid_until, subtotal, tax_rate, tax_amount, grand_total, created_by_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, quotation_number, quote_date::text as date, valid_until::text as "validUntil", grand_total`,
      [
        quotationNum,
        clientId,
        date,
        validUntil || null,
        parseFloat(subtotal) || 0,
        parseFloat(taxRate) || 0,
        parseFloat(tax) || 0,
        parseFloat(grandTotal) || 0,
        createdById
      ]
    );

    const quotationId = quotationResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO quotation_items
         (quotation_id, company_name, tile_size, rate_per_sqft, qty_per_box, per_box_rate, number_of_boxes, total_amount, photo_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          quotationId,
          item.companyName || '',
          item.tileSize || '',
          parseFloat(item.ratePerSqft) || 0,
          parseInt(item.qtyPerBox, 10) || 0,
          parseFloat(item.perBoxRate) || 0,
          parseInt(item.numBoxes, 10) || 0,
          parseFloat(item.totalAmount) || 0,
          item.photoUrl || ''
        ]
      );
    }

    await client.query(
      `INSERT INTO audit_trail (quotation_id, action, action_type, changed_by_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [quotationId, 'CREATE', 'QUOTATION_CREATED', createdById]
    );

    await client.query('COMMIT');

    // Return full camelCase object so the frontend can use it directly
    return Response.json({
      success: true,
      data: {
        id: quotationId,
        quotationNum,
        date,
        validUntil: validUntil || null,
        clientInfo,
        items,
        subtotal: parseFloat(subtotal) || 0,
        taxRate: parseFloat(taxRate) || 0,
        tax: parseFloat(tax) || 0,
        grandTotal: parseFloat(grandTotal) || 0,
      }
    }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating quotation:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  } finally {
    client.release();
  }
}
