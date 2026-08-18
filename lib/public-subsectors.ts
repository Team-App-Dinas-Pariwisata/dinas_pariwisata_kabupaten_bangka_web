import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import { keyFromR2SubmissionStorageReference } from "@/lib/r2";

export type PublicSubsector = {
  id: number;
  kode: string;
  nama_subsektor: string;
  deskripsi: string | null;
  pelaku_count: number;
};

export type PublicEkrafCard = {
  id: number;
  title: string;
  subtitle: string | null;
  category: string | null;
  location: string | null;
  description: string | null;
  image: string | null;
  unggulan: number;
};

type SubsectorRow = RowDataPacket & PublicSubsector;
type EkrafRow = RowDataPacket & PublicEkrafCard;

function exposeEkrafImage(item: PublicEkrafCard): PublicEkrafCard {
  if (!item.image) return item;
  const managedKey = keyFromR2SubmissionStorageReference(item.image);
  if (!managedKey) return item;
  return {
    ...item,
    image: `/api/public/direktori/image?type=ekraf&id=${encodeURIComponent(String(item.id))}`,
  };
}

export async function getPublicSubsectors(): Promise<PublicSubsector[]> {
  const [rows] = await db().query<SubsectorRow[]>(`
    SELECT
      s.id,
      s.kode,
      s.nama_subsektor,
      s.deskripsi,
      COUNT(p.id) AS pelaku_count
    FROM master_subsektor_ekraf s
    LEFT JOIN pengajuan_ekraf p
      ON p.subsektor_id = s.id
      AND p.status = 'Disetujui'
    WHERE s.aktif = 1
    GROUP BY s.id, s.kode, s.nama_subsektor, s.deskripsi
    ORDER BY s.id ASC
  `);

  return rows.map((row) => ({
    id: Number(row.id),
    kode: String(row.kode ?? ""),
    nama_subsektor: String(row.nama_subsektor ?? ""),
    deskripsi: row.deskripsi ? String(row.deskripsi) : null,
    pelaku_count: Number(row.pelaku_count ?? 0),
  }));
}

export async function getPublicSubsector(id: number): Promise<PublicSubsector | null> {
  const [rows] = await db().query<SubsectorRow[]>(`
    SELECT
      s.id,
      s.kode,
      s.nama_subsektor,
      s.deskripsi,
      COUNT(p.id) AS pelaku_count
    FROM master_subsektor_ekraf s
    LEFT JOIN pengajuan_ekraf p
      ON p.subsektor_id = s.id
      AND p.status = 'Disetujui'
    WHERE s.id = ?
      AND s.aktif = 1
    GROUP BY s.id, s.kode, s.nama_subsektor, s.deskripsi
    LIMIT 1
  `, [id]);

  const row = rows[0];
  if (!row) return null;
  return {
    id: Number(row.id),
    kode: String(row.kode ?? ""),
    nama_subsektor: String(row.nama_subsektor ?? ""),
    deskripsi: row.deskripsi ? String(row.deskripsi) : null,
    pelaku_count: Number(row.pelaku_count ?? 0),
  };
}

export async function getApprovedEkrafBySubsector(
  subsectorId: number,
  requestedPage = 1,
  perPage = 9,
) {
  const safePerPage = Math.min(24, Math.max(1, Math.floor(perPage)));

  const [countRows] = await db().query<(RowDataPacket & { total: number })[]>(`
    SELECT COUNT(*) AS total
    FROM pengajuan_ekraf p
    WHERE p.status = 'Disetujui'
      AND p.subsektor_id = ?
  `, [subsectorId]);

  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / safePerPage));
  const page = Math.min(totalPages, Math.max(1, Math.floor(requestedPage)));
  const offset = (page - 1) * safePerPage;

  const [rows] = await db().query<EkrafRow[]>(`
    SELECT
      p.id,
      COALESCE(NULLIF(p.nama_merek, ''), NULLIF(p.nama_usaha, ''), p.nama_lengkap) AS title,
      p.nama_lengkap AS subtitle,
      s.nama_subsektor AS category,
      COALESCE(NULLIF(l.nama_kelurahan, ''), NULLIF(k.nama_kecamatan, ''), NULLIF(p.alamat_usaha, '')) AS location,
      COALESCE(NULLIF(p.deskripsi_usaha, ''), NULLIF(p.produk_jasa, '')) AS description,
      COALESCE(NULLIF(p.file_logo_usaha, ''), NULLIF(p.file_foto_dokumentasi, ''), NULLIF(p.file_foto_diri, '')) AS image,
      COALESCE(p.unggulan, 0) AS unggulan
    FROM pengajuan_ekraf p
    LEFT JOIN master_subsektor_ekraf s ON s.id = p.subsektor_id
    LEFT JOIN master_kecamatan k ON k.id = p.kecamatan_usaha_id
    LEFT JOIN master_kelurahan l ON l.id = p.kelurahan_usaha_id
    WHERE p.status = 'Disetujui'
      AND p.subsektor_id = ?
    ORDER BY p.unggulan DESC, p.tanggal_verifikasi DESC, p.updated_at DESC, p.id DESC
    LIMIT ? OFFSET ?
  `, [subsectorId, safePerPage, offset]);

  const items = rows.map((row) => exposeEkrafImage({
    id: Number(row.id),
    title: String(row.title ?? "Pelaku Ekraf"),
    subtitle: row.subtitle ? String(row.subtitle) : null,
    category: row.category ? String(row.category) : null,
    location: row.location ? String(row.location) : null,
    description: row.description ? String(row.description) : null,
    image: row.image ? String(row.image) : null,
    unggulan: Number(row.unggulan ?? 0),
  }));

  return { items, total, page, perPage: safePerPage, totalPages };
}
