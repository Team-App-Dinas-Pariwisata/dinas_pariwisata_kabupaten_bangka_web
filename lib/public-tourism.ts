import { facilityInfoForOwner, type FacilityInfo } from "@/lib/facilities";
import { getAll, isPublishedRecord, isTruthyDb, toTime, type DbRecord } from "@/lib/realtime-db";
import { browserSafeR2ImageUrl } from "@/lib/r2";

export type TourismKind = "tempat-wisata" | "kuliner" | "hotel" | "satwa-endemik";
export type PublicFacility = FacilityInfo;

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
  facilities: PublicFacility[];
  unggulan?: number;
  urutan_tampil?: number;
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
    menuLabel: "Tempat Wisata", eyebrow: "Jelajah Bangka", title: "Tempat wisata yang layak masuk rencana perjalanan.",
    description: "Temukan pantai, ruang alam, budaya, dan destinasi pilihan di Kabupaten Bangka.",
    detailPrimaryLabel: "Daya tarik utama", detailSecondaryLabel: "Akses transportasi", detailTertiaryLabel: "Informasi keselamatan",
  },
  kuliner: {
    menuLabel: "Kuliner", eyebrow: "Cita Rasa Bangka", title: "Kuliner lokal dari warung hingga ruang makan modern.",
    description: "Jelajahi usaha kuliner, menu unggulan, kisaran harga, dan pengalaman rasa khas Bangka.",
    detailPrimaryLabel: "Cita rasa khas", detailSecondaryLabel: "Menu unggulan", detailTertiaryLabel: "Metode pembayaran",
  },
  hotel: {
    menuLabel: "Hotel", eyebrow: "Tempat Menginap", title: "Pilihan akomodasi untuk perjalanan yang lebih nyaman.",
    description: "Temukan hotel dan penginapan dengan informasi lokasi, harga, fasilitas umum, dan reservasi.",
    detailPrimaryLabel: "Informasi reservasi", detailSecondaryLabel: "Aksesibilitas", detailTertiaryLabel: "Kebijakan hotel",
  },
  "satwa-endemik": {
    menuLabel: "Satwa Endemik", eyebrow: "Kekayaan Hayati", title: "Kenali satwa khas dan fauna penting di Bangka.",
    description: "Pelajari habitat, persebaran, ciri, dan informasi konservasi satwa yang hidup di wilayah Bangka dan sekitarnya.",
    detailPrimaryLabel: "Habitat", detailSecondaryLabel: "Persebaran", detailTertiaryLabel: "Fakta unik",
  },
};

function text(value: unknown) {
  return value == null || String(value).trim() === "" ? null : String(value);
}

function num(value: unknown) {
  const n = Number(value);
  return value == null || value === "" || !Number.isFinite(n) ? null : n;
}

function normalizePage(page: number) {
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

async function rowsForKind(kind: TourismKind): Promise<PublicTourismItem[]> {
  const now = Date.now();

  if (kind === "tempat-wisata") {
    const [rows, categories, relations, facilities] = await Promise.all([
      getAll<DbRecord>("tempat_wisata"),
      getAll<DbRecord>("master_kategori_wisata"),
      getAll<DbRecord>("tempat_wisata_fasilitas"),
      getAll<DbRecord>("master_fasilitas"),
    ]);
    const cats = new Map(categories.filter((r) => isTruthyDb(r.aktif)).map((r) => [Number(r.id), String(r.nama_kategori ?? "")]));
    return rows
      .filter((r) => isPublishedRecord(r, now) && cats.has(Number(r.kategori_wisata_id)))
      .map((r) => ({
        id: Number(r.id),
        slug: String(r.slug ?? ""),
        title: String(r.nama_tempat ?? ""),
        category: cats.get(Number(r.kategori_wisata_id)) ?? null,
        summary: text(r.deskripsi_singkat),
        description: text(r.deskripsi),
        image: text(r.foto_utama),
        address: text(r.alamat),
        subtitle: text(r.nama_pengelola),
        badge: text(r.waktu_kunjungan_terbaik),
        price_from: num(r.harga_tiket_domestik_dewasa),
        price_to: num(r.harga_tiket_mancanegara),
        detail_primary: text(r.daya_tarik_utama),
        detail_secondary: text(r.akses_transportasi),
        detail_tertiary: text(r.informasi_keselamatan),
        latitude: num(r.latitude),
        longitude: num(r.longitude),
        published_at: text(r.tanggal_publikasi),
        facilities: facilityInfoForOwner("tempat_wisata", Number(r.id), relations, facilities),
        unggulan: Number(r.unggulan ?? 0),
        urutan_tampil: Number(r.urutan_tampil ?? 0),
      }))
      .sort(publicSort);
  }

  if (kind === "kuliner") {
    const [rows, categories, relations, facilities] = await Promise.all([
      getAll<DbRecord>("kuliner"),
      getAll<DbRecord>("master_kategori_kuliner"),
      getAll<DbRecord>("kuliner_fasilitas"),
      getAll<DbRecord>("master_fasilitas"),
    ]);
    const cats = new Map(categories.filter((r) => isTruthyDb(r.aktif)).map((r) => [Number(r.id), String(r.nama_kategori ?? "")]));
    return rows
      .filter((r) => isPublishedRecord(r, now) && cats.has(Number(r.kategori_kuliner_id)))
      .map((r) => ({
        id: Number(r.id),
        slug: String(r.slug ?? ""),
        title: String(r.nama_usaha ?? ""),
        category: cats.get(Number(r.kategori_kuliner_id)) ?? null,
        summary: text(r.deskripsi_singkat),
        description: text(r.deskripsi),
        image: text(r.foto_utama),
        address: text(r.alamat),
        subtitle: text(r.nama_pemilik),
        badge: text(r.status_halal),
        price_from: num(r.harga_mulai),
        price_to: num(r.harga_sampai),
        detail_primary: text(r.cita_rasa_khas),
        detail_secondary: text(r.menu_unggulan),
        detail_tertiary: text(r.metode_pembayaran),
        latitude: num(r.latitude),
        longitude: num(r.longitude),
        published_at: text(r.tanggal_publikasi),
        facilities: facilityInfoForOwner("kuliner", Number(r.id), relations, facilities),
        unggulan: Number(r.unggulan ?? 0),
        urutan_tampil: Number(r.urutan_tampil ?? 0),
      }))
      .sort(publicSort);
  }

  if (kind === "hotel") {
    const [rows, types, relations, facilities] = await Promise.all([
      getAll<DbRecord>("hotel"),
      getAll<DbRecord>("master_jenis_hotel"),
      getAll<DbRecord>("hotel_fasilitas"),
      getAll<DbRecord>("master_fasilitas"),
    ]);
    const cats = new Map(types.filter((r) => isTruthyDb(r.aktif)).map((r) => [Number(r.id), String(r.nama_jenis ?? "")]));
    return rows
      .filter((r) => isPublishedRecord(r, now) && cats.has(Number(r.jenis_hotel_id)))
      .map((r) => ({
        id: Number(r.id),
        slug: String(r.slug ?? ""),
        title: String(r.nama_hotel ?? ""),
        category: cats.get(Number(r.jenis_hotel_id)) ?? null,
        summary: text(r.deskripsi_singkat),
        description: text(r.deskripsi),
        image: text(r.foto_utama),
        address: text(r.alamat),
        subtitle: text(r.nama_pengelola),
        badge: r.klasifikasi_bintang == null ? null : `${Number(r.klasifikasi_bintang)} bintang`,
        price_from: num(r.harga_mulai),
        price_to: num(r.harga_sampai),
        detail_primary: text(r.informasi_reservasi),
        detail_secondary: text(r.aksesibilitas),
        detail_tertiary: text(r.kebijakan_hotel),
        latitude: num(r.latitude),
        longitude: num(r.longitude),
        published_at: text(r.tanggal_publikasi),
        facilities: facilityInfoForOwner("hotel", Number(r.id), relations, facilities),
        unggulan: Number(r.unggulan ?? 0),
        urutan_tampil: Number(r.urutan_tampil ?? 0),
      }))
      .sort(publicSort);
  }

  const [rows, locations] = await Promise.all([
    getAll<DbRecord>("satwa_endemik"),
    getAll<DbRecord>("satwa_endemik_lokasi"),
  ]);
  return rows
    .filter((r) => isPublishedRecord(r, now))
    .map((r) => {
      const publicLocations = locations.filter((loc) => Number(loc.satwa_endemik_id) === Number(r.id) && isTruthyDb(loc.aktif) && String(loc.tingkat_sensitivitas ?? "") !== "Rahasia");
      const lats = publicLocations.map((loc) => num(loc.latitude_publik)).filter((v): v is number => v !== null);
      const lons = publicLocations.map((loc) => num(loc.longitude_publik)).filter((v): v is number => v !== null);
      return {
        id: Number(r.id),
        slug: String(r.slug ?? ""),
        title: String(r.nama_umum ?? ""),
        category: text(r.status_endemisitas),
        summary: text(r.deskripsi_singkat),
        description: text(r.deskripsi),
        image: text(r.foto_utama),
        address: text(r.wilayah_endemik),
        subtitle: text(r.nama_ilmiah),
        badge: text(r.status_perlindungan_indonesia),
        price_from: null,
        price_to: null,
        detail_primary: text(r.habitat),
        detail_secondary: text(r.persebaran),
        detail_tertiary: text(r.fakta_unik),
        latitude: lats.length ? Number((lats.reduce((a, b) => a + b, 0) / lats.length).toFixed(7)) : null,
        longitude: lons.length ? Number((lons.reduce((a, b) => a + b, 0) / lons.length).toFixed(7)) : null,
        published_at: text(r.tanggal_publikasi),
        facilities: [],
        unggulan: Number(r.unggulan ?? 0),
        urutan_tampil: Number(r.urutan_tampil ?? 0),
      };
    })
    .sort(publicSort);
}

function publicSort(a: PublicTourismItem, b: PublicTourismItem) {
  return Number(b.unggulan ?? 0) - Number(a.unggulan ?? 0)
    || Number(a.urutan_tampil ?? 0) - Number(b.urutan_tampil ?? 0)
    || toTime(b.published_at) - toTime(a.published_at)
    || b.id - a.id;
}

function normalizeRows(rows: PublicTourismItem[]) {
  return rows.map((row) => ({ ...row, image: browserSafeR2ImageUrl(row.image) }));
}

export async function getPublicTourismList(kind: TourismKind, page = 1, pageSize = 9) {
  const safePage = normalizePage(page);
  const safeSize = Math.min(Math.max(Math.floor(pageSize), 1), 24);
  const offset = (safePage - 1) * safeSize;
  const rows = await rowsForKind(kind);
  return {
    items: normalizeRows(rows.slice(offset, offset + safeSize)),
    total: rows.length,
    page: safePage,
    pageSize: safeSize,
    totalPages: Math.max(1, Math.ceil(rows.length / safeSize)),
  };
}

export async function getPublicTourismBySlug(kind: TourismKind, slug: string) {
  const row = (await rowsForKind(kind)).find((item) => item.slug === slug);
  return row ? normalizeRows([row])[0] : null;
}

export async function getRelatedTourism(kind: TourismKind, excludeId: number, limit = 3) {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 6);
  return normalizeRows((await rowsForKind(kind)).filter((row) => row.id !== excludeId).slice(0, safeLimit));
}
