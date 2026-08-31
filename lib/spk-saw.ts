import { byNumericId, getAll, isPublishedRecord, isTruthyDb, type DbRecord } from "@/lib/realtime-db";
import { browserSafeR2ImageUrl } from "@/lib/r2";

export type RecommendationKind = "tempat-wisata" | "kuliner" | "hotel" | "satwa-endemik";
export type SawCriterionType = "benefit" | "cost";

export type SawCriterion = {
  code: string;
  label: string;
  description: string | null;
  type: SawCriterionType;
  source: string;
  unit: string | null;
  defaultWeight: number;
  required: boolean;
};

export type RecommendationSearchInput = {
  category: RecommendationKind;
  keyword?: string;
  latitude?: number | null;
  longitude?: number | null;
  maxDistanceKm?: number | null;
  maxBudget?: number | null;
  priorities?: Record<string, number>;
  requirements?: {
    parking?: boolean;
    prayerRoom?: boolean;
    childFriendly?: boolean;
    familyFriendly?: boolean;
    seniorFriendly?: boolean;
    halalMode?: "semua" | "halal" | "bersertifikat";
    deliveryOnly?: boolean;
    minStars?: number;
    observationOnly?: boolean;
    educationalLocationOnly?: boolean;
  };
  limit?: number;
};

export type SawCriterionResult = {
  code: string;
  label: string;
  type: SawCriterionType;
  source: string;
  unit: string | null;
  rawValue: number | null;
  valueLabel: string;
  normalizedValue: number;
  weight: number;
  contribution: number;
};

export type RecommendationItem = {
  id: number;
  slug: string;
  title: string;
  category: string | null;
  summary: string | null;
  image: string | null;
  address: string | null;
  href: string;
  priceFrom: number | null;
  priceTo: number | null;
  distanceKm: number | null;
  score: number;
  rank: number;
  criteria: SawCriterionResult[];
  reasons: string[];
  facilities: string[];
};

type CriterionRow = DbRecord & {
  kode: string;
  nama_kriteria: string;
  deskripsi: string | null;
  tipe_kriteria: SawCriterionType;
  sumber_data: string | null;
  satuan: string | null;
  wajib: number;
  bobot: number | null;
};

type CandidateRow = DbRecord & {
  id: number;
  slug: string;
  title: string;
  category: string | null;
  summary: string | null;
  image: string | null;
  address: string | null;
  unggulan: number | null;
  price_from: number | null;
  price_to: number | null;
  [key: string]: unknown;
};

type Candidate = {
  id: number;
  slug: string;
  title: string;
  category: string | null;
  summary: string | null;
  image: string | null;
  address: string | null;
  unggulan: number;
  priceFrom: number | null;
  priceTo: number | null;
  priceKnown: boolean;
  distanceKm: number | null;
  facilities: string[];
  values: Record<string, number | null>;
  raw: CandidateRow;
};

const dbKind: Record<RecommendationKind, "tempat_wisata" | "kuliner" | "hotel" | "satwa_endemik"> = {
  "tempat-wisata": "tempat_wisata",
  kuliner: "kuliner",
  hotel: "hotel",
  "satwa-endemik": "satwa_endemik",
};

const hrefBase: Record<RecommendationKind, string> = {
  "tempat-wisata": "/wisata/tempat-wisata",
  kuliner: "/wisata/kuliner",
  hotel: "/wisata/hotel",
  "satwa-endemik": "/wisata/satwa-endemik",
};

const fallbackCriteria: Record<RecommendationKind, SawCriterion[]> = {
  "tempat-wisata": [
    { code: "harga", label: "Harga tiket", description: "Semakin rendah harga tiket, semakin baik.", type: "cost", source: "harga_tiket_referensi", unit: "Rp", defaultWeight: 0.22, required: false },
    { code: "jarak", label: "Jarak", description: "Jarak dari lokasi pengguna ke destinasi.", type: "cost", source: "jarak_km", unit: "km", defaultWeight: 0.22, required: false },
    { code: "fasilitas", label: "Fasilitas", description: "Jumlah fasilitas yang tercatat pada destinasi.", type: "benefit", source: "jumlah_fasilitas", unit: "fasilitas", defaultWeight: 0.16, required: false },
    { code: "aktivitas", label: "Aktivitas", description: "Jumlah aktivitas wisata yang tersedia.", type: "benefit", source: "jumlah_aktivitas", unit: "aktivitas", defaultWeight: 0.12, required: false },
    { code: "akses", label: "Kemudahan akses", description: "Skor aksesibilitas destinasi.", type: "benefit", source: "skor_aksesibilitas", unit: "skor", defaultWeight: 0.14, required: false },
    { code: "kesesuaian", label: "Kesesuaian pengunjung", description: "Kecocokan untuk anak, keluarga, dan lansia.", type: "benefit", source: "skor_kesesuaian_pengunjung", unit: "skor", defaultWeight: 0.14, required: false },
  ],
  kuliner: [
    { code: "harga", label: "Harga", description: "Semakin rendah harga referensi, semakin baik.", type: "cost", source: "harga_referensi", unit: "Rp", defaultWeight: 0.26, required: false },
    { code: "jarak", label: "Jarak", description: "Jarak dari lokasi pengguna ke tempat kuliner.", type: "cost", source: "jarak_km", unit: "km", defaultWeight: 0.24, required: false },
    { code: "halal", label: "Status halal", description: "Skor status halal yang tercatat pada database.", type: "benefit", source: "skor_halal", unit: "skor", defaultWeight: 0.20, required: false },
    { code: "layanan", label: "Pilihan layanan", description: "Dine-in, takeaway, delivery, dan reservasi.", type: "benefit", source: "jumlah_layanan", unit: "layanan", defaultWeight: 0.14, required: false },
    { code: "fasilitas", label: "Fasilitas", description: "Jumlah fasilitas yang tersedia.", type: "benefit", source: "jumlah_fasilitas", unit: "fasilitas", defaultWeight: 0.16, required: false },
  ],
  hotel: [
    { code: "harga", label: "Harga", description: "Semakin rendah harga referensi kamar, semakin baik.", type: "cost", source: "harga_referensi", unit: "Rp", defaultWeight: 0.30, required: false },
    { code: "jarak", label: "Jarak", description: "Jarak dari lokasi pengguna ke hotel.", type: "cost", source: "jarak_km", unit: "km", defaultWeight: 0.24, required: false },
    { code: "bintang", label: "Klasifikasi bintang", description: "Semakin tinggi klasifikasi bintang, semakin baik.", type: "benefit", source: "klasifikasi_bintang", unit: "bintang", defaultWeight: 0.20, required: false },
    { code: "fasilitas", label: "Fasilitas", description: "Jumlah fasilitas hotel yang tercatat.", type: "benefit", source: "jumlah_fasilitas", unit: "fasilitas", defaultWeight: 0.16, required: false },
    { code: "akses", label: "Aksesibilitas", description: "Skor fasilitas aksesibilitas hotel.", type: "benefit", source: "skor_aksesibilitas", unit: "skor", defaultWeight: 0.10, required: false },
  ],
  "satwa-endemik": [
    { code: "jarak", label: "Jarak lokasi publik", description: "Jarak ke koordinat publik yang telah digeneralisasi.", type: "cost", source: "jarak_km", unit: "km", defaultWeight: 0.28, required: false },
    { code: "kemudahan", label: "Kemudahan pengamatan", description: "Skor akses terbaik pada lokasi yang mengizinkan pengamatan.", type: "benefit", source: "skor_kemudahan_pengamatan", unit: "skor", defaultWeight: 0.24, required: false },
    { code: "lokasi_pengamatan", label: "Lokasi pengamatan", description: "Jumlah lokasi publik yang mengizinkan pengamatan.", type: "benefit", source: "jumlah_lokasi_pengamatan", unit: "lokasi", defaultWeight: 0.18, required: false },
    { code: "lokasi_edukasi", label: "Lokasi edukasi", description: "Jumlah pusat konservasi, wisata edukasi, atau penangkaran.", type: "benefit", source: "jumlah_lokasi_edukasi", unit: "lokasi", defaultWeight: 0.15, required: false },
    { code: "endemisitas", label: "Tingkat endemisitas", description: "Endemik lokal dan regional mendapat skor lebih tinggi.", type: "benefit", source: "skor_endemisitas", unit: "skor", defaultWeight: 0.15, required: false },
  ],
};

const supportedSources = new Set([
  "jarak_km",
  "harga_tiket_referensi",
  "durasi_kunjungan_menit",
  "skor_kesesuaian_pengunjung",
  "skor_aksesibilitas",
  "jumlah_fasilitas",
  "jumlah_aktivitas",
  "memiliki_parkir",
  "memiliki_musala",
  "harga_referensi",
  "skor_halal",
  "jumlah_layanan",
  "klasifikasi_bintang",
  "jumlah_kamar",
  "skor_prioritas_konservasi",
  "jumlah_lokasi",
  "jumlah_lokasi_pengamatan",
  "jumlah_lokasi_edukasi",
  "skor_kemudahan_pengamatan",
  "skor_endemisitas",
]);

function normalizeToken(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function inferSource(kind: RecommendationKind, code: string, label: string) {
  const token = `${normalizeToken(code)}_${normalizeToken(label)}`;
  if (token.includes("jarak")) return "jarak_km";
  if (token.includes("harga") || token.includes("biaya") || token.includes("tiket")) {
    return kind === "tempat-wisata" ? "harga_tiket_referensi" : "harga_referensi";
  }
  if (token.includes("fasil")) return "jumlah_fasilitas";
  if (token.includes("aktiv")) return "jumlah_aktivitas";
  if (token.includes("akses")) return "skor_aksesibilitas";
  if (token.includes("keluarga") || token.includes("pengunjung") || token.includes("kesesuaian")) return "skor_kesesuaian_pengunjung";
  if (token.includes("halal")) return "skor_halal";
  if (token.includes("layanan")) return "jumlah_layanan";
  if (token.includes("bintang")) return "klasifikasi_bintang";
  if (token.includes("kamar")) return "jumlah_kamar";
  if (token.includes("konservasi") || token.includes("prioritas")) return "skor_prioritas_konservasi";
  if (token.includes("kemudahan") && token.includes("pengamatan")) return "skor_kemudahan_pengamatan";
  if (token.includes("edukasi")) return "jumlah_lokasi_edukasi";
  if (token.includes("pengamatan") || token.includes("observasi")) return "jumlah_lokasi_pengamatan";
  if (token.includes("endem")) return "skor_endemisitas";
  if (token.includes("lokasi")) return "jumlah_lokasi";
  if (token.includes("parkir")) return "memiliki_parkir";
  if (token.includes("musala") || token.includes("mushola")) return "memiliki_musala";
  return null;
}

function criterionFromRow(kind: RecommendationKind, row: CriterionRow): SawCriterion | null {
  const explicitSource = row.sumber_data ? normalizeToken(row.sumber_data) : null;
  const inferred = inferSource(kind, row.kode, row.nama_kriteria);
  const source = explicitSource && supportedSources.has(explicitSource) ? explicitSource : inferred;
  if (!source || !supportedSources.has(source)) return null;

  const weight = Number(row.bobot);
  return {
    code: row.kode,
    label: row.nama_kriteria,
    description: row.deskripsi,
    type: row.tipe_kriteria === "cost" ? "cost" : "benefit",
    source,
    unit: row.satuan,
    defaultWeight: Number.isFinite(weight) && weight > 0 ? weight : 1,
    required: Boolean(row.wajib),
  };
}

export async function getSawCriteria(kind: RecommendationKind): Promise<SawCriterion[]> {
  try {
    const [criteriaRows, weightRows] = await Promise.all([
      getAll<CriterionRow>("spk_kriteria"),
      getAll<DbRecord>("spk_bobot"),
    ]);
    const weights = new Map<number, number>();
    for (const row of weightRows) {
      if (!isTruthyDb(row.aktif)) continue;
      const criterionId = Number(row.kriteria_id);
      const weight = Number(row.bobot);
      if (Number.isFinite(criterionId) && Number.isFinite(weight)) weights.set(criterionId, weight);
    }
    const rows = criteriaRows
      .filter((row) => String(row.jenis_objek ?? "") === dbKind[kind] && isTruthyDb(row.aktif))
      .sort((a, b) => Number(a.urutan ?? 0) - Number(b.urutan ?? 0) || Number(a.id ?? 0) - Number(b.id ?? 0))
      .map((row) => ({ ...row, bobot: weights.get(Number(row.id)) ?? null } as CriterionRow));

    const mapped = rows.map((row) => criterionFromRow(kind, row)).filter((item): item is SawCriterion => Boolean(item));
    if (mapped.length > 0) return mapped;
  } catch (error) {
    console.warn("Konfigurasi SPK Firebase belum dapat dibaca; memakai konfigurasi fallback.", error);
  }
  return fallbackCriteria[kind];
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusKm = 6371.0088;
  const toRad = (degree: number) => degree * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function hasUserLocation(input: RecommendationSearchInput) {
  return Number.isFinite(input.latitude) && Number.isFinite(input.longitude);
}

function endemisitasScore(value: unknown) {
  switch (String(value ?? "")) {
    case "Endemik Lokal": return 5;
    case "Endemik Regional": return 4;
    case "Asli/Native": return 3;
    case "Migran": return 2;
    case "Introduksi": return 1;
    default: return 0;
  }
}

function accessScore(value: unknown) {
  switch (String(value ?? "")) {
    case "Sangat Mudah": return 5;
    case "Mudah": return 4;
    case "Sedang": return 3;
    case "Sulit": return 2;
    case "Sangat Sulit": return 1;
    default: return 0;
  }
}

function referenceAverage(from: unknown, to: unknown) {
  const a = toNumber(from);
  const b = toNumber(to);
  if (a !== null && b !== null) return (a + b) / 2;
  return a ?? b ?? 0;
}

function featuredSort(a: DbRecord, b: DbRecord) {
  return Number(b.unggulan ?? 0) - Number(a.unggulan ?? 0)
    || Number(a.urutan_tampil ?? 0) - Number(b.urutan_tampil ?? 0)
    || Number(b.id ?? 0) - Number(a.id ?? 0);
}

function relationRowsByOwner(rows: DbRecord[], ownerField: string) {
  const map = new Map<number, DbRecord[]>();
  for (const row of rows) {
    const ownerId = Number(row[ownerField]);
    if (!Number.isFinite(ownerId)) continue;
    const bucket = map.get(ownerId) ?? [];
    bucket.push(row);
    map.set(ownerId, bucket);
  }
  return map;
}

async function fetchCandidateRows(kind: RecommendationKind): Promise<CandidateRow[]> {
  if (kind === "tempat-wisata") {
    const [places, categories, facilityRelations, facilities, activities] = await Promise.all([
      getAll<DbRecord>("tempat_wisata"),
      getAll<DbRecord>("master_kategori_wisata"),
      getAll<DbRecord>("tempat_wisata_fasilitas"),
      getAll<DbRecord>("master_fasilitas"),
      getAll<DbRecord>("tempat_wisata_aktivitas"),
    ]);
    const categoryMap = byNumericId(categories);
    const facilityMap = byNumericId(facilities);
    const relByOwner = relationRowsByOwner(facilityRelations, "tempat_wisata_id");
    const actByOwner = relationRowsByOwner(activities, "tempat_wisata_id");
    return places
      .filter((row) => isPublishedRecord(row) && isTruthyDb(categoryMap.get(Number(row.kategori_wisata_id))?.aktif))
      .sort(featuredSort)
      .slice(0, 500)
      .map((row) => {
        const rels = relByOwner.get(Number(row.id)) ?? [];
        const resolvedFacilities = rels
          .map((rel) => facilityMap.get(Number(rel.fasilitas_id)))
          .filter((facility): facility is DbRecord => Boolean(facility && isTruthyDb(facility.aktif)));
        const codes = new Set(resolvedFacilities.map((facility) => String(facility.kode ?? "")));
        const facilityNames = [...new Set(resolvedFacilities.map((facility) => String(facility.nama_fasilitas ?? "")).filter(Boolean))];
        const adult = toNumber(row.harga_tiket_domestik_dewasa);
        const child = toNumber(row.harga_tiket_domestik_anak);
        const foreign = toNumber(row.harga_tiket_mancanegara);
        return {
          ...row,
          id: Number(row.id),
          slug: String(row.slug ?? ""),
          unggulan: Number(row.unggulan ?? 0),
          title: String(row.nama_tempat ?? ""),
          category: String(categoryMap.get(Number(row.kategori_wisata_id))?.nama_kategori ?? "") || null,
          summary: row.deskripsi_singkat == null ? null : String(row.deskripsi_singkat),
          image: row.foto_utama == null ? null : String(row.foto_utama),
          address: row.alamat == null ? null : String(row.alamat),
          price_from: adult,
          price_to: foreign ?? child,
          source_price_adult: adult,
          source_price_child: child,
          source_price_foreign: foreign,
          harga_tiket_referensi: adult ?? child ?? foreign ?? 0,
          skor_kesesuaian_pengunjung: Number(row.cocok_anak ?? 0) + Number(row.cocok_keluarga ?? 0) + Number(row.ramah_lansia ?? 0),
          skor_aksesibilitas: accessScore(row.tingkat_kesulitan_akses),
          jumlah_fasilitas: resolvedFacilities.length,
          facilities: facilityNames,
          jumlah_aktivitas: (actByOwner.get(Number(row.id)) ?? []).filter((item) => isTruthyDb(item.aktif)).length,
          memiliki_parkir: codes.has("PARKIR") ? 1 : 0,
          memiliki_musala: codes.has("MUSALA") ? 1 : 0,
        } as CandidateRow;
      });
  }

  if (kind === "kuliner") {
    const [businesses, categories, facilityRelations, facilities] = await Promise.all([
      getAll<DbRecord>("kuliner"),
      getAll<DbRecord>("master_kategori_kuliner"),
      getAll<DbRecord>("kuliner_fasilitas"),
      getAll<DbRecord>("master_fasilitas"),
    ]);
    const categoryMap = byNumericId(categories);
    const facilityMap = byNumericId(facilities);
    const relByOwner = relationRowsByOwner(facilityRelations, "kuliner_id");
    const halalScore = (status: unknown) => ({ "Halal Bersertifikat": 5, "Klaim Halal": 4, "Proses Sertifikasi": 3, "Belum Diketahui": 1, "Tidak Halal": 0 }[String(status ?? "")] ?? 0);
    return businesses
      .filter((row) => isPublishedRecord(row) && isTruthyDb(categoryMap.get(Number(row.kategori_kuliner_id))?.aktif))
      .sort(featuredSort)
      .slice(0, 500)
      .map((row) => {
        const rels = relByOwner.get(Number(row.id)) ?? [];
        const resolvedFacilities = rels
          .map((rel) => facilityMap.get(Number(rel.fasilitas_id)))
          .filter((facility): facility is DbRecord => Boolean(facility && isTruthyDb(facility.aktif)));
        const codes = new Set(resolvedFacilities.map((facility) => String(facility.kode ?? "")));
        const facilityNames = [...new Set(resolvedFacilities.map((facility) => String(facility.nama_fasilitas ?? "")).filter(Boolean))];
        return {
          ...row,
          id: Number(row.id),
          slug: String(row.slug ?? ""),
          unggulan: Number(row.unggulan ?? 0),
          title: String(row.nama_usaha ?? ""),
          category: String(categoryMap.get(Number(row.kategori_kuliner_id))?.nama_kategori ?? "") || null,
          summary: row.deskripsi_singkat == null ? null : String(row.deskripsi_singkat),
          image: row.foto_utama == null ? null : String(row.foto_utama),
          address: row.alamat == null ? null : String(row.alamat),
          price_from: toNumber(row.harga_mulai),
          price_to: toNumber(row.harga_sampai),
          source_price_from: toNumber(row.harga_mulai),
          source_price_to: toNumber(row.harga_sampai),
          harga_referensi: referenceAverage(row.harga_mulai, row.harga_sampai),
          skor_halal: halalScore(row.status_halal),
          jumlah_layanan: Number(row.tersedia_dine_in ?? 0) + Number(row.tersedia_takeaway ?? 0) + Number(row.tersedia_delivery ?? 0) + Number(row.menerima_reservasi ?? 0),
          jumlah_fasilitas: resolvedFacilities.length,
          facilities: facilityNames,
          memiliki_parkir: codes.has("PARKIR") ? 1 : 0,
          memiliki_musala: codes.has("MUSALA") ? 1 : 0,
        } as CandidateRow;
      });
  }

  if (kind === "hotel") {
    const [hotels, types, facilityRelations, facilities] = await Promise.all([
      getAll<DbRecord>("hotel"),
      getAll<DbRecord>("master_jenis_hotel"),
      getAll<DbRecord>("hotel_fasilitas"),
      getAll<DbRecord>("master_fasilitas"),
    ]);
    const typeMap = byNumericId(types);
    const facilityMap = byNumericId(facilities);
    const relByOwner = relationRowsByOwner(facilityRelations, "hotel_id");
    return hotels
      .filter((row) => isPublishedRecord(row) && isTruthyDb(typeMap.get(Number(row.jenis_hotel_id))?.aktif))
      .sort(featuredSort)
      .slice(0, 500)
      .map((row) => {
        const rels = relByOwner.get(Number(row.id)) ?? [];
        const resolvedFacilities = rels
          .map((rel) => facilityMap.get(Number(rel.fasilitas_id)))
          .filter((facility): facility is DbRecord => Boolean(facility && isTruthyDb(facility.aktif)));
        const codes = new Set(resolvedFacilities.map((facility) => String(facility.kode ?? "")));
        const facilityNames = [...new Set(resolvedFacilities.map((facility) => String(facility.nama_fasilitas ?? "")).filter(Boolean))];
        return {
          ...row,
          id: Number(row.id),
          slug: String(row.slug ?? ""),
          unggulan: Number(row.unggulan ?? 0),
          title: String(row.nama_hotel ?? ""),
          category: String(typeMap.get(Number(row.jenis_hotel_id))?.nama_jenis ?? "") || null,
          summary: row.deskripsi_singkat == null ? null : String(row.deskripsi_singkat),
          image: row.foto_utama == null ? null : String(row.foto_utama),
          address: row.alamat == null ? null : String(row.alamat),
          price_from: toNumber(row.harga_mulai),
          price_to: toNumber(row.harga_sampai),
          source_price_from: toNumber(row.harga_mulai),
          source_price_to: toNumber(row.harga_sampai),
          harga_referensi: referenceAverage(row.harga_mulai, row.harga_sampai),
          jumlah_fasilitas: resolvedFacilities.length,
          facilities: facilityNames,
          memiliki_parkir: codes.has("PARKIR") ? 1 : 0,
          memiliki_musala: codes.has("MUSALA") ? 1 : 0,
          skor_aksesibilitas: ["DIFABEL", "KURSI_RODA", "LIFT", "PARKIR"].filter((code) => codes.has(code)).length,
        } as CandidateRow;
      });
  }

  const [animals, statuses, locations] = await Promise.all([
    getAll<DbRecord>("satwa_endemik"),
    getAll<DbRecord>("master_status_konservasi"),
    getAll<DbRecord>("satwa_endemik_lokasi"),
  ]);
  const statusMap = byNumericId(statuses);
  const locationsByAnimal = relationRowsByOwner(locations, "satwa_endemik_id");
  return animals
    .filter((row) => isPublishedRecord(row))
    .sort(featuredSort)
    .slice(0, 500)
    .map((row) => {
      const allLocations = (locationsByAnimal.get(Number(row.id)) ?? []).filter((item) => isTruthyDb(item.aktif));
      const publicLocations = allLocations.filter((item) => String(item.tingkat_sensitivitas ?? "") !== "Rahasia");
      const observation = publicLocations.filter((item) => isTruthyDb(item.pengamatan_diizinkan));
      const education = allLocations.filter((item) => ["Pusat Konservasi", "Wisata Edukasi", "Penangkaran"].includes(String(item.jenis_lokasi ?? "")));
      const lats = publicLocations.map((item) => toNumber(item.latitude_publik)).filter((v): v is number => v !== null);
      const lons = publicLocations.map((item) => toNumber(item.longitude_publik)).filter((v): v is number => v !== null);
      const status = statusMap.get(Number(row.status_konservasi_id));
      return {
        ...row,
        id: Number(row.id),
        slug: String(row.slug ?? ""),
        unggulan: Number(row.unggulan ?? 0),
        title: String(row.nama_umum ?? ""),
        category: row.status_endemisitas == null ? null : String(row.status_endemisitas),
        summary: row.deskripsi_singkat == null ? null : String(row.deskripsi_singkat),
        image: row.foto_utama == null ? null : String(row.foto_utama),
        address: row.wilayah_endemik == null ? null : String(row.wilayah_endemik),
        price_from: null,
        price_to: null,
        kode_status_konservasi: status?.kode ?? null,
        status_konservasi: status?.nama_status ?? null,
        skor_prioritas_konservasi: Number(status?.urutan_prioritas ?? 0),
        latitude: lats.length ? lats.reduce((sum, v) => sum + v, 0) / lats.length : null,
        longitude: lons.length ? lons.reduce((sum, v) => sum + v, 0) / lons.length : null,
        jumlah_lokasi: allLocations.length,
        jumlah_lokasi_pengamatan: observation.length,
        jumlah_lokasi_edukasi: education.length,
        skor_kemudahan_pengamatan: observation.reduce((max, item) => Math.max(max, accessScore(item.tingkat_akses)), 0),
      } as CandidateRow;
    });
}

function hasKnownPrice(kind: RecommendationKind, row: CandidateRow) {
  if (kind === "satwa-endemik") return false;
  if (kind === "tempat-wisata") {
    return [row.source_price_adult, row.source_price_child, row.source_price_foreign].some((value) => toNumber(value) !== null);
  }
  return [row.source_price_from, row.source_price_to].some((value) => toNumber(value) !== null);
}

function candidateValue(kind: RecommendationKind, row: CandidateRow, source: string, distanceKm: number | null, priceKnown: boolean) {
  if (source === "jarak_km") return distanceKm;
  if (source === "skor_endemisitas") return endemisitasScore(row.status_endemisitas);
  if ((source === "harga_referensi" || source === "harga_tiket_referensi") && !priceKnown) return null;
  return toNumber(row[source]);
}

function buildCandidates(kind: RecommendationKind, rows: CandidateRow[], criteria: SawCriterion[], input: RecommendationSearchInput) {
  const locationAvailable = hasUserLocation(input);
  const userLat = locationAvailable ? Number(input.latitude) : null;
  const userLon = locationAvailable ? Number(input.longitude) : null;

  return rows.map<Candidate>((row) => {
    const lat = toNumber(row.latitude);
    const lon = toNumber(row.longitude);
    const distanceKm = userLat !== null && userLon !== null && lat !== null && lon !== null
      ? haversineKm(userLat, userLon, lat, lon)
      : null;
    const priceKnown = hasKnownPrice(kind, row);
    const values: Record<string, number | null> = {};
    for (const criterion of criteria) {
      values[criterion.code] = candidateValue(kind, row, criterion.source, distanceKm, priceKnown);
    }

    return {
      id: Number(row.id),
      slug: String(row.slug),
      title: String(row.title),
      category: row.category ? String(row.category) : null,
      summary: row.summary ? String(row.summary) : null,
      image: browserSafeR2ImageUrl(row.image ? String(row.image) : null),
      address: row.address ? String(row.address) : null,
      unggulan: Number(row.unggulan ?? 0),
      priceFrom: priceKnown ? toNumber(row.price_from) : null,
      priceTo: priceKnown ? toNumber(row.price_to) : null,
      priceKnown,
      distanceKm,
      facilities: Array.isArray(row.facilities) ? row.facilities.map((facility) => String(facility)).filter(Boolean) : [],
      values,
      raw: row,
    };
  });
}

function keywordMatches(candidate: Candidate, keyword: string) {
  const needle = keyword.trim().toLocaleLowerCase("id-ID");
  if (!needle) return true;
  return [candidate.title, candidate.category, candidate.summary, candidate.address, ...candidate.facilities]
    .filter(Boolean)
    .some((value) => String(value).toLocaleLowerCase("id-ID").includes(needle));
}

function isHalalMatch(status: string, mode: "semua" | "halal" | "bersertifikat") {
  if (mode === "semua") return true;
  if (mode === "bersertifikat") return status === "Halal Bersertifikat";
  return ["Halal Bersertifikat", "Klaim Halal", "Proses Sertifikasi"].includes(status);
}

function applyHardFilters(kind: RecommendationKind, candidates: Candidate[], input: RecommendationSearchInput) {
  const req = input.requirements ?? {};
  const maxBudget = toNumber(input.maxBudget);
  const maxDistance = toNumber(input.maxDistanceKm);
  const hasLocation = hasUserLocation(input);
  const keyword = input.keyword ?? "";

  return candidates.filter((candidate) => {
    if (!keywordMatches(candidate, keyword)) return false;

    if (maxBudget !== null && maxBudget > 0 && kind !== "satwa-endemik") {
      if (!candidate.priceKnown) return false;
      const reference = candidate.priceFrom ?? candidate.priceTo;
      if (reference === null || reference > maxBudget) return false;
    }

    if (maxDistance !== null && maxDistance > 0 && hasLocation) {
      if (candidate.distanceKm === null || candidate.distanceKm > maxDistance) return false;
    }

    if (req.parking && Number(candidate.raw.memiliki_parkir ?? 0) !== 1) return false;
    if (req.prayerRoom && Number(candidate.raw.memiliki_musala ?? 0) !== 1) return false;

    if (kind === "tempat-wisata") {
      if (req.childFriendly && Number(candidate.raw.cocok_anak ?? 0) !== 1) return false;
      if (req.familyFriendly && Number(candidate.raw.cocok_keluarga ?? 0) !== 1) return false;
      if (req.seniorFriendly && Number(candidate.raw.ramah_lansia ?? 0) !== 1) return false;
    }

    if (kind === "kuliner") {
      const halalMode = req.halalMode ?? "semua";
      if (!isHalalMatch(String(candidate.raw.status_halal ?? ""), halalMode)) return false;
      if (req.deliveryOnly && Number(candidate.raw.tersedia_delivery ?? 0) !== 1) return false;
    }

    if (kind === "hotel") {
      const minStars = clamp(Number(req.minStars ?? 0), 0, 5);
      if (minStars > 0 && Number(candidate.raw.klasifikasi_bintang ?? 0) < minStars) return false;
    }

    if (kind === "satwa-endemik") {
      if (req.observationOnly && Number(candidate.raw.jumlah_lokasi_pengamatan ?? 0) < 1) return false;
      if (req.educationalLocationOnly && Number(candidate.raw.jumlah_lokasi_edukasi ?? 0) < 1) return false;
    }

    return true;
  });
}

function hasUsableData(candidates: Candidate[], criterion: SawCriterion) {
  if (criterion.source === "jarak_km" && candidates.every((candidate) => candidate.distanceKm === null)) return false;
  return candidates.some((candidate) => candidate.values[criterion.code] !== null);
}

function normalizedValues(candidates: Candidate[], criterion: SawCriterion) {
  const finiteValues = candidates
    .map((candidate) => candidate.values[criterion.code])
    .filter((value): value is number => value !== null && Number.isFinite(value));

  if (finiteValues.length === 0) return new Map<number, number>();
  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  const result = new Map<number, number>();

  for (const candidate of candidates) {
    const value = candidate.values[criterion.code];
    if (value === null || !Number.isFinite(value)) {
      result.set(candidate.id, 0);
      continue;
    }

    if (max === min) {
      result.set(candidate.id, 1);
      continue;
    }

    if (criterion.type === "benefit") {
      if (max === 0) result.set(candidate.id, 1);
      else result.set(candidate.id, clamp(value / max, 0, 1));
      continue;
    }

    // SAW cost lazimnya min(x)/x. Jika nilai minimum 0 (misalnya gratis),
    // transformasi linier ekuivalen dipakai agar tidak terjadi pembagian nol.
    if (min === 0) {
      result.set(candidate.id, clamp((max - value) / (max - min), 0, 1));
    } else {
      result.set(candidate.id, clamp(min / value, 0, 1));
    }
  }
  return result;
}

function normalizedWeight(criterion: SawCriterion, priorities: Record<string, number> | undefined) {
  const priority = clamp(Number(priorities?.[criterion.code] ?? 3), 1, 5);
  return Math.max(criterion.defaultWeight, 0.000001) * priority;
}

function formatCriterionValue(source: string, unit: string | null, value: number | null) {
  if (value === null) return "Data belum tersedia";
  if (source.includes("harga")) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
  }
  if (source === "jarak_km") return `${value.toFixed(value < 10 ? 1 : 0)} km`;
  if (unit) return `${Number.isInteger(value) ? value : value.toFixed(2)} ${unit}`;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function scoreCandidates(candidates: Candidate[], criteria: SawCriterion[], input: RecommendationSearchInput) {
  const activeCriteria = criteria.filter((criterion) => hasUsableData(candidates, criterion));
  const rawWeights = activeCriteria.map((criterion) => normalizedWeight(criterion, input.priorities));
  const weightSum = rawWeights.reduce((sum, weight) => sum + weight, 0) || 1;
  const weights = new Map(activeCriteria.map((criterion, index) => [criterion.code, rawWeights[index] / weightSum]));
  const matrices = new Map(activeCriteria.map((criterion) => [criterion.code, normalizedValues(candidates, criterion)]));

  return candidates.map((candidate) => {
    const criterionResults = activeCriteria.map<SawCriterionResult>((criterion) => {
      const normalizedValue = matrices.get(criterion.code)?.get(candidate.id) ?? 0;
      const weight = weights.get(criterion.code) ?? 0;
      const rawValue = candidate.values[criterion.code] ?? null;
      return {
        code: criterion.code,
        label: criterion.label,
        type: criterion.type,
        source: criterion.source,
        unit: criterion.unit,
        rawValue,
        valueLabel: formatCriterionValue(criterion.source, criterion.unit, rawValue),
        normalizedValue,
        weight,
        contribution: normalizedValue * weight,
      };
    });
    const score = criterionResults.reduce((sum, criterion) => sum + criterion.contribution, 0);
    const reasons = [...criterionResults]
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3)
      .map((criterion) => `${criterion.label}: ${criterion.valueLabel}`);

    return { candidate, score, criteria: criterionResults, reasons };
  });
}

export async function findSawRecommendations(input: RecommendationSearchInput) {
  const criteria = await getSawCriteria(input.category);
  const rows = await fetchCandidateRows(input.category);
  const allCandidates = buildCandidates(input.category, rows, criteria, input);
  const filteredCandidates = applyHardFilters(input.category, allCandidates, input);
  const scored = scoreCandidates(filteredCandidates, criteria, input)
    .sort((a, b) => b.score - a.score || b.candidate.unggulan - a.candidate.unggulan || a.candidate.title.localeCompare(b.candidate.title, "id"));

  const safeLimit = clamp(Math.floor(Number(input.limit ?? 12)), 1, 24);
  const items: RecommendationItem[] = scored.slice(0, safeLimit).map((entry, index) => ({
    id: entry.candidate.id,
    slug: entry.candidate.slug,
    title: entry.candidate.title,
    category: entry.candidate.category,
    summary: entry.candidate.summary,
    image: entry.candidate.image,
    address: entry.candidate.address,
    href: `${hrefBase[input.category]}/${entry.candidate.slug}`,
    priceFrom: entry.candidate.priceFrom,
    priceTo: entry.candidate.priceTo,
    distanceKm: entry.candidate.distanceKm,
    score: entry.score,
    rank: index + 1,
    criteria: entry.criteria,
    reasons: entry.reasons,
    facilities: entry.candidate.facilities,
  }));

  return {
    items,
    totalCandidates: allCandidates.length,
    totalMatched: filteredCandidates.length,
    criteria,
    usedLocation: hasUserLocation(input),
  };
}
