import type { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await requireRequestRole(request, "pengguna"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const [
    [kategoriBerita],
    [kategoriAcara],
    [kategoriWisata],
    [kategoriKuliner],
    [jenisHotel],
    [kecamatan],
    [kelurahan],
    [statusKonservasi],
    [fasilitas],
  ] = await Promise.all([
    db().execute<RowDataPacket[]>(
      "SELECT id value, nama_kategori label FROM master_kategori_berita WHERE aktif = 1 ORDER BY urutan, nama_kategori",
    ),
    db().execute<RowDataPacket[]>(
      "SELECT id value, nama_kategori label FROM master_kategori_acara WHERE aktif = 1 ORDER BY urutan, nama_kategori",
    ),
    db().execute<RowDataPacket[]>(
      "SELECT id value, nama_kategori label FROM master_kategori_wisata WHERE aktif = 1 ORDER BY nama_kategori",
    ),
    db().execute<RowDataPacket[]>(
      "SELECT id value, nama_kategori label FROM master_kategori_kuliner WHERE aktif = 1 ORDER BY nama_kategori",
    ),
    db().execute<RowDataPacket[]>(
      "SELECT id value, nama_jenis label FROM master_jenis_hotel WHERE aktif = 1 ORDER BY nama_jenis",
    ),
    db().execute<RowDataPacket[]>(
      "SELECT id value, nama_kecamatan label FROM master_kecamatan WHERE aktif = 1 ORDER BY nama_kecamatan",
    ),
    db().execute<RowDataPacket[]>(
      "SELECT id value, CONCAT(jenis, ' ', nama_kelurahan) label, kecamatan_id parentValue FROM master_kelurahan ORDER BY nama_kelurahan",
    ),
    db().execute<RowDataPacket[]>(
      "SELECT id value, CONCAT(kode, ' - ', nama_status) label FROM master_status_konservasi WHERE aktif = 1 ORDER BY urutan_prioritas, nama_status",
    ),
    db().execute<RowDataPacket[]>("SELECT id value, nama_fasilitas label, kategori groupName FROM master_fasilitas WHERE aktif = 1 ORDER BY kategori, nama_fasilitas"),
  ]);

  return NextResponse.json({
    data: {
      "kategori-berita": kategoriBerita,
      "kategori-acara": kategoriAcara,
      "kategori-wisata": kategoriWisata,
      "kategori-kuliner": kategoriKuliner,
      "jenis-hotel": jenisHotel,
      kecamatan,
      kelurahan,
      "status-konservasi": statusKonservasi,
      "fasilitas-hotel": fasilitas.filter((item) => ["Umum", "Hotel", "Aksesibilitas", "Keamanan"].includes(String(item.groupName))),
      "fasilitas-kuliner": fasilitas.filter((item) => ["Umum", "Kuliner", "Aksesibilitas", "Keamanan"].includes(String(item.groupName))),
      "fasilitas-wisata": fasilitas.filter((item) => ["Umum", "Wisata", "Aksesibilitas", "Keamanan"].includes(String(item.groupName))),
    },
  });
}
