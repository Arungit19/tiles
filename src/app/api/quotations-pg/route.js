// src/app/api/quotations-pg/route.js

import { query, getClient } from '@/lib/postgres'; // ✅ import, no require()

// GET: Fetch all quotations with full details
export async function GET(request) {
  try {
    const sql = `
      SELECT 
        q.id,
        q.quotation_number,
        q.quote_date,
        q.valid_until,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        u.full_name as created_by,
        q.subtotal,
        q.tax_rate,
        q.tax_amount,
        q.grand_total,
        q.status,
        COUNT(qi.id) as item_count,
        q.created_at
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      LEFT JOIN users u ON q.created_by_id = u.id
      LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
      WHERE q.status != 'deleted'
      GROUP BY q.id, c.id, u.id
      ORDER BY q.quote_date DESC
    `;

    const result = await query(sql);

    return new Response(JSON.stringify({
      success: true,
      data: result.rows,
      count: result.rows.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching quotations:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST: Create new quotation
export async function POST(request) {
  const client = await getClient(); // ✅ Fixed: import se, require() nahi

  try {
    const data = await request.json();

    // Validate required fields
    if (!data.quotationNum || !data.items || !data.clientInfo) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await client.query('BEGIN');

    // 1. Create or update client
    const clientResult = await client.query(
      `INSERT INTO clients (name, address, phone, email, created_by_id)
       VALUES ($1, $2, $3, $4, 1)
       ON CONFLICT (email) DO UPDATE 
         SET name = EXCLUDED.name,
             updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [
        data.clientInfo.name,
        data.clientInfo.address || '',
        data.clientInfo.phone || '',
        data.clientInfo.email || ''
      ]
    );
    const clientId = clientResult.rows[0].id;

    // 2. Create quotation
    const quotationResult = await client.query(
      `INSERT INTO quotations 
        (quotation_number, client_id, quote_date, valid_until,
         subtotal, tax_rate, tax_amount, grand_total, created_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
       RETURNING id`,
      [
        data.quotationNum,
        clientId,
        data.date,
        data.validUntil,
        parseFloat(data.subtotal) || 0,
        parseFloat(data.taxRate) || 0,
        parseFloat(data.tax) || 0,
        parseFloat(data.grandTotal) || 0
      ]
    );
    const quotationId = quotationResult.rows[0].id;

    // 3. Insert all items
    for (const item of data.items) {
      await client.query(
        `INSERT INTO quotation_items 
          (quotation_id, company_name, tile_size, rate_per_sqft,
           qty_per_box, per_box_rate, number_of_boxes, total_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          quotationId,
          item.companyName || '',
          item.tileSize || '',
          parseFloat(item.ratePerSqft) || 0,
          parseFloat(item.qtyPerBox) || 0,
          parseFloat(item.perBoxRate) || 0,
          parseInt(item.numBoxes) || 0,
          parseFloat(item.totalAmount) || 0
        ]
      );
    }

    // 4. Audit trail
    await client.query(
      `INSERT INTO audit_trail (quotation_id, action, new_values, changed_by_id)
       VALUES ($1, $2, $3, 1)`,
      [
        quotationId,
        'created',
        JSON.stringify({
          quotationNum: data.quotationNum,
          grandTotal: data.grandTotal
        })
      ]
    );

    await client.query('COMMIT');

    return new Response(JSON.stringify({
      success: true,
      data: { id: quotationId, quotationNum: data.quotationNum },
      message: 'Quotation created successfully in PostgreSQL'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    await client.query('ROLLBACK'); // ✅ Error pe rollback
    console.error('Error creating quotation:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    client.release(); // ✅ Hamesha connection release karo
  }
}

// PUT: Update quotation
export async function PUT(request) {
  try {
    const data = await request.json();

    if (!data.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quotation ID required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = `
      UPDATE quotations 
      SET 
        subtotal = $1,
        tax_rate = $2,
        tax_amount = $3,
        grand_total = $4,
        status = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    const result = await query(sql, [
      parseFloat(data.subtotal) || 0,
      parseFloat(data.taxRate) || 0,
      parseFloat(data.tax) || 0,
      parseFloat(data.grandTotal) || 0,
      data.status || 'draft',
      data.id
    ]);

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quotation not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.rows[0],
      message: 'Quotation updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating quotation:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}