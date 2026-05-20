import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query } from "@/lib/postgres";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thisMonthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const [
    totalResult,
    draftResult,
    approvedResult,
    revenueResult,
    thisMonthResult,
    recentResult,
    topClientsResult,
  ] = await Promise.all([
    query(`SELECT COUNT(*) FROM quotations WHERE is_deleted = false`),
    query(`SELECT COUNT(*) FROM quotations WHERE status = 'DRAFT' AND is_deleted = false`),
    query(`SELECT COUNT(*) FROM quotations WHERE status = 'APPROVED' AND is_deleted = false`),
    query(`SELECT SUM(grand_total) FROM quotations WHERE status IN ('APPROVED', 'CONVERTED') AND is_deleted = false`),
    query(
      `SELECT COUNT(*) FROM quotations WHERE created_at >= $1 AND is_deleted = false`,
      [thisMonthStart]
    ),
    query(
      `SELECT q.id, q.quotation_number, q.quote_date, q.grand_total, q.status, q.created_at AS "createdAt",
              c.name as client_name
       FROM quotations q
       LEFT JOIN clients c ON q.client_id = c.id
       WHERE q.is_deleted = false
       ORDER BY q.created_at DESC
       LIMIT 5`
    ),
    query(
      `SELECT c.id, c.name, c.phone, c.email,
              COUNT(q.id) as quotation_count
       FROM clients c
       LEFT JOIN quotations q ON c.id = q.client_id
       GROUP BY c.id
       ORDER BY quotation_count DESC
       LIMIT 5`
    ),
  ]);

  return NextResponse.json({
    totalQuotations: parseInt(totalResult.rows[0].count),
    draftCount: parseInt(draftResult.rows[0].count),
    approvedCount: parseInt(approvedResult.rows[0].count),
    totalRevenue: parseFloat(revenueResult.rows[0].sum) || 0,
    thisMonthCount: parseInt(thisMonthResult.rows[0].count),
    recentQuotations: recentResult.rows.map((r) => ({
      ...r,
      client: { name: r.client_name },
    })),
    topClients: topClientsResult.rows.map((r) => ({
      ...r,
      _count: { quotations: parseInt(r.quotation_count) },
    })),
  });
}
