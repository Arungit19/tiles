import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query } from "@/lib/postgres";

export async function GET(req) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  let result;
  if (search) {
    result = await query(
      `SELECT c.id, c.name, c.phone, c.email, c.address, c.created_at,
              COUNT(q.id) as quotation_count
       FROM clients c
       LEFT JOIN quotations q ON c.id = q.client_id
       WHERE c.name ILIKE $1 OR c.phone LIKE $2
       GROUP BY c.id
       ORDER BY c.name ASC`,
      [`%${search}%`, `%${search}%`]
    );
  } else {
    result = await query(
      `SELECT c.id, c.name, c.phone, c.email, c.address, c.created_at,
              COUNT(q.id) as quotation_count
       FROM clients c
       LEFT JOIN quotations q ON c.id = q.client_id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
  }

  const clients = result.rows.map((c) => ({
    ...c,
    _count: { quotations: parseInt(c.quotation_count) },
  }));

  return NextResponse.json(clients);
}

export async function POST(req) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const result = await query(
    `INSERT INTO clients (name, phone, email, address) VALUES ($1, $2, $3, $4) RETURNING *`,
    [body.name, body.phone || null, body.email || null, body.address || null]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
