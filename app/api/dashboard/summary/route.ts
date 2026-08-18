import type { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { db } from "@/lib/db";

type SubmissionCountRow = RowDataPacket & {
  total: number;
  menunggu: number;
  disetujui: number;
  ditolak: number;
};

type CountRow = RowDataPacket & { total: number };

type RecentDbRow = RowDataPacket & {
  id: number;
  no_registrasi: string | null;
  nama: string;
  detail: string | null;
  status: string;
  created_at: string;
};

type RecentRow = {
  id: number;
  jenis: "ekraf" | "sdm" | "komunitas";
  no_registrasi: string | null;
  nama: string;
  detail: string;
  status: string;
  created_at: string;
};

function toTimestamp(value: string) {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const timestamp = new Date(normalized).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export async function GET(request: NextRequest) {
  if (!(await requireRequestRole(request, "pengguna"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    /*
     * Jangan gabungkan tiga tabel pengajuan memakai UNION di MySQL.
     * dinpar.sql menggunakan collation yang berbeda pada tabel lama:
     * pengajuan_ekraf banyak memakai utf8mb4_0900_ai_ci, sedangkan
     * pengajuan_sdm_pariwisata dan pengajuan_komunitas_asosiasi memakai
     * utf8mb4_unicode_ci. UNION pada kolom varchar dari tabel-tabel tersebut
     * dapat memicu ER_CANT_AGGREGATE_NCOLLATIONS / "Illegal mix of collations".
     *
     * Karena itu data terbaru dibaca per tabel lalu digabung dan diurutkan
     * di aplikasi. Ini juga mempertahankan struktur database asli pengguna.
     */
    const [
      [ekrafRows],
      [sdmRows],
      [communityRows],
      [beritaRows],
      [acaraRows],
      [recentEkrafRows],
      [recentSdmRows],
      [recentCommunityRows],
    ] = await Promise.all([
      db().execute<SubmissionCountRow[]>(`
        SELECT COUNT(*) AS total,
          COALESCE(SUM(CASE WHEN status IN ('Menunggu','Perlu Perbaikan') THEN 1 ELSE 0 END), 0) AS menunggu,
          COALESCE(SUM(CASE WHEN status = 'Disetujui' THEN 1 ELSE 0 END), 0) AS disetujui,
          COALESCE(SUM(CASE WHEN status = 'Ditolak' THEN 1 ELSE 0 END), 0) AS ditolak
        FROM pengajuan_ekraf`),
      db().execute<SubmissionCountRow[]>(`
        SELECT COUNT(*) AS total,
          COALESCE(SUM(CASE WHEN status_pengajuan IN ('Menunggu','Perlu Perbaikan') THEN 1 ELSE 0 END), 0) AS menunggu,
          COALESCE(SUM(CASE WHEN status_pengajuan = 'Disetujui' THEN 1 ELSE 0 END), 0) AS disetujui,
          COALESCE(SUM(CASE WHEN status_pengajuan = 'Ditolak' THEN 1 ELSE 0 END), 0) AS ditolak
        FROM pengajuan_sdm_pariwisata`),
      db().execute<SubmissionCountRow[]>(`
        SELECT COUNT(*) AS total,
          COALESCE(SUM(CASE WHEN status_pengajuan IN ('Menunggu','Perlu Perbaikan') THEN 1 ELSE 0 END), 0) AS menunggu,
          COALESCE(SUM(CASE WHEN status_pengajuan = 'Disetujui' THEN 1 ELSE 0 END), 0) AS disetujui,
          COALESCE(SUM(CASE WHEN status_pengajuan = 'Ditolak' THEN 1 ELSE 0 END), 0) AS ditolak
        FROM pengajuan_komunitas_asosiasi`),
      db().execute<CountRow[]>("SELECT COUNT(*) AS total FROM berita"),
      db().execute<CountRow[]>("SELECT COUNT(*) AS total FROM acara"),
      db().execute<RecentDbRow[]>(`
        SELECT id, no_registrasi, nama_lengkap AS nama,
          COALESCE(nama_usaha, '') AS detail,
          COALESCE(status, 'Menunggu') AS status,
          created_at
        FROM pengajuan_ekraf
        WHERE status IN ('Menunggu','Perlu Perbaikan')
        ORDER BY created_at DESC
        LIMIT 8`),
      db().execute<RecentDbRow[]>(`
        SELECT id, no_registrasi, nama_lengkap AS nama,
          COALESCE(tempat_bertugas, '') AS detail,
          status_pengajuan AS status,
          created_at
        FROM pengajuan_sdm_pariwisata
        WHERE status_pengajuan IN ('Menunggu','Perlu Perbaikan')
        ORDER BY created_at DESC
        LIMIT 8`),
      db().execute<RecentDbRow[]>(`
        SELECT id, no_registrasi, nama_organisasi AS nama,
          COALESCE(kategori, '') AS detail,
          status_pengajuan AS status,
          created_at
        FROM pengajuan_komunitas_asosiasi
        WHERE status_pengajuan IN ('Menunggu','Perlu Perbaikan')
        ORDER BY created_at DESC
        LIMIT 8`),
    ]);

    const ekraf = ekrafRows[0] ?? { total: 0, menunggu: 0, disetujui: 0, ditolak: 0 };
    const sdm = sdmRows[0] ?? { total: 0, menunggu: 0, disetujui: 0, ditolak: 0 };
    const komunitas = communityRows[0] ?? { total: 0, menunggu: 0, disetujui: 0, ditolak: 0 };

    const total = Number(ekraf.total ?? 0) + Number(sdm.total ?? 0) + Number(komunitas.total ?? 0);
    const menunggu = Number(ekraf.menunggu ?? 0) + Number(sdm.menunggu ?? 0) + Number(komunitas.menunggu ?? 0);
    const disetujui = Number(ekraf.disetujui ?? 0) + Number(sdm.disetujui ?? 0) + Number(komunitas.disetujui ?? 0);
    const ditolak = Number(ekraf.ditolak ?? 0) + Number(sdm.ditolak ?? 0) + Number(komunitas.ditolak ?? 0);

    const recent: RecentRow[] = [
      ...recentEkrafRows.map((row) => ({
        id: Number(row.id),
        jenis: "ekraf" as const,
        no_registrasi: row.no_registrasi,
        nama: row.nama,
        detail: row.detail ?? "",
        status: row.status || "Menunggu",
        created_at: row.created_at,
      })),
      ...recentSdmRows.map((row) => ({
        id: Number(row.id),
        jenis: "sdm" as const,
        no_registrasi: row.no_registrasi,
        nama: row.nama,
        detail: row.detail ?? "",
        status: row.status || "Menunggu",
        created_at: row.created_at,
      })),
      ...recentCommunityRows.map((row) => ({
        id: Number(row.id),
        jenis: "komunitas" as const,
        no_registrasi: row.no_registrasi,
        nama: row.nama,
        detail: row.detail ?? "",
        status: row.status || "Menunggu",
        created_at: row.created_at,
      })),
    ]
      .sort((a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at))
      .slice(0, 8);

    return NextResponse.json({
      data: {
        total,
        menunggu,
        disetujui,
        ditolak,
        ekraf: Number(ekraf.total ?? 0),
        sdm: Number(sdm.total ?? 0),
        komunitas: Number(komunitas.total ?? 0),
        berita: Number(beritaRows[0]?.total ?? 0),
        acara: Number(acaraRows[0]?.total ?? 0),
        recent,
      },
    });
  } catch (error) {
    console.error("[dashboard/summary]", error);
    const detail = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        message: "Ringkasan dashboard gagal dimuat dari database.",
        ...(process.env.NODE_ENV !== "production" ? { detail } : {}),
      },
      { status: 500 },
    );
  }
}
