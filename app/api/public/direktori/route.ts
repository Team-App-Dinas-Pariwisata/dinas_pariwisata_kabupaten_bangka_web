import type { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keyFromR2SubmissionStorageReference } from "@/lib/r2";

export const runtime = "nodejs";

type DirectoryType = "ekraf" | "sdm" | "komunitas";

type DirectoryItem = {
  id: number;
  type: DirectoryType;
  title: string;
  subtitle: string | null;
  category: string | null;
  location: string | null;
  description: string | null;
  image: string | null;
  unggulan: number;
  updated_at: string | null;
};


function exposePublicImage(item: DirectoryItem): DirectoryItem {
  if (!item.image) return item;

  // File pengajuan di R2 disimpan melalui endpoint privat yang hanya bisa
  // dibuka oleh petugas/pemilik. Untuk direktori publik, jangan kirim URL
  // privat tersebut langsung ke browser. Gunakan endpoint publik yang akan
  // memvalidasi bahwa data memang sudah disetujui sebelum mengalirkan gambar.
  const managedKey = keyFromR2SubmissionStorageReference(item.image);
  if (!managedKey) return item;

  const params = new URLSearchParams({
    type: item.type,
    id: String(item.id),
  });

  return {
    ...item,
    image: `/api/public/direktori/image?${params.toString()}`,
  };
}

function validType(value: string | null): value is DirectoryType {
  return value === "ekraf" || value === "sdm" || value === "komunitas";
}

function safeLimit(value: string | null) {
  const parsed = Number(value ?? 24);
  if (!Number.isFinite(parsed)) return 24;
  return Math.min(60, Math.max(1, Math.floor(parsed)));
}

function like(value: string) {
  return `%${value}%`;
}

async function loadEkraf(query: string, limit: number, featuredOnly: boolean) {
  const params: unknown[] = [];
  let searchSql = "";
  if (query) {
    const term = like(query);
    searchSql = `AND (
      p.nama_lengkap LIKE ?
      OR p.nama_usaha LIKE ?
      OR p.nama_merek LIKE ?
      OR s.nama_subsektor LIKE ?
      OR p.deskripsi_usaha LIKE ?
      OR p.produk_jasa LIKE ?
      OR k.nama_kecamatan LIKE ?
      OR l.nama_kelurahan LIKE ?
    )`;
    params.push(term, term, term, term, term, term, term, term);
  }
  if (featuredOnly) searchSql += " AND p.unggulan = 1";
  params.push(limit);

  const [rows] = await db().query<RowDataPacket[]>(`
    SELECT
      p.id,
      'ekraf' AS type,
      COALESCE(NULLIF(p.nama_merek, ''), p.nama_usaha) AS title,
      p.nama_lengkap AS subtitle,
      s.nama_subsektor AS category,
      COALESCE(l.nama_kelurahan, k.nama_kecamatan, NULLIF(p.alamat_usaha, '')) AS location,
      COALESCE(NULLIF(p.deskripsi_usaha, ''), NULLIF(p.produk_jasa, '')) AS description,
      COALESCE(NULLIF(p.file_logo_usaha, ''), NULLIF(p.file_foto_dokumentasi, ''), NULLIF(p.file_foto_diri, '')) AS image,
      p.unggulan,
      p.updated_at
    FROM pengajuan_ekraf p
    LEFT JOIN master_subsektor_ekraf s ON s.id = p.subsektor_id
    LEFT JOIN master_kecamatan k ON k.id = p.kecamatan_usaha_id
    LEFT JOIN master_kelurahan l ON l.id = p.kelurahan_usaha_id
    WHERE p.status = 'Disetujui'
      ${searchSql}
    ORDER BY p.unggulan DESC, p.tanggal_verifikasi DESC, p.updated_at DESC
    LIMIT ?`, params);

  return (rows as unknown as DirectoryItem[]).map(exposePublicImage);
}

async function loadSdm(query: string, limit: number) {
  const params: unknown[] = [];
  let searchSql = "";
  if (query) {
    const term = like(query);
    searchSql = `AND (
      p.nama_lengkap LIKE ?
      OR p.jabatan LIKE ?
      OR p.tempat_bertugas LIKE ?
    )`;
    params.push(term, term, term);
  }
  params.push(limit);

  const [rows] = await db().query<RowDataPacket[]>(`
    SELECT
      p.id,
      'sdm' AS type,
      p.nama_lengkap AS title,
      p.jabatan AS subtitle,
      'SDM Pariwisata' AS category,
      p.tempat_bertugas AS location,
      CONCAT('Bertugas sebagai ', p.jabatan, ' di ', p.tempat_bertugas, '.') AS description,
      NULLIF(p.file_foto_diri, '') AS image,
      0 AS unggulan,
      p.updated_at
    FROM pengajuan_sdm_pariwisata p
    WHERE p.status_pengajuan = 'Disetujui'
      AND p.persetujuan_publikasi = 1
      ${searchSql}
    ORDER BY p.tanggal_verifikasi DESC, p.updated_at DESC
    LIMIT ?`, params);

  return (rows as unknown as DirectoryItem[]).map(exposePublicImage);
}

async function loadKomunitas(query: string, limit: number) {
  const params: unknown[] = [];
  let searchSql = "";
  if (query) {
    const term = like(query);
    searchSql = `AND (
      p.nama_organisasi LIKE ?
      OR p.kategori LIKE ?
      OR s.nama_subsektor LIKE ?
      OR p.rincian LIKE ?
      OR k.nama_kecamatan LIKE ?
      OR l.nama_kelurahan LIKE ?
    )`;
    params.push(term, term, term, term, term, term);
  }
  params.push(limit);

  const [rows] = await db().query<RowDataPacket[]>(`
    SELECT
      p.id,
      'komunitas' AS type,
      p.nama_organisasi AS title,
      p.kategori AS subtitle,
      COALESCE(s.nama_subsektor, p.kategori) AS category,
      CONCAT_WS(', ', l.nama_kelurahan, k.nama_kecamatan) AS location,
      NULLIF(p.rincian, '') AS description,
      COALESCE(NULLIF(p.file_logo_organisasi, ''), NULLIF(p.file_foto_dokumentasi, '')) AS image,
      0 AS unggulan,
      p.updated_at
    FROM pengajuan_komunitas_asosiasi p
    LEFT JOIN master_subsektor_ekraf s ON s.id = p.subsektor_id
    LEFT JOIN master_kecamatan k ON k.id = p.kecamatan_id
    LEFT JOIN master_kelurahan l ON l.id = p.kelurahan_id
    WHERE p.status_pengajuan = 'Disetujui'
      AND p.persetujuan_publikasi = 1
      ${searchSql}
    ORDER BY p.tanggal_verifikasi DESC, p.updated_at DESC
    LIMIT ?`, params);

  return (rows as unknown as DirectoryItem[]).map(exposePublicImage);
}

export async function GET(request: NextRequest) {
  const requestedType = request.nextUrl.searchParams.get("type");
  const query = String(request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  const featuredOnly = request.nextUrl.searchParams.get("unggulan") === "1";
  const limit = safeLimit(request.nextUrl.searchParams.get("limit"));

  if (requestedType && !validType(requestedType)) {
    return NextResponse.json({ message: "Jenis direktori tidak valid." }, { status: 400 });
  }

  try {
    if (requestedType === "ekraf") {
      return NextResponse.json({ data: await loadEkraf(query, limit, featuredOnly) });
    }
    if (requestedType === "sdm") {
      return NextResponse.json({ data: await loadSdm(query, limit) });
    }
    if (requestedType === "komunitas") {
      return NextResponse.json({ data: await loadKomunitas(query, limit) });
    }

    const perTypeLimit = Math.min(30, limit);
    const [ekraf, sdm, komunitas] = await Promise.all([
      loadEkraf(query, perTypeLimit, featuredOnly),
      featuredOnly ? Promise.resolve([]) : loadSdm(query, perTypeLimit),
      featuredOnly ? Promise.resolve([]) : loadKomunitas(query, perTypeLimit),
    ]);

    const data = [...ekraf, ...sdm, ...komunitas]
      .sort((a, b) => {
        if (b.unggulan !== a.unggulan) return b.unggulan - a.unggulan;
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Public directory error:", error);
    return NextResponse.json({ message: "Direktori terverifikasi belum dapat dimuat." }, { status: 500 });
  }
}
