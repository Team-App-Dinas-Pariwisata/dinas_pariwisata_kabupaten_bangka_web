import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

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
          ON k.id = COALESCE(p.kecamatan_usaha_id, p.kecamatan_id)
          AND p.status = 'Disetujui'
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
          AND p.status = 'Disetujui'
        WHERE s.aktif = 1
        GROUP BY s.id, s.nama_subsektor
        ORDER BY total DESC, s.nama_subsektor ASC
      `),
      db().query<RowDataPacket[]>(`
        SELECT COUNT(*) AS total
        FROM pengajuan_ekraf
        WHERE status = 'Disetujui'
      `),
    ]);

    const [kecamatan] = kecamatanRows;
    const [subsektor] = subsektorRows;
    const [total] = totalRows;

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Public ekraf statistics error:", error);
    return NextResponse.json(
      { message: "Statistik Pelaku Ekraf belum dapat dimuat." },
      { status: 500 },
    );
  }
}
