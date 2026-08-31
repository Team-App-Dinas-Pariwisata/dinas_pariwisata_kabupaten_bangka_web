import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { activeFacilityInfo } from "@/lib/facilities";
import { getAll, isTruthyDb, type DbRecord } from "@/lib/realtime-db";

function active(rows: DbRecord[]) {
  return rows.filter((row) => isTruthyDb(row.aktif));
}

function alpha(a: unknown, b: unknown) {
  return String(a ?? "").localeCompare(String(b ?? ""), "id", { sensitivity: "base" });
}

function facilityOptions(rows: DbRecord[], table: "hotel" | "kuliner" | "tempat_wisata") {
  return activeFacilityInfo(rows, table).map((facility) => ({
    value: facility.id,
    label: facility.name,
    group: facility.category,
    code: facility.code,
  }));
}

export async function GET(request: NextRequest) {
  if (!(await requireRequestRole(request, "pengguna"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const [
    kategoriBeritaRaw,
    kategoriAcaraRaw,
    kategoriWisataRaw,
    kategoriKulinerRaw,
    jenisHotelRaw,
    kecamatanRaw,
    kelurahanRaw,
    statusKonservasiRaw,
    fasilitasRaw,
  ] = await Promise.all([
    getAll("master_kategori_berita"),
    getAll("master_kategori_acara"),
    getAll("master_kategori_wisata"),
    getAll("master_kategori_kuliner"),
    getAll("master_jenis_hotel"),
    getAll("master_kecamatan"),
    getAll("master_kelurahan"),
    getAll("master_status_konservasi"),
    getAll("master_fasilitas"),
  ]);

  const kategoriBerita = active(kategoriBeritaRaw).sort((a, b) => Number(a.urutan ?? 0) - Number(b.urutan ?? 0) || alpha(a.nama_kategori, b.nama_kategori)).map((r) => ({ value: Number(r.id), label: r.nama_kategori }));
  const kategoriAcara = active(kategoriAcaraRaw).sort((a, b) => Number(a.urutan ?? 0) - Number(b.urutan ?? 0) || alpha(a.nama_kategori, b.nama_kategori)).map((r) => ({ value: Number(r.id), label: r.nama_kategori }));
  const kategoriWisata = active(kategoriWisataRaw).sort((a, b) => alpha(a.nama_kategori, b.nama_kategori)).map((r) => ({ value: Number(r.id), label: r.nama_kategori }));
  const kategoriKuliner = active(kategoriKulinerRaw).sort((a, b) => alpha(a.nama_kategori, b.nama_kategori)).map((r) => ({ value: Number(r.id), label: r.nama_kategori }));
  const jenisHotel = active(jenisHotelRaw).sort((a, b) => alpha(a.nama_jenis, b.nama_jenis)).map((r) => ({ value: Number(r.id), label: r.nama_jenis }));
  const kecamatan = active(kecamatanRaw).sort((a, b) => alpha(a.nama_kecamatan, b.nama_kecamatan)).map((r) => ({ value: Number(r.id), label: r.nama_kecamatan }));
  const kelurahan = [...kelurahanRaw].sort((a, b) => alpha(a.nama_kelurahan, b.nama_kelurahan)).map((r) => ({ value: Number(r.id), label: `${r.jenis ?? ""} ${r.nama_kelurahan ?? ""}`.trim(), parentValue: Number(r.kecamatan_id) }));
  const statusKonservasi = active(statusKonservasiRaw).sort((a, b) => Number(a.urutan_prioritas ?? 0) - Number(b.urutan_prioritas ?? 0) || alpha(a.nama_status, b.nama_status)).map((r) => ({ value: Number(r.id), label: `${r.kode ?? ""} - ${r.nama_status ?? ""}`.trim() }));

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
      "fasilitas-hotel": facilityOptions(fasilitasRaw, "hotel"),
      "fasilitas-kuliner": facilityOptions(fasilitasRaw, "kuliner"),
      "fasilitas-wisata": facilityOptions(fasilitasRaw, "tempat_wisata"),
    },
  });
}
