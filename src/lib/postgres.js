import pkg from 'pg';
const { Pool } = pkg;

const poolConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
} : {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'jaibalaji_quotations_db',
};

const pool = new Pool(poolConfig);

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name TEXT,
      address TEXT,
      phone TEXT,
      email TEXT UNIQUE,
      created_by_id INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quotations (
      id SERIAL PRIMARY KEY,
      quotation_number TEXT UNIQUE,
      client_id INTEGER REFERENCES clients(id),
      quote_date DATE,
      valid_until DATE,
      subtotal NUMERIC(18,2) DEFAULT 0,
      tax_rate NUMERIC(5,2) DEFAULT 0,
      tax_amount NUMERIC(18,2) DEFAULT 0,
      grand_total NUMERIC(18,2) DEFAULT 0,
      status TEXT DEFAULT 'draft',
      is_deleted BOOLEAN DEFAULT false,
      deleted_at TIMESTAMP WITH TIME ZONE,
      created_by_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quotation_items (
      id SERIAL PRIMARY KEY,
      quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
      company_name TEXT,
      tile_size TEXT,
      rate_per_sqft NUMERIC(18,2) DEFAULT 0,
      qty_per_box INTEGER DEFAULT 0,
      per_box_rate NUMERIC(18,2) DEFAULT 0,
      number_of_boxes INTEGER DEFAULT 0,
      total_amount NUMERIC(18,2) DEFAULT 0,
      photo_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT fk_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name TEXT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_trail (
      id SERIAL PRIMARY KEY,
      quotation_id INTEGER REFERENCES quotations(id),
      action TEXT,
      action_type TEXT,
      new_values JSONB,
      old_values JSONB,
      changed_by_id INTEGER REFERENCES users(id),
      deleted_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // ── Migrations: add missing columns to existing tables ──
await pool.query(`
  ALTER TABLE audit_trail
    ADD COLUMN IF NOT EXISTS action_type TEXT,
    ADD COLUMN IF NOT EXISTS new_values JSONB,
    ADD COLUMN IF NOT EXISTS old_values JSONB,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
`);

await pool.query(`
  ALTER TABLE quotations
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
`);

await pool.query(`
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS password TEXT;
`);

await pool.query(`
  ALTER TABLE quotation_items
    ADD COLUMN IF NOT EXISTS photo_url TEXT;
`);

await pool.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
`);

await pool.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

  // Create indexes for performance
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON quotations(client_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_quotations_quotation_number ON quotations(quotation_number);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_trail_quotation_id ON audit_trail(quotation_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_quotations_is_deleted ON quotations(is_deleted);
  `);
}

const initializeDb = ensureSchema().catch((err) => {
  console.error('Database schema initialization failed:', err);
});

pool.on('error', (err) => {
  console.error('Idle client error:', err);
});

// ============================================
// Export Functions
// ============================================

export async function query(text, params) {
  await initializeDb;
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

export async function getClient() {
  await initializeDb;
  return await pool.connect();
}

// ============================================
// DELETE HELPER FUNCTIONS
// ============================================

/**
 * Delete single quotation with cascade
 * @param {number} quotationId - ID of quotation to delete
 * @param {number} userId - ID of user performing deletion
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteSingleQuotation(quotationId, userId) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Get quotation details before deleting
    const quotationResult = await client.query(
      `SELECT id, quotation_number FROM quotations WHERE id = $1`,
      [quotationId]
    );

    if (quotationResult.rows.length === 0) {
      throw new Error('Quotation not found');
    }

    // Delete cascade (items deleted automatically due to FK constraint)
    await client.query(
      `DELETE FROM quotation_items WHERE quotation_id = $1`,
      [quotationId]
    );

    // Delete from quotations
    const deleteResult = await client.query(
      `DELETE FROM quotations WHERE id = $1 RETURNING id, quotation_number, grand_total`,
      [quotationId]
    );

    // Log to audit trail
    await client.query(
      `INSERT INTO audit_trail (quotation_id, action, action_type, changed_by_id, deleted_at, created_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [quotationId, 'DELETE', 'QUOTATION_DELETED', userId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      deleted: deleteResult.rows[0]
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete multiple quotations
 * @param {number[]} quotationIds - Array of quotation IDs to delete
 * @param {number} userId - ID of user performing deletion
 * @returns {Promise<Object>} Bulk deletion result
 */
export async function bulkDeleteQuotations(quotationIds, userId) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    if (!Array.isArray(quotationIds) || quotationIds.length === 0) {
      throw new Error('Invalid quotation IDs');
    }

    // Delete items first (cascade)
    await client.query(
      `DELETE FROM quotation_items WHERE quotation_id = ANY($1)`,
      [quotationIds]
    );

    // Delete quotations
    const deleteResult = await client.query(
      `DELETE FROM quotations WHERE id = ANY($1) RETURNING id, quotation_number, grand_total`,
      [quotationIds]
    );

    // Log each deletion
    for (const id of quotationIds) {
      await client.query(
        `INSERT INTO audit_trail (quotation_id, action, action_type, changed_by_id, deleted_at, created_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [id, 'BULK_DELETE', 'QUOTATION_BULK_DELETED', userId]
      );
    }

    await client.query('COMMIT');

    return {
      success: true,
      deleted_count: deleteResult.rowCount,
      deleted_quotations: deleteResult.rows
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk delete error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Soft delete - mark quotation as deleted without removing
 * @param {number} quotationId - ID of quotation to soft delete
 * @param {number} userId - ID of user performing deletion
 * @returns {Promise<Object>} Soft deletion result
 */
export async function softDeleteQuotation(quotationId, userId) {
  try {
    const result = await query(
      `UPDATE quotations 
       SET is_deleted = true, deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING id, quotation_number`,
      [quotationId]
    );

    // Log to audit trail
    await query(
      `INSERT INTO audit_trail (quotation_id, action, action_type, changed_by_id, deleted_at, created_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [quotationId, 'SOFT_DELETE', 'QUOTATION_SOFT_DELETED', userId]
    );

    return {
      success: true,
      deleted: result.rows[0]
    };

  } catch (error) {
    console.error('Soft delete error:', error);
    throw error;
  }
}

/**
 * Restore soft-deleted quotation
 * @param {number} quotationId - ID of quotation to restore
 * @param {number} userId - ID of user performing restoration
 * @returns {Promise<Object>} Restoration result
 */
export async function restoreQuotation(quotationId, userId) {
  try {
    const result = await query(
      `UPDATE quotations 
       SET is_deleted = false, deleted_at = NULL, updated_at = NOW()
       WHERE id = $1 AND is_deleted = true
       RETURNING id, quotation_number`,
      [quotationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Quotation not found or not deleted');
    }

    // Log to audit trail
    await query(
      `INSERT INTO audit_trail (quotation_id, action, action_type, changed_by_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [quotationId, 'RESTORE', 'QUOTATION_RESTORED', userId]
    );

    return {
      success: true,
      restored: result.rows[0]
    };

  } catch (error) {
    console.error('Restore error:', error);
    throw error;
  }
}

/**
 * Get all quotations (excluding soft-deleted by default)
 * @param {boolean} includeDeleted - Include soft-deleted quotations
 * @returns {Promise<Array>} Array of quotations
 */
export async function getAllQuotations(includeDeleted = false) {
  try {
    const condition = includeDeleted ? '' : 'WHERE is_deleted = false';
    
    const result = await query(`
      SELECT 
        q.id,
        q.quotation_number,
        q.quote_date,
        q.valid_until,
        q.grand_total,
        q.status,
        q.is_deleted,
        q.deleted_at,
        c.name as client_name,
        c.phone as client_phone,
        c.email as client_email,
        COUNT(qi.id) as item_count,
        q.created_at,
        q.created_by_id
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
      ${condition}
      GROUP BY q.id, c.id
      ORDER BY q.created_at DESC
    `);

    return result.rows;

  } catch (error) {
    console.error('Get quotations error:', error);
    throw error;
  }
}

/**
 * Get single quotation with all items
 * @param {number} quotationId - ID of quotation
 * @returns {Promise<Object>} Quotation with items
 */
export async function getQuotationById(quotationId) {
  try {
    const result = await query(`
      SELECT 
        q.id,
        q.quotation_number,
        q.quote_date,
        q.valid_until,
        q.subtotal,
        q.tax_rate,
        q.tax_amount,
        q.grand_total,
        q.status,
        q.created_at,
        q.created_by_id,
        c.name as client_name,
        c.address as client_address,
        c.phone as client_phone,
        c.email as client_email,
        json_agg(json_build_object(
          'id', qi.id,
          'companyName', qi.company_name,
          'tileSize', qi.tile_size,
          'ratePerSqft', qi.rate_per_sqft,
          'qtyPerBox', qi.qty_per_box,
          'perBoxRate', qi.per_box_rate,
          'numBoxes', qi.number_of_boxes,
          'totalAmount', qi.total_amount,
          'photoUrl', qi.photo_url
        )) FILTER (WHERE qi.id IS NOT NULL) as items
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
      WHERE q.id = $1
      GROUP BY q.id, c.id
    `, [quotationId]);

    return result.rows[0] || null;

  } catch (error) {
    console.error('Get quotation error:', error);
    throw error;
  }
}

/**
 * Get audit trail for quotation
 * @param {number} quotationId - ID of quotation
 * @returns {Promise<Array>} Audit trail records
 */
export async function getAuditTrail(quotationId) {
  try {
    const result = await query(`
      SELECT 
        id,
        quotation_id,
        action,
        action_type,
        new_values,
        old_values,
        changed_by_id,
        deleted_at,
        created_at
      FROM audit_trail
      WHERE quotation_id = $1
      ORDER BY created_at DESC
    `, [quotationId]);

    return result.rows;

  } catch (error) {
    console.error('Get audit trail error:', error);
    throw error;
  }
}

export default pool;