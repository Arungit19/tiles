import { query, getClient } from './src/lib/postgres.js';

(async () => {
  try {
    const client = await getClient();
    await client.query('BEGIN');
    const clientRes = await client.query(
      `INSERT INTO clients (name, address, phone, email, created_by_id)
       VALUES ($1, $2, $3, $4, 1)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      ['Test User', '123 Test St', '9999999999', 'test-user@example.com']
    );
    const clientId = clientRes.rows[0].id;
    const quotationRes = await client.query(
      `INSERT INTO quotations (quotation_number, client_id, quote_date, valid_until, subtotal, tax_rate, tax_amount, grand_total, created_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
       RETURNING id`,
      ['TQ-TEST-001', clientId, '2026-05-19', '2026-05-26', 1000, 18, 180, 1180]
    );
    const quotationId = quotationRes.rows[0].id;
    await client.query(
      `INSERT INTO quotation_items (quotation_id, company_name, tile_size, rate_per_sqft, qty_per_box, per_box_rate, number_of_boxes, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [quotationId, 'Test Co', '12x12', 50, 10, 500, 2, 1000]
    );
    await client.query('COMMIT');
    console.log('insert-success', { clientId, quotationId });
  } catch (err) {
    console.error('insert-fail', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
