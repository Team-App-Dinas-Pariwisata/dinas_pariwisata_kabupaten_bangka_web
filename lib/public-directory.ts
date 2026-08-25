import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import { keyFromR2SubmissionStorageReference } from "@/lib/r2";

export type PublicDirectoryType = "ekraf" | "sdm" | "komunitas";

export type PublicDirectoryDetail = {
  id: number;
  type: PublicDirectoryType;
  title: string;
  subtitle: string | null;
  category: string | null;
  location: string | null;
  description: string | null;
  image: string | null;
  unggulan: number;
  registration_number: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  updated_at: string | null;

  year_started: number | null;
  employee_count: number | null;
  products_services: string | null;
  vision: string | null;
  mission: string | null;
  achievements: string | null;
  trainings: string | null;
  exhibitions: string | null;
  social_media: string | null;
  website: string | null;
  shopee: string | null;

  role: string | null;
  workplace: string | null;
  workplace_address: string | null;
  start_month: number | null;
  start_year: number | null;

  organization_kind: string | null;
  legal_status: string | null;
  legal_number: string | null;
  chairman: string | null;
  vision_mission: string | null;
};

type DirectoryRow = RowDataPacket & PublicDirectoryDetail;

export const publicDirectoryMeta: Record<PublicDirectoryType, {
  label: string;
  eyebrow: string;
  description: string;
}> = {
  ekraf: {
    label: "Pelaku Ekraf",
    eyebrow: "Direktori Ekonomi Kreatif",
    description: "Profil pelaku ekonomi kreatif Kabupaten Bangka yang telah disetujui dan terverifikasi.",
  },
  sdm: {
    label: "SDM Pariwisata",
    eyebrow: "Direktori SDM Pariwisata",
    description: "Profil sumber daya manusia pariwisata Kabupaten Bangka yang telah disetujui untuk dipublikasikan.",
  },
  komunitas: {
    label: "Komunitas / Asosiasi",
    eyebrow: "Direktori Komunitas",
    description: "Profil komunitas, lembaga, dan asosiasi yang telah disetujui untuk dipublikasikan.",
  },
};

export function isPublicDirectoryType(value: string): value is PublicDirectoryType {
  return value === "ekraf" || value === "sdm" || value === "komunitas";
}

function publicImage(type: PublicDirectoryType, id: number, reference: string | null) {
  if (!reference) return null;
  const managedKey = keyFromR2SubmissionStorageReference(reference);
  if (!managedKey) return reference;
  const params = new URLSearchParams({ type, id: String(id) });
  return `/api/public/direktori/image?${params.toString()}`;
}

function normalizeRow(row: DirectoryRow | undefined): PublicDirectoryDetail | null {
  if (!row) return null;
  return {
    ...row,
    id: Number(row.id),
    unggulan: Number(row.unggulan || 0),
    year_started: row.year_started === null ? null : Number(row.year_started),
    employee_count: row.employee_count === null ? null : Number(row.employee_count),
    start_month: row.start_month === null ? null : Number(row.start_month),
    start_year: row.start_year === null ? null : Number(row.start_year),
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    image: publicImage(row.type, Number(row.id), row.image),
    shopee: row.shopee ? String(row.shopee) : null,
  };
}

const nullBusinessFields = `
  NULL AS year_started,
  NULL AS employee_count,
  NULL AS products_services,
  NULL AS vision,
  NULL AS mission,
  NULL AS achievements,
  NULL AS trainings,
  NULL AS exhibitions,
  NULL AS social_media,
  NULL AS website
`;

const nullSdmFields = `
  NULL AS role,
  NULL AS workplace,
  NULL AS workplace_address,
  NULL AS start_month,
  NULL AS start_year
`;

const nullCommunityFields = `
  NULL AS organization_kind,
  NULL AS legal_status,
  NULL AS legal_number,
  NULL AS chairman,
  NULL AS vision_mission
`;

export async function getPublicDirectoryDetail(type: PublicDirectoryType, id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  if (type === "ekraf") {
    const [rows] = await db().query<DirectoryRow[]>(`
      SELECT
        p.id,
        'ekraf' AS type,
        COALESCE(NULLIF(p.nama_merek, ''), p.nama_usaha) AS title,
        p.nama_lengkap AS subtitle,
        s.nama_subsektor AS category,
        CONCAT_WS(', ', NULLIF(l.nama_kelurahan, ''), NULLIF(k.nama_kecamatan, '')) AS location,
        COALESCE(NULLIF(p.deskripsi_usaha, ''), NULLIF(p.produk_jasa, '')) AS description,
        COALESCE(NULLIF(p.file_logo_usaha, ''), NULLIF(p.file_foto_dokumentasi, ''), NULLIF(p.file_foto_diri, '')) AS image,
        p.unggulan,
        p.no_registrasi AS registration_number,
        NULLIF(p.alamat_usaha, '') AS address,
        p.latitude,
        p.longitude,
        p.updated_at,
        COALESCE(p.tahun_mulai_usaha, p.tahun_berdiri) AS year_started,
        p.jumlah_tenaga_kerja AS employee_count,
        NULLIF(p.produk_jasa, '') AS products_services,
        NULLIF(p.visi_usaha, '') AS vision,
        NULLIF(p.misi_usaha, '') AS mission,
        NULLIF(p.prestasi, '') AS achievements,
        NULLIF(p.pelatihan, '') AS trainings,
        NULLIF(p.pameran, '') AS exhibitions,
        NULLIF(p.media_sosial, '') AS social_media,
        NULLIF(p.website, '') AS website,
        NULLIF(p.link_shopee, '') AS shopee,
        ${nullSdmFields},
        ${nullCommunityFields}
      FROM pengajuan_ekraf p
      LEFT JOIN master_subsektor_ekraf s ON s.id = p.subsektor_id
      LEFT JOIN master_kecamatan k ON k.id = p.kecamatan_usaha_id
      LEFT JOIN master_kelurahan l ON l.id = p.kelurahan_usaha_id
      WHERE p.id = ? AND p.status = 'Disetujui'
      LIMIT 1
    `, [id]);
    return normalizeRow(rows[0]);
  }

  if (type === "sdm") {
    const [rows] = await db().query<DirectoryRow[]>(`
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
        p.no_registrasi AS registration_number,
        NULLIF(p.alamat_bertugas, '') AS address,
        NULL AS latitude,
        NULL AS longitude,
        p.updated_at,
        ${nullBusinessFields},
        p.jabatan AS role,
        p.tempat_bertugas AS workplace,
        NULLIF(p.alamat_bertugas, '') AS workplace_address,
        p.bulan_mulai_bertugas AS start_month,
        p.tahun_mulai_bertugas AS start_year,
        ${nullCommunityFields}
      FROM pengajuan_sdm_pariwisata p
      WHERE p.id = ?
        AND p.status_pengajuan = 'Disetujui'
        AND p.persetujuan_publikasi = 1
      LIMIT 1
    `, [id]);
    return normalizeRow(rows[0]);
  }

  const [rows] = await db().query<DirectoryRow[]>(`
    SELECT
      p.id,
      'komunitas' AS type,
      p.nama_organisasi AS title,
      p.kategori AS subtitle,
      COALESCE(s.nama_subsektor, p.kategori) AS category,
      CONCAT_WS(', ', NULLIF(l.nama_kelurahan, ''), NULLIF(k.nama_kecamatan, '')) AS location,
      NULLIF(p.rincian, '') AS description,
      COALESCE(NULLIF(p.file_logo_organisasi, ''), NULLIF(p.file_foto_dokumentasi, '')) AS image,
      0 AS unggulan,
      p.no_registrasi AS registration_number,
      NULLIF(p.alamat, '') AS address,
      p.latitude,
      p.longitude,
      p.updated_at,
      ${nullBusinessFields},
      ${nullSdmFields},
      p.kategori AS organization_kind,
      p.status_badan_hukum AS legal_status,
      NULLIF(p.nomor_akta, '') AS legal_number,
      NULLIF(p.nama_ketua, '') AS chairman,
      NULLIF(p.visi_misi, '') AS vision_mission
    FROM pengajuan_komunitas_asosiasi p
    LEFT JOIN master_subsektor_ekraf s ON s.id = p.subsektor_id
    LEFT JOIN master_kecamatan k ON k.id = p.kecamatan_id
    LEFT JOIN master_kelurahan l ON l.id = p.kelurahan_id
    WHERE p.id = ?
      AND p.status_pengajuan = 'Disetujui'
      AND p.persetujuan_publikasi = 1
    LIMIT 1
  `, [id]);
  return normalizeRow(rows[0]);
}

export async function getRelatedPublicDirectory(type: PublicDirectoryType, excludeId: number, limit = 3) {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 6);

  if (type === "ekraf") {
    const [rows] = await db().query<DirectoryRow[]>(`
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
        p.no_registrasi AS registration_number,
        NULLIF(p.alamat_usaha, '') AS address,
        p.latitude,
        p.longitude,
        p.updated_at,
        COALESCE(p.tahun_mulai_usaha, p.tahun_berdiri) AS year_started,
        p.jumlah_tenaga_kerja AS employee_count,
        NULLIF(p.produk_jasa, '') AS products_services,
        NULLIF(p.visi_usaha, '') AS vision,
        NULLIF(p.misi_usaha, '') AS mission,
        NULLIF(p.prestasi, '') AS achievements,
        NULLIF(p.pelatihan, '') AS trainings,
        NULLIF(p.pameran, '') AS exhibitions,
        NULLIF(p.media_sosial, '') AS social_media,
        NULLIF(p.website, '') AS website,
        ${nullSdmFields},
        ${nullCommunityFields}
      FROM pengajuan_ekraf p
      LEFT JOIN master_subsektor_ekraf s ON s.id = p.subsektor_id
      LEFT JOIN master_kecamatan k ON k.id = p.kecamatan_usaha_id
      LEFT JOIN master_kelurahan l ON l.id = p.kelurahan_usaha_id
      WHERE p.id <> ? AND p.status = 'Disetujui'
      ORDER BY p.unggulan DESC, p.tanggal_verifikasi DESC, p.updated_at DESC
      LIMIT ?
    `, [excludeId, safeLimit]);
    return rows.map((row) => normalizeRow(row)).filter((row): row is PublicDirectoryDetail => Boolean(row));
  }

  if (type === "sdm") {
    const [rows] = await db().query<DirectoryRow[]>(`
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
        p.no_registrasi AS registration_number,
        NULLIF(p.alamat_bertugas, '') AS address,
        NULL AS latitude,
        NULL AS longitude,
        p.updated_at,
        ${nullBusinessFields},
        p.jabatan AS role,
        p.tempat_bertugas AS workplace,
        NULLIF(p.alamat_bertugas, '') AS workplace_address,
        p.bulan_mulai_bertugas AS start_month,
        p.tahun_mulai_bertugas AS start_year,
        ${nullCommunityFields}
      FROM pengajuan_sdm_pariwisata p
      WHERE p.id <> ?
        AND p.status_pengajuan = 'Disetujui'
        AND p.persetujuan_publikasi = 1
      ORDER BY p.tanggal_verifikasi DESC, p.updated_at DESC
      LIMIT ?
    `, [excludeId, safeLimit]);
    return rows.map((row) => normalizeRow(row)).filter((row): row is PublicDirectoryDetail => Boolean(row));
  }

  const [rows] = await db().query<DirectoryRow[]>(`
    SELECT
      p.id,
      'komunitas' AS type,
      p.nama_organisasi AS title,
      p.kategori AS subtitle,
      COALESCE(s.nama_subsektor, p.kategori) AS category,
      CONCAT_WS(', ', NULLIF(l.nama_kelurahan, ''), NULLIF(k.nama_kecamatan, '')) AS location,
      NULLIF(p.rincian, '') AS description,
      COALESCE(NULLIF(p.file_logo_organisasi, ''), NULLIF(p.file_foto_dokumentasi, '')) AS image,
      0 AS unggulan,
      p.no_registrasi AS registration_number,
      NULLIF(p.alamat, '') AS address,
      p.latitude,
      p.longitude,
      p.updated_at,
      ${nullBusinessFields},
      ${nullSdmFields},
      p.kategori AS organization_kind,
      p.status_badan_hukum AS legal_status,
      NULLIF(p.nomor_akta, '') AS legal_number,
      NULLIF(p.nama_ketua, '') AS chairman,
      NULLIF(p.visi_misi, '') AS vision_mission
    FROM pengajuan_komunitas_asosiasi p
    LEFT JOIN master_subsektor_ekraf s ON s.id = p.subsektor_id
    LEFT JOIN master_kecamatan k ON k.id = p.kecamatan_id
    LEFT JOIN master_kelurahan l ON l.id = p.kelurahan_id
    WHERE p.id <> ?
      AND p.status_pengajuan = 'Disetujui'
      AND p.persetujuan_publikasi = 1
    ORDER BY p.tanggal_verifikasi DESC, p.updated_at DESC
    LIMIT ?
  `, [excludeId, safeLimit]);
  return rows.map((row) => normalizeRow(row)).filter((row): row is PublicDirectoryDetail => Boolean(row));
}
