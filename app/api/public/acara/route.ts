import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { browserSafeR2ImageUrl } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublicAcaraRow = RowDataPacket & {
  id: number;
  slug: string;
  nama_acara: string;
  ringkasan: string | null;
  deskripsi: string;
  tanggal_mulai: Date | string;
  tanggal_selesai: Date | string;
  status_acara: string;
  jenis_pelaksanaan: string;
  nama_lokasi: string | null;
  alamat: string | null;
  tautan_daring: string | null;
  penyelenggara: string | null;
  memerlukan_pendaftaran: number;
  tautan_pendaftaran: string | null;
  foto_utama: string | null;
  foto_alt: string | null;
  unggulan: number;
  urutan_tampil: number;
  tanggal_publikasi: Date | string | null;
  nama_kategori: string | null;
};

export async function GET() {
  try {
    const [rows] = await db().execute<PublicAcaraRow[]>(`
      SELECT
        a.id,
        a.slug,
        a.nama_acara,
        a.ringkasan,
        a.deskripsi,
        a.tanggal_mulai,
        a.tanggal_selesai,
        a.status_acara,
        a.jenis_pelaksanaan,
        a.nama_lokasi,
        a.alamat,
        a.tautan_daring,
        a.penyelenggara,
        a.memerlukan_pendaftaran,
        a.tautan_pendaftaran,
        a.foto_utama,
        a.foto_alt,
        a.unggulan,
        a.urutan_tampil,
        a.tanggal_publikasi,
        mka.nama_kategori
      FROM acara a
      LEFT JOIN master_kategori_acara mka ON mka.id = a.kategori_acara_id
      WHERE
        a.aktif = 1
        AND a.dipublikasikan = 1
        AND a.tanggal_publikasi IS NOT NULL
        AND a.tanggal_publikasi <= NOW()
        AND a.status_acara <> 'Dibatalkan'
      ORDER BY
        CASE WHEN a.tanggal_selesai >= NOW() THEN 0 ELSE 1 END ASC,
        a.unggulan DESC,
        a.urutan_tampil ASC,
        CASE WHEN a.tanggal_selesai >= NOW() THEN a.tanggal_mulai END ASC,
        a.tanggal_mulai DESC,
        a.id DESC
      LIMIT 6
    `);

    return NextResponse.json(
      { data: rows.map((row) => ({ ...row, foto_utama: browserSafeR2ImageUrl(row.foto_utama) })) },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Public acara error:", error);
    return NextResponse.json(
      { message: "Acara belum dapat dimuat dari database.", data: [] },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
