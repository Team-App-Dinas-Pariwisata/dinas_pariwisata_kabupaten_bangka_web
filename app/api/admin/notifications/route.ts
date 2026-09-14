import type { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { db } from "@/lib/db";
import type { NotificationRow } from "@/lib/notifications";

type CountRow = RowDataPacket & { total: number };
type StatsRow = RowDataPacket & {
  total: number;
  pengajuan_baru: number;
  pengajuan_diperbaiki: number;
  verifikasi: number;
};

export async function GET(request: NextRequest) {
  if (!(await requireRequestRole(request, "admin"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.max(1, Math.min(Number(searchParams.get("pageSize")) || 10, 100));
  const search = (searchParams.get("search") || "").trim();
  const role = (searchParams.get("role") || "").trim();
  const jenis = (searchParams.get("jenis") || "").trim();
  const tipe = (searchParams.get("tipe") || "").trim();

  try {
    const whereClauses: string[] = ["1=1"];
    const queryParams: (string | number)[] = [];

    if (search) {
      whereClauses.push("(judul LIKE ? OR pesan LIKE ? OR pengirim_nama LIKE ?)");
      const term = `%${search}%`;
      queryParams.push(term, term, term);
    }

    if (role && role !== "all") {
      whereClauses.push("target_role = ?");
      queryParams.push(role);
    }

    if (jenis && jenis !== "all") {
      whereClauses.push("jenis = ?");
      queryParams.push(jenis);
    }

    if (tipe && tipe !== "all") {
      whereClauses.push("referensi_tipe = ?");
      queryParams.push(tipe);
    }

    const whereSql = whereClauses.join(" AND ");

    // Query Total Count
    const [countRows] = await db().query<CountRow[]>(
      `SELECT COUNT(*) AS total FROM notifikasi WHERE ${whereSql}`,
      queryParams,
    );
    const total = Number(countRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const offset = (page - 1) * pageSize;

    // Query Paged Data
    const [rows] = await db().query<(RowDataPacket & NotificationRow)[]>(
      `SELECT id, target_role, target_user_id, judul, pesan, jenis, referensi_tipe, referensi_id, pengirim_nama, is_read, created_at
       FROM notifikasi
       WHERE ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, pageSize, offset],
    );

    // Query Stats
    const [statsRows] = await db().query<StatsRow[]>(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN jenis = 'pengajuan_baru' THEN 1 ELSE 0 END) AS pengajuan_baru,
        SUM(CASE WHEN jenis = 'pengajuan_diperbaiki' THEN 1 ELSE 0 END) AS pengajuan_diperbaiki,
        SUM(CASE WHEN jenis = 'verifikasi' THEN 1 ELSE 0 END) AS verifikasi
      FROM notifikasi
    `);
    const statsData = statsRows[0] || { total: 0, pengajuan_baru: 0, pengajuan_diperbaiki: 0, verifikasi: 0 };

    return NextResponse.json({
      data: rows,
      total,
      page,
      pageSize,
      totalPages,
      stats: {
        total: Number(statsData.total ?? 0),
        pengajuanBaru: Number(statsData.pengajuan_baru ?? 0),
        pengajuanDiperbaiki: Number(statsData.pengajuan_diperbaiki ?? 0),
        verifikasi: Number(statsData.verifikasi ?? 0),
      },
    });
  } catch (error) {
    console.error("[api/admin/notifications] GET error:", error);
    return NextResponse.json({ message: "Gagal memuat riwayat notifikasi." }, { status: 500 });
  }
}
