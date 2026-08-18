import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { db } from "@/lib/db";

const ONLINE_WINDOW_SECONDS = 75;

type CountRow = RowDataPacket & { online_count: number };

export async function GET() {
  try {
    const [rows] = await db().execute<CountRow[]>(
      `SELECT COUNT(*) AS online_count
       FROM staff_chat_presence sp
       INNER JOIN pengguna p ON p.id = sp.user_id
       WHERE p.status = 'active'
         AND p.role IN ('super_admin','admin','operator','verifikator','pengguna')
         AND sp.last_seen_at >= (CURRENT_TIMESTAMP - INTERVAL ${ONLINE_WINDOW_SECONDS} SECOND)`,
    );

    return NextResponse.json(
      { data: { online_count: Number(rows[0]?.online_count ?? 0), online_window_seconds: ONLINE_WINDOW_SECONDS } },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("[chat/presence GET]", error);
    // Agar guest tetap dapat memakai AI walau migration presence belum dijalankan.
    return NextResponse.json(
      { data: { online_count: 0, online_window_seconds: ONLINE_WINDOW_SECONDS } },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !["admin", "pengguna"].includes(user.role)) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    await db().execute<ResultSetHeader>(
      `INSERT INTO staff_chat_presence (user_id, last_seen_at)
       VALUES (?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE last_seen_at = CURRENT_TIMESTAMP`,
      [user.id],
    );
    return NextResponse.json({ data: { online: true } }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[chat/presence POST]", error);
    return NextResponse.json({ message: "Status online petugas belum dapat diperbarui." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !["admin", "pengguna"].includes(user.role)) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    await db().execute<ResultSetHeader>("DELETE FROM staff_chat_presence WHERE user_id = ?", [user.id]);
    return NextResponse.json({ data: { online: false } }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[chat/presence DELETE]", error);
    return NextResponse.json({ message: "Status online petugas belum dapat diperbarui." }, { status: 500 });
  }
}
