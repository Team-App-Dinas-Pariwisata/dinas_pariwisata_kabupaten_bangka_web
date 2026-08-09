import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
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
};

type CriterionRow = RowDataPacket & {
  kode: string;
  nama_kriteria: string;
  deskripsi: string | null;
  tipe_kriteria: SawCriterionType;
  sumber_data: string | null;
  satuan: string | null;
  wajib: number;
  bobot: number | null;
};

type CandidateRow = RowDataPacket & {
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
    const [rows] = await db().query<CriterionRow[]>(`
      SELECT
        sk.kode,
        sk.nama_kriteria,
        sk.deskripsi,
        sk.tipe_kriteria,
        sk.sumber_data,
        sk.satuan,
        sk.wajib,
        sb.bobot
      FROM spk_kriteria sk
      LEFT JOIN spk_bobot sb
        ON sb.kriteria_id = sk.id
       AND sb.aktif = 1
      WHERE sk.jenis_objek = ?
        AND sk.aktif = 1
      ORDER BY sk.urutan ASC, sk.id ASC
    `, [dbKind[kind]]);

    const mapped = rows.map((row) => criterionFromRow(kind, row)).filter((item): item is SawCriterion => Boolean(item));
    if (mapped.length > 0) return mapped;
  } catch (error) {
    console.warn("Konfigurasi SPK database belum dapat dibaca; memakai konfigurasi fallback.", error);
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

async function fetchCandidateRows(kind: RecommendationKind): Promise<CandidateRow[]> {
  switch (kind) {
    case "tempat-wisata": {
      const [rows] = await db().query<CandidateRow[]>(`
        SELECT
          v.*,
          t.nama_tempat AS title,
          v.kategori_wisata AS category,
          t.deskripsi_singkat AS summary,
          t.foto_utama AS image,
          t.alamat AS address,
          t.unggulan AS unggulan,
          t.harga_tiket_domestik_dewasa AS price_from,
          COALESCE(t.harga_tiket_mancanegara, t.harga_tiket_domestik_anak) AS price_to,
          t.harga_tiket_domestik_dewasa AS source_price_adult,
          t.harga_tiket_domestik_anak AS source_price_child,
          t.harga_tiket_mancanegara AS source_price_foreign
        FROM vw_spk_tempat_wisata v
        INNER JOIN tempat_wisata t ON t.id = v.id
        INNER JOIN master_kategori_wisata mk ON mk.id = t.kategori_wisata_id
        WHERE t.dipublikasikan = 1
          AND t.aktif = 1
          AND mk.aktif = 1
          AND t.tanggal_publikasi IS NOT NULL
          AND t.tanggal_publikasi <= NOW()
        ORDER BY t.unggulan DESC, t.urutan_tampil ASC, t.id DESC
        LIMIT 500
      `);
      return rows;
    }
    case "kuliner": {
      const [rows] = await db().query<CandidateRow[]>(`
        SELECT
          v.*,
          t.nama_usaha AS title,
          v.kategori_kuliner AS category,
          t.deskripsi_singkat AS summary,
          t.foto_utama AS image,
          t.alamat AS address,
          t.unggulan AS unggulan,
          t.harga_mulai AS price_from,
          t.harga_sampai AS price_to,
          t.harga_mulai AS source_price_from,
          t.harga_sampai AS source_price_to,
          t.tersedia_delivery AS tersedia_delivery
        FROM vw_spk_kuliner v
        INNER JOIN kuliner t ON t.id = v.id
        INNER JOIN master_kategori_kuliner mk ON mk.id = t.kategori_kuliner_id
        WHERE t.dipublikasikan = 1
          AND t.aktif = 1
          AND mk.aktif = 1
          AND t.tanggal_publikasi IS NOT NULL
          AND t.tanggal_publikasi <= NOW()
        ORDER BY t.unggulan DESC, t.urutan_tampil ASC, t.id DESC
        LIMIT 500
      `);
      return rows;
    }
    case "hotel": {
      const [rows] = await db().query<CandidateRow[]>(`
        SELECT
          v.*,
          t.nama_hotel AS title,
          v.jenis_hotel AS category,
          t.deskripsi_singkat AS summary,
          t.foto_utama AS image,
          t.alamat AS address,
          t.unggulan AS unggulan,
          t.harga_mulai AS price_from,
          t.harga_sampai AS price_to,
          t.harga_mulai AS source_price_from,
          t.harga_sampai AS source_price_to
        FROM vw_spk_hotel v
        INNER JOIN hotel t ON t.id = v.id
        INNER JOIN master_jenis_hotel mjh ON mjh.id = t.jenis_hotel_id
        WHERE t.dipublikasikan = 1
          AND t.aktif = 1
          AND mjh.aktif = 1
          AND t.tanggal_publikasi IS NOT NULL
          AND t.tanggal_publikasi <= NOW()
        ORDER BY t.unggulan DESC, t.urutan_tampil ASC, t.id DESC
        LIMIT 500
      `);
      return rows;
    }
    case "satwa-endemik": {
      const [rows] = await db().query<CandidateRow[]>(`
        SELECT
          v.*,
          t.nama_umum AS title,
          t.status_endemisitas AS category,
          t.deskripsi_singkat AS summary,
          t.foto_utama AS image,
          t.wilayah_endemik AS address,
          t.unggulan AS unggulan,
          NULL AS price_from,
          NULL AS price_to
        FROM vw_spk_satwa_endemik v
        INNER JOIN satwa_endemik t ON t.id = v.id
        WHERE t.dipublikasikan = 1
          AND t.aktif = 1
          AND t.tanggal_publikasi IS NOT NULL
          AND t.tanggal_publikasi <= NOW()
        ORDER BY t.unggulan DESC, t.urutan_tampil ASC, t.id DESC
        LIMIT 500
      `);
      return rows;
    }
  }
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
      values,
      raw: row,
    };
  });
}

function keywordMatches(candidate: Candidate, keyword: string) {
  const needle = keyword.trim().toLocaleLowerCase("id-ID");
  if (!needle) return true;
  return [candidate.title, candidate.category, candidate.summary, candidate.address]
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
  }));

  return {
    items,
    totalCandidates: allCandidates.length,
    totalMatched: filteredCandidates.length,
    criteria,
    usedLocation: hasUserLocation(input),
  };
}
