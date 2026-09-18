import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

type StatistikItem = {
  id: number;
  label: string;
  total: number;
};

export async function GET() {
  try {
    const [kecamatanRows, subsektorRows, totalRows] = await Promise.all([
      db().query<RowDataPacket[]>(`
        SELECT
          k.id,
          k.nama_kecamatan AS label,
          COUNT(p.id) AS total
        FROM master_kecamatan k
        LEFT JOIN pengajuan_ekraf p
          ON k.id = COALESCE(NULLIF(p.kecamatan_usaha_id, 0), NULLIF(p.kecamatan_id, 0))
          AND LOWER(TRIM(p.status)) = 'disetujui'
        WHERE k.aktif = 1
        GROUP BY k.id, k.nama_kecamatan
        ORDER BY total DESC, k.nama_kecamatan ASC
      `),
      db().query<RowDataPacket[]>(`
        SELECT
          s.id,
          s.nama_subsektor AS label,
          COUNT(p.id) AS total
        FROM master_subsektor_ekraf s
        LEFT JOIN pengajuan_ekraf p
          ON s.id = p.subsektor_id
          AND LOWER(TRIM(p.status)) = 'disetujui'
        WHERE s.aktif = 1
        GROUP BY s.id, s.nama_subsektor
        ORDER BY total DESC, s.nama_subsektor ASC
      `),
      db().query<RowDataPacket[]>(`
        SELECT COUNT(*) AS total
        FROM pengajuan_ekraf
        WHERE LOWER(TRIM(status)) = 'disetujui'
      `),
    ]);

    const [kecamatan] = kecamatanRows;
    const [subsektor] = subsektorRows;
    const [total] = totalRows;

    return NextResponse.json(
      {
        total: Number(total[0]?.total ?? 0),
        kecamatan: kecamatan.map((row) => ({
          id: Number(row.id),
          label: String(row.label ?? ""),
          total: Number(row.total ?? 0),
        })) as StatistikItem[],
        subsektor: subsektor.map((row) => ({
          id: Number(row.id),
          label: String(row.label ?? ""),
          total: Number(row.total ?? 0),
        })) as StatistikItem[],
      },
      { headers: noCacheHeaders },
    );
  } catch (error) {
    console.error("Public ekraf statistics error:", error);
    return NextResponse.json(
      { message: "Statistik Pelaku Ekraf belum dapat dimuat." },
      { status: 500, headers: noCacheHeaders },
    );
  }
}
