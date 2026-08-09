import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { browserSafeR2ImageUrl } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublicBeritaRow = RowDataPacket & {
  id: number;
  slug: string;
  judul: string;
  subjudul: string | null;
  ringkasan: string | null;
  penulis_tampil: string | null;
  sumber_url: string | null;
  foto_utama: string | null;
  foto_alt: string | null;
  headline: number;
  urutan_tampil: number;
  tanggal_publikasi: Date | string | null;
  nama_kategori: string | null;
};

export async function GET() {
  try {
    const [rows] = await db().execute<PublicBeritaRow[]>(`
      SELECT
        b.id,
        b.slug,
        b.judul,
        b.subjudul,
        b.ringkasan,
        b.penulis_tampil,
        b.sumber_url,
        b.foto_utama,
        b.foto_alt,
        b.headline,
        b.urutan_tampil,
        b.tanggal_publikasi,
        mkb.nama_kategori
      FROM berita b
      LEFT JOIN master_kategori_berita mkb ON mkb.id = b.kategori_berita_id
      WHERE
        b.aktif = 1
        AND b.dipublikasikan = 1
        AND b.tanggal_publikasi IS NOT NULL
        AND b.tanggal_publikasi <= NOW()
      ORDER BY
        b.headline DESC,
        b.urutan_tampil ASC,
        b.tanggal_publikasi DESC,
        b.id DESC
      LIMIT 6
    `);

    return NextResponse.json(
      { data: rows.map((row) => ({ ...row, foto_utama: browserSafeR2ImageUrl(row.foto_utama) })) },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Public berita error:", error);
    return NextResponse.json(
      { message: "Berita belum dapat dimuat dari database.", data: [] },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
