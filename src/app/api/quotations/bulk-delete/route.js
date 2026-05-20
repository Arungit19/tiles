// src/app/api/quotations/bulk-delete/route.js
// Handle bulk deletion of multiple quotations

import { bulkDeleteQuotations } from '@/lib/postgres';

export async function POST(request) {
  try {
    const body = await request.json();
    const { ids } = body;

    console.log('🗑️ BULK DELETE request for IDs:', ids);

    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json(
        { success: false, error: 'ids must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate all IDs are numeric - CRITICAL: Don't send NaN to database
    const numIds = ids.map(id => {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) {
        throw new Error(`Invalid ID format: ${id}`);
      }
      return numId;
    });

    console.log('✓ Validated IDs:', numIds);

    // Get user ID from header (optional, defaults to 1)
    const userId = parseInt(request.headers.get('x-user-id') || '1', 10);

    // Use the helper function - handles transactions, cascade, and audit trail
    const result = await bulkDeleteQuotations(numIds, userId);

    console.log('✅ Bulk delete completed:', result);

    return Response.json({
      success: true,
      message: `Successfully deleted ${result.deleted_count} quotation(s)`,
      deletedCount: result.deleted_count,
      deletedQuotations: result.deleted_quotations,
    });
  } catch (error) {
    console.error('❌ BULK DELETE error:', error.message);

    // Check for specific error types
    if (error.message.includes('Invalid ID format')) {
      return Response.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (error.message.includes('violates foreign key')) {
      return Response.json(
        { success: false, error: 'Cannot delete quotations with references' },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}