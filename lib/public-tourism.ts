import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import { browserSafeR2ImageUrl } from "@/lib/r2";

export type TourismKind = "tempat-wisata" | "kuliner" | "hotel" | "satwa-endemik";

export type PublicTourismItem = {
  id: number;
  slug: string;
  title: string;
  category: string | null;
  summary: string | null;
  description: string | null;
  image: string | null;
  address: string | null;
  subtitle: string | null;
  badge: string | null;
  price_from: number | null;
  price_to: number | null;
  detail_primary: string | null;
  detail_secondary: string | null;
  detail_tertiary: string | null;
  latitude: number | null;
  longitude: number | null;
  published_at: string | null;
};

type CountRow = RowDataPacket & { total: number };
type TourismRow = RowDataPacket & PublicTourismItem;

type TourismConfig = {
  table: string;
  select: string;
  publicWhere: string;
  slugColumn: string;
  idColumn: string;
  orderBy: string;
};

export const tourismMeta: Record<TourismKind, {
  menuLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  detailPrimaryLabel: string;
  detailSecondaryLabel: string;
  detailTertiaryLabel: string;
}> = {
  "tempat-wisata": {
    menuLabel: "Tempat Wisata",
    eyebrow: "Jelajah Bangka",
    title: "Tempat wisata yang layak masuk rencana perjalanan.",
    description: "Temukan pantai, ruang alam, budaya, dan destinasi pilihan di Kabupaten Bangka.",
    detailPrimaryLabel: "Daya tarik utama",
    detailSecondaryLabel: "Akses transportasi",
    detailTertiaryLabel: "Informasi keselamatan",
  },
  kuliner: {
    menuLabel: "Kuliner",
    eyebrow: "Cita Rasa Bangka",
    title: "Kuliner lokal dari warung hingga ruang makan modern.",
    description: "Jelajahi usaha kuliner, menu unggulan, kisaran harga, dan pengalaman rasa khas Bangka.",
    detailPrimaryLabel: "Cita rasa khas",
    detailSecondaryLabel: "Menu unggulan",
    detailTertiaryLabel: "Metode pembayaran",
  },
  hotel: {
    menuLabel: "Hotel",
    eyebrow: "Tempat Menginap",
    title: "Pilihan akomodasi untuk perjalanan yang lebih nyaman.",
    description: "Temukan hotel dan penginapan dengan informasi lokasi, harga, fasilitas umum, dan reservasi.",
    detailPrimaryLabel: "Informasi reservasi",
    detailSecondaryLabel: "Aksesibilitas",
    detailTertiaryLabel: "Kebijakan hotel",
  },
  "satwa-endemik": {
    menuLabel: "Satwa Endemik",
    eyebrow: "Kekayaan Hayati",
    title: "Kenali satwa khas dan fauna penting di Bangka.",
    description: "Pelajari habitat, persebaran, ciri, dan informasi konservasi satwa yang hidup di wilayah Bangka dan sekitarnya.",
    detailPrimaryLabel: "Habitat",
    detailSecondaryLabel: "Persebaran",
    detailTertiaryLabel: "Fakta unik",
  },
};

function configFor(kind: TourismKind): TourismConfig {
  switch (kind) {
    case "tempat-wisata":
      return {
        table: "tempat_wisata t INNER JOIN master_kategori_wisata k ON k.id = t.kategori_wisata_id",
        select: `
          t.id, t.slug, t.nama_tempat AS title, k.nama_kategori AS category,
          t.deskripsi_singkat AS summary, t.deskripsi AS description, t.foto_utama AS image,
          t.alamat AS address, t.nama_pengelola AS subtitle, t.waktu_kunjungan_terbaik AS badge,
          t.harga_tiket_domestik_dewasa AS price_from, t.harga_tiket_mancanegara AS price_to,
          t.daya_tarik_utama AS detail_primary, t.akses_transportasi AS detail_secondary,
          t.informasi_keselamatan AS detail_tertiary, t.latitude AS latitude, t.longitude AS longitude,
          t.tanggal_publikasi AS published_at
        `,
        publicWhere: "t.aktif = 1 AND t.dipublikasikan = 1 AND t.tanggal_publikasi IS NOT NULL AND t.tanggal_publikasi <= NOW() AND k.aktif = 1",
        slugColumn: "t.slug",
        idColumn: "t.id",
        orderBy: "t.unggulan DESC, t.urutan_tampil ASC, t.tanggal_publikasi DESC, t.id DESC",
      };
    case "kuliner":
      return {
        table: "kuliner t INNER JOIN master_kategori_kuliner k ON k.id = t.kategori_kuliner_id",
        select: `
          t.id, t.slug, t.nama_usaha AS title, k.nama_kategori AS category,
          t.deskripsi_singkat AS summary, t.deskripsi AS description, t.foto_utama AS image,
          t.alamat AS address, t.nama_pemilik AS subtitle, t.status_halal AS badge,
          t.harga_mulai AS price_from, t.harga_sampai AS price_to,
          t.cita_rasa_khas AS detail_primary, t.menu_unggulan AS detail_secondary,
          t.metode_pembayaran AS detail_tertiary, t.latitude AS latitude, t.longitude AS longitude,
          t.tanggal_publikasi AS published_at
        `,
        publicWhere: "t.aktif = 1 AND t.dipublikasikan = 1 AND t.tanggal_publikasi IS NOT NULL AND t.tanggal_publikasi <= NOW() AND k.aktif = 1",
        slugColumn: "t.slug",
        idColumn: "t.id",
        orderBy: "t.unggulan DESC, t.urutan_tampil ASC, t.tanggal_publikasi DESC, t.id DESC",
      };
    case "hotel":
      return {
        table: "hotel t INNER JOIN master_jenis_hotel k ON k.id = t.jenis_hotel_id",
        select: `
          t.id, t.slug, t.nama_hotel AS title, k.nama_jenis AS category,
          t.deskripsi_singkat AS summary, t.deskripsi AS description, t.foto_utama AS image,
          t.alamat AS address, t.nama_pengelola AS subtitle,
          CASE WHEN t.klasifikasi_bintang IS NULL THEN NULL ELSE CONCAT(t.klasifikasi_bintang, ' bintang') END AS badge,
          t.harga_mulai AS price_from, t.harga_sampai AS price_to,
          t.informasi_reservasi AS detail_primary, t.aksesibilitas AS detail_secondary,
          t.kebijakan_hotel AS detail_tertiary, t.latitude AS latitude, t.longitude AS longitude,
          t.tanggal_publikasi AS published_at
        `,
        publicWhere: "t.aktif = 1 AND t.dipublikasikan = 1 AND t.tanggal_publikasi IS NOT NULL AND t.tanggal_publikasi <= NOW() AND k.aktif = 1",
        slugColumn: "t.slug",
        idColumn: "t.id",
        orderBy: "t.unggulan DESC, t.urutan_tampil ASC, t.tanggal_publikasi DESC, t.id DESC",
      };
    case "satwa-endemik":
      return {
        table: "satwa_endemik t",
        select: `
          t.id, t.slug, t.nama_umum AS title, t.status_endemisitas AS category,
          t.deskripsi_singkat AS summary, t.deskripsi AS description, t.foto_utama AS image,
          t.wilayah_endemik AS address, t.nama_ilmiah AS subtitle,
          t.status_perlindungan_indonesia AS badge,
          NULL AS price_from, NULL AS price_to,
          t.habitat AS detail_primary, t.persebaran AS detail_secondary,
          t.fakta_unik AS detail_tertiary, t.latitude_publik AS latitude, t.longitude_publik AS longitude,
          t.tanggal_publikasi AS published_at
        `,
        publicWhere: "t.aktif = 1 AND t.dipublikasikan = 1 AND t.tanggal_publikasi IS NOT NULL AND t.tanggal_publikasi <= NOW()",
        slugColumn: "t.slug",
        idColumn: "t.id",
        orderBy: "t.unggulan DESC, t.urutan_tampil ASC, t.tanggal_publikasi DESC, t.id DESC",
      };
  }
}

function normalizePage(page: number) {
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function normalizeRows(rows: TourismRow[]) {
  return rows.map((row) => ({ ...row, image: browserSafeR2ImageUrl(row.image) }));
}

export async function getPublicTourismList(kind: TourismKind, page = 1, pageSize = 9) {
  const config = configFor(kind);
  const safePage = normalizePage(page);
  const safeSize = Math.min(Math.max(Math.floor(pageSize), 1), 24);
  const offset = (safePage - 1) * safeSize;

  const [countRows] = await db().query<CountRow[]>(`SELECT COUNT(*) AS total FROM ${config.table} WHERE ${config.publicWhere}`);
  const [rows] = await db().query<TourismRow[]>(`
    SELECT ${config.select}
    FROM ${config.table}
    WHERE ${config.publicWhere}
    ORDER BY ${config.orderBy}
    LIMIT ? OFFSET ?
  `, [safeSize, offset]);

  const total = Number(countRows[0]?.total ?? 0);
  return {
    items: normalizeRows(rows),
    total,
    page: safePage,
    pageSize: safeSize,
    totalPages: Math.max(1, Math.ceil(total / safeSize)),
  };
}

export async function getPublicTourismBySlug(kind: TourismKind, slug: string) {
  const config = configFor(kind);
  const [rows] = await db().query<TourismRow[]>(`
    SELECT ${config.select}
    FROM ${config.table}
    WHERE ${config.slugColumn} = ? AND ${config.publicWhere}
    LIMIT 1
  `, [slug]);
  return normalizeRows(rows)[0] ?? null;
}

export async function getRelatedTourism(kind: TourismKind, excludeId: number, limit = 3) {
  const config = configFor(kind);
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 6);
  const [rows] = await db().query<TourismRow[]>(`
    SELECT ${config.select}
    FROM ${config.table}
    WHERE ${config.idColumn} <> ? AND ${config.publicWhere}
    ORDER BY ${config.orderBy}
    LIMIT ?
  `, [excludeId, safeLimit]);
  return normalizeRows(rows);
}
