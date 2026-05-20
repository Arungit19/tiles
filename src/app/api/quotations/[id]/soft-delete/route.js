// src/app/api/quotations/[id]/soft-delete/route.js
// Soft delete - marks quotation as deleted without removing data

import { softDeleteQuotation } from '@/lib/postgres';

export async function POST(request, { params }) {
  try {
    const { id } = params;

    console.log('⊘ SOFT DELETE request for ID:', id);

    if (!id) {
      return Response.json(
        { success: false, error: 'Quotation ID is required' },
        { status: 400 }
      );
    }

    // Validate ID is numeric
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      console.error('❌ Invalid ID format (NaN):', id);
      return Response.json(
        { success: false, error: 'Invalid quotation ID format' },
        { status: 400 }
      );
    }

    // Get user ID from header
    const userId = parseInt(request.headers.get('x-user-id') || '1', 10);

    console.log(`⊘ Soft deleting quotation ${numId} by user ${userId}`);

    const result = await softDeleteQuotation(numId, userId);

    console.log('✅ Quotation soft deleted:', result);

    return Response.json({
      success: true,
      message: 'Quotation marked as deleted',
      data: result.deleted,
    });
  } catch (error) {
    console.error('❌ SOFT DELETE error:', error.message);

    if (error.message.includes('Quotation not found')) {
      return Response.json(
        { success: false, error: 'Quotation not found' },
        { status: 404 }
      );
    }

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}