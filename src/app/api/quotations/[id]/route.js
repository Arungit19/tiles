// src/app/api/quotations/[id]/route.js

import { query, getClient, deleteSingleQuotation, bulkDeleteQuotations, getQuotationById } from '@/lib/postgres';

export async function GET(request, { params }) {
  try {
    const { id } = await params;   // ✅ await params

    if (!id) {
      return Response.json({ success: false, error: 'Quotation ID is required' }, { status: 400 });
    }

    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return Response.json({ success: false, error: 'Invalid quotation ID format' }, { status: 400 });
    }

    const quotation = await getQuotationById(numId);

    if (!quotation) {
      return Response.json({ success: false, error: 'Quotation not found' }, { status: 404 });
    }

    return Response.json({ success: true, data: quotation });
  } catch (error) {
    console.error('❌ GET quotation error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;   // ✅ await params

    console.log('🗑️ DELETE request received for ID:', id);

    if (!id) {
      return Response.json({ success: false, error: 'Quotation ID is required' }, { status: 400 });
    }

    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      console.error('❌ Invalid ID format (NaN):', id);
      return Response.json({ success: false, error: 'Invalid quotation ID format' }, { status: 400 });
    }

    const userId = parseInt(request.headers.get('x-user-id') || '1', 10);
    const result = await deleteSingleQuotation(numId, userId);

    return Response.json({
      success: true,
      message: 'Quotation deleted successfully',
      deletedId: numId,
      data: result.deleted,
    });
  } catch (error) {
    console.error('❌ DELETE quotation error:', error.message);

    if (error.message.includes('Quotation not found')) {
      return Response.json({ success: false, error: 'Quotation not found' }, { status: 404 });
    }
    if (error.message.includes('violates foreign key')) {
      return Response.json({ success: false, error: 'Cannot delete quotation with references' }, { status: 400 });
    }

    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;   // ✅ await params
    const updateData = await request.json();

    if (!id) {
      return Response.json({ success: false, error: 'Quotation ID is required' }, { status: 400 });
    }

    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return Response.json({ success: false, error: 'Invalid quotation ID format' }, { status: 400 });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    const fieldMapping = {
      date: 'quote_date',
      validUntil: 'valid_until',
      subtotal: 'subtotal',
      taxRate: 'tax_rate',
      tax: 'tax_amount',
      grandTotal: 'grand_total',
      status: 'status',
    };

    for (const [field, dbColumn] of Object.entries(fieldMapping)) {
      if (updateData[field] !== undefined) {
        updates.push(`${dbColumn} = $${paramCount++}`);
        if (['subtotal', 'tax', 'grandTotal'].includes(field)) {
          values.push(parseFloat(updateData[field]) || 0);
        } else if (field === 'taxRate') {
          values.push(parseInt(updateData[field], 10) || 0);
        } else {
          values.push(updateData[field]);
        }
      }
    }

    if (updates.length === 0) {
      return Response.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    values.push(numId);

    const result = await query(
      `UPDATE quotations SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, quotation_number, quote_date, valid_until, subtotal, tax_rate, tax_amount, grand_total, status, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return Response.json({ success: false, error: 'Quotation not found' }, { status: 404 });
    }

    return Response.json({ success: true, data: result.rows[0], message: 'Quotation updated successfully' });
  } catch (error) {
    console.error('❌ PUT quotation error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}