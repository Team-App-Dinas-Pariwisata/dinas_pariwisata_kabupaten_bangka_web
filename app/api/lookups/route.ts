import type { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await requireRequestRole(request, "pengguna"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const [[kategoriBerita], [kategoriAcara]] = await Promise.all([
    db().execute<RowDataPacket[]>(
      "SELECT id value, nama_kategori label FROM master_kategori_berita WHERE aktif = 1 ORDER BY urutan, nama_kategori",
    ),
    db().execute<RowDataPacket[]>(
      "SELECT id value, nama_kategori label FROM master_kategori_acara WHERE aktif = 1 ORDER BY urutan, nama_kategori",
    ),
  ]);

  return NextResponse.json({ data: { "kategori-berita": kategoriBerita, "kategori-acara": kategoriAcara } });
}
