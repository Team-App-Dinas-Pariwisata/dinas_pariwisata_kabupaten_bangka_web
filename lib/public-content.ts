import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import { browserSafeR2ImageUrl } from "@/lib/r2";

export type PublicNewsItem = {
  id: number;
  slug: string;
  judul: string;
  subjudul: string | null;
  ringkasan: string | null;
  isi: string;
  penulis_tampil: string | null;
  sumber_nama: string | null;
  sumber_url: string | null;
  foto_utama: string | null;
  foto_keterangan: string | null;
  foto_alt: string | null;
  headline: number;
  tanggal_publikasi: string | null;
  nama_kategori: string | null;
};

export type PublicEventItem = {
  id: number;
  slug: string;
  nama_acara: string;
  ringkasan: string | null;
  deskripsi: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  sepanjang_hari: number;
  status_acara: string;
  jenis_pelaksanaan: string;
  nama_lokasi: string | null;
  alamat: string | null;
  tautan_daring: string | null;
  penyelenggara: string | null;
  narahubung_nama: string | null;
  narahubung_telepon: string | null;
  narahubung_email: string | null;
  memerlukan_pendaftaran: number;
  tautan_pendaftaran: string | null;
  kuota: number | null;
  gratis: number;
  harga_mulai: number | null;
  harga_sampai: number | null;
  syarat_ketentuan: string | null;
  foto_utama: string | null;
  foto_alt: string | null;
  unggulan: number;
  tanggal_publikasi: string | null;
  nama_kategori: string | null;
};

type CountRow = RowDataPacket & { total: number };
type NewsRow = RowDataPacket & PublicNewsItem;
type EventRow = RowDataPacket & PublicEventItem;

function normalizePage(page: number) {
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export async function getPublicNewsList(page = 1, pageSize = 9) {
  const safePage = normalizePage(page);
  const safeSize = Math.min(Math.max(Math.floor(pageSize), 1), 24);
  const offset = (safePage - 1) * safeSize;

  const [countRows] = await db().query<CountRow[]>(`
    SELECT COUNT(*) AS total
    FROM berita b
    INNER JOIN master_kategori_berita mkb ON mkb.id = b.kategori_berita_id
    WHERE b.aktif = 1
      AND b.dipublikasikan = 1
      AND b.tanggal_publikasi IS NOT NULL
      AND b.tanggal_publikasi <= NOW()
      AND mkb.aktif = 1
  `);

  const [rows] = await db().query<NewsRow[]>(`
    SELECT
      b.id, b.slug, b.judul, b.subjudul, b.ringkasan, b.isi,
      b.penulis_tampil, b.sumber_nama, b.sumber_url,
      b.foto_utama, b.foto_keterangan, b.foto_alt,
      b.headline, b.tanggal_publikasi, mkb.nama_kategori
    FROM berita b
    INNER JOIN master_kategori_berita mkb ON mkb.id = b.kategori_berita_id
    WHERE b.aktif = 1
      AND b.dipublikasikan = 1
      AND b.tanggal_publikasi IS NOT NULL
      AND b.tanggal_publikasi <= NOW()
      AND mkb.aktif = 1
    ORDER BY b.headline DESC, b.tanggal_publikasi DESC, b.id DESC
    LIMIT ? OFFSET ?
  `, [safeSize, offset]);

  const total = Number(countRows[0]?.total ?? 0);
  return {
    items: rows.map((row) => ({ ...row, foto_utama: browserSafeR2ImageUrl(row.foto_utama) })),
    total,
    page: safePage,
    pageSize: safeSize,
    totalPages: Math.max(1, Math.ceil(total / safeSize)),
  };
}

export async function getPublicNewsBySlug(slug: string) {
  const [rows] = await db().query<NewsRow[]>(`
    SELECT
      b.id, b.slug, b.judul, b.subjudul, b.ringkasan, b.isi,
      b.penulis_tampil, b.sumber_nama, b.sumber_url,
      b.foto_utama, b.foto_keterangan, b.foto_alt,
      b.headline, b.tanggal_publikasi, mkb.nama_kategori
    FROM berita b
    INNER JOIN master_kategori_berita mkb ON mkb.id = b.kategori_berita_id
    WHERE b.slug = ?
      AND b.aktif = 1
      AND b.dipublikasikan = 1
      AND b.tanggal_publikasi IS NOT NULL
      AND b.tanggal_publikasi <= NOW()
      AND mkb.aktif = 1
    LIMIT 1
  `, [slug]);

  const row = rows[0];
  return row ? { ...row, foto_utama: browserSafeR2ImageUrl(row.foto_utama) } : null;
}

export async function getRelatedNews(excludeId: number, limit = 3) {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 6);
  const [rows] = await db().query<NewsRow[]>(`
    SELECT
      b.id, b.slug, b.judul, b.subjudul, b.ringkasan, b.isi,
      b.penulis_tampil, b.sumber_nama, b.sumber_url,
      b.foto_utama, b.foto_keterangan, b.foto_alt,
      b.headline, b.tanggal_publikasi, mkb.nama_kategori
    FROM berita b
    INNER JOIN master_kategori_berita mkb ON mkb.id = b.kategori_berita_id
    WHERE b.id <> ?
      AND b.aktif = 1
      AND b.dipublikasikan = 1
      AND b.tanggal_publikasi IS NOT NULL
      AND b.tanggal_publikasi <= NOW()
      AND mkb.aktif = 1
    ORDER BY b.tanggal_publikasi DESC, b.id DESC
    LIMIT ?
  `, [excludeId, safeLimit]);
  return rows.map((row) => ({ ...row, foto_utama: browserSafeR2ImageUrl(row.foto_utama) }));
}

export async function getPublicEventList(page = 1, pageSize = 9) {
  const safePage = normalizePage(page);
  const safeSize = Math.min(Math.max(Math.floor(pageSize), 1), 24);
  const offset = (safePage - 1) * safeSize;

  const [countRows] = await db().query<CountRow[]>(`
    SELECT COUNT(*) AS total
    FROM acara a
    INNER JOIN master_kategori_acara mka ON mka.id = a.kategori_acara_id
    WHERE a.aktif = 1
      AND a.dipublikasikan = 1
      AND a.tanggal_publikasi IS NOT NULL
      AND a.tanggal_publikasi <= NOW()
      AND a.status_acara <> 'Dibatalkan'
      AND mka.aktif = 1
  `);

  const [rows] = await db().query<EventRow[]>(`
    SELECT
      a.id, a.slug, a.nama_acara, a.ringkasan, a.deskripsi,
      a.tanggal_mulai, a.tanggal_selesai, a.sepanjang_hari,
      a.status_acara, a.jenis_pelaksanaan, a.nama_lokasi, a.alamat,
      a.tautan_daring, a.penyelenggara, a.narahubung_nama,
      a.narahubung_telepon, a.narahubung_email,
      a.memerlukan_pendaftaran, a.tautan_pendaftaran, a.kuota,
      a.gratis, a.harga_mulai, a.harga_sampai, a.syarat_ketentuan,
      a.foto_utama, a.foto_alt, a.unggulan, a.tanggal_publikasi,
      mka.nama_kategori
    FROM acara a
    INNER JOIN master_kategori_acara mka ON mka.id = a.kategori_acara_id
    WHERE a.aktif = 1
      AND a.dipublikasikan = 1
      AND a.tanggal_publikasi IS NOT NULL
      AND a.tanggal_publikasi <= NOW()
      AND a.status_acara <> 'Dibatalkan'
      AND mka.aktif = 1
    ORDER BY
      CASE WHEN a.tanggal_selesai >= NOW() THEN 0 ELSE 1 END ASC,
      a.unggulan DESC,
      CASE WHEN a.tanggal_selesai >= NOW() THEN a.tanggal_mulai END ASC,
      a.tanggal_mulai DESC,
      a.id DESC
    LIMIT ? OFFSET ?
  `, [safeSize, offset]);

  const total = Number(countRows[0]?.total ?? 0);
  return {
    items: rows.map((row) => ({ ...row, foto_utama: browserSafeR2ImageUrl(row.foto_utama) })),
    total,
    page: safePage,
    pageSize: safeSize,
    totalPages: Math.max(1, Math.ceil(total / safeSize)),
  };
}

export async function getPublicEventBySlug(slug: string) {
  const [rows] = await db().query<EventRow[]>(`
    SELECT
      a.id, a.slug, a.nama_acara, a.ringkasan, a.deskripsi,
      a.tanggal_mulai, a.tanggal_selesai, a.sepanjang_hari,
      a.status_acara, a.jenis_pelaksanaan, a.nama_lokasi, a.alamat,
      a.tautan_daring, a.penyelenggara, a.narahubung_nama,
      a.narahubung_telepon, a.narahubung_email,
      a.memerlukan_pendaftaran, a.tautan_pendaftaran, a.kuota,
      a.gratis, a.harga_mulai, a.harga_sampai, a.syarat_ketentuan,
      a.foto_utama, a.foto_alt, a.unggulan, a.tanggal_publikasi,
      mka.nama_kategori
    FROM acara a
    INNER JOIN master_kategori_acara mka ON mka.id = a.kategori_acara_id
    WHERE a.slug = ?
      AND a.aktif = 1
      AND a.dipublikasikan = 1
      AND a.tanggal_publikasi IS NOT NULL
      AND a.tanggal_publikasi <= NOW()
      AND a.status_acara <> 'Dibatalkan'
      AND mka.aktif = 1
    LIMIT 1
  `, [slug]);

  const row = rows[0];
  return row ? { ...row, foto_utama: browserSafeR2ImageUrl(row.foto_utama) } : null;
}

export async function getRelatedEvents(excludeId: number, limit = 3) {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 6);
  const [rows] = await db().query<EventRow[]>(`
    SELECT
      a.id, a.slug, a.nama_acara, a.ringkasan, a.deskripsi,
      a.tanggal_mulai, a.tanggal_selesai, a.sepanjang_hari,
      a.status_acara, a.jenis_pelaksanaan, a.nama_lokasi, a.alamat,
      a.tautan_daring, a.penyelenggara, a.narahubung_nama,
      a.narahubung_telepon, a.narahubung_email,
      a.memerlukan_pendaftaran, a.tautan_pendaftaran, a.kuota,
      a.gratis, a.harga_mulai, a.harga_sampai, a.syarat_ketentuan,
      a.foto_utama, a.foto_alt, a.unggulan, a.tanggal_publikasi,
      mka.nama_kategori
    FROM acara a
    INNER JOIN master_kategori_acara mka ON mka.id = a.kategori_acara_id
    WHERE a.id <> ?
      AND a.aktif = 1
      AND a.dipublikasikan = 1
      AND a.tanggal_publikasi IS NOT NULL
      AND a.tanggal_publikasi <= NOW()
      AND a.status_acara <> 'Dibatalkan'
      AND mka.aktif = 1
    ORDER BY CASE WHEN a.tanggal_selesai >= NOW() THEN 0 ELSE 1 END, a.tanggal_mulai ASC, a.id DESC
    LIMIT ?
  `, [excludeId, safeLimit]);
  return rows.map((row) => ({ ...row, foto_utama: browserSafeR2ImageUrl(row.foto_utama) }));
}
