import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * NLP_API_URL harus berupa base URL service Python, contoh:
 *   http://127.0.0.1:8000
 *
 * Untuk menghindari 404 ketika pengguna tanpa sengaja mengisi
 * http://127.0.0.1:8000/web-intent atau /kriteria, suffix endpoint dibuang.
 */
const NLP_API_URL = (process.env.NLP_API_URL || "http://127.0.0.1:8000")
  .replace(/\/$/, "")
  .replace(/\/(?:web-intent|kriteria|chat|rekomendasi)$/i, "");

const CATEGORY_MAP: Record<string, string> = {
  hotel: "hotel",
  kuliner: "kuliner",
  tempat_wisata: "tempat-wisata",
  satwa_endemik: "satwa-endemik",
};

const PRIORITY_MAP: Record<string, string> = {
  HARGA: "HARGA",
  HARGA_TIKET: "HARGA",
  JARAK: "JARAK",
  FASILITAS: "FASILITAS",
  KLASIFIKASI: "BINTANG",
  AKSESIBILITAS: "AKSES",
  STATUS_HALAL: "HALAL",
  LAYANAN: "LAYANAN",
  KESESUAIAN_PENGUNJUNG: "KESESUAIAN",
  KEMUDAHAN_PENGAMATAN: "KEMUDAHAN",
  LOKASI_EDUKASI: "LOKASI_EDUKASI",
  LOKASI_PENGAMATAN: "LOKASI_PENGAMATAN",
};

type Criteria = {
  jenis_objek?: string | null;
  aksi?: string;
  filters?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  priority_codes?: string[];
  original_message?: string;
  needs_clarification?: boolean;
  clarification_question?: string | null;
};

function finiteOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function truthy(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function buildFallbackWebIntent(criteria: Criteria, originalMessage: string) {
  const action = String(criteria.aksi || "");
  if (action === "salam") {
    return {
      type: "message",
      response: "Halo! Coba tulis kebutuhan Anda, misalnya: cari wisata bahari di Bangka dengan tiket maksimal Rp15.000 dan utamakan akses mudah.",
    };
  }
  if (action === "terima_kasih") {
    return { type: "message", response: "Sama-sama. Saya siap membantu pencarian berikutnya." };
  }

  const objectType = String(criteria.jenis_objek || "");
  const category = CATEGORY_MAP[objectType];
  if (!category) {
    return {
      type: "clarification",
      response: criteria.clarification_question || "Anda ingin rekomendasi hotel, kuliner, tempat wisata, atau satwa endemik?",
      criteria,
    };
  }

  const filters = asRecord(criteria.filters);
  const preferences = asRecord(criteria.preferences);
  const origin = asRecord(preferences.origin);
  const services = new Set(asStringArray(preferences.services).map((item) => item.toLowerCase()));
  const searchTerms = asStringArray(preferences.search_terms).map((item) => item.trim()).filter(Boolean);
  const categories = asStringArray(preferences.categories).map((item) => item.trim()).filter(Boolean);

  const hasDistanceRequirement = filters.max_distance_km !== undefined && filters.max_distance_km !== null;
  const hasOrigin = finiteOrNull(origin.latitude) !== null && finiteOrNull(origin.longitude) !== null;
  if (criteria.needs_clarification && hasDistanceRequirement && !hasOrigin) {
    return {
      type: "clarification",
      response: criteria.clarification_question || "Aktifkan lokasi agar jarak dapat dihitung.",
      needs_location: true,
      criteria,
    };
  }

  const query = new URLSearchParams();
  query.set("source", "ai");
  query.set("auto", "1");
  query.set("category", category);

  // Gunakan satu search term spesifik atau satu nama kategori master saja.
  // Menggabungkan beberapa kategori menjadi satu keyword dapat membuat semua alternatif gagal match.
  const keyword = (searchTerms[0] || categories[0] || "").trim();
  if (keyword) query.set("keyword", keyword.slice(0, 120));

  const setNumber = (key: string, value: unknown) => {
    const number = finiteOrNull(value);
    if (number !== null) query.set(key, String(number));
  };
  setNumber("latitude", origin.latitude);
  setNumber("longitude", origin.longitude);
  setNumber("maxDistanceKm", filters.max_distance_km);
  setNumber("maxBudget", filters.max_price);

  if (truthy(filters.requires_parking)) query.set("parking", "1");
  if (truthy(filters.requires_prayer_room)) query.set("prayerRoom", "1");
  if (truthy(filters.suitable_for_children)) query.set("childFriendly", "1");
  if (truthy(filters.suitable_for_family)) query.set("familyFriendly", "1");
  if (truthy(filters.elderly_friendly)) query.set("seniorFriendly", "1");
  if (truthy(filters.halal_required)) query.set("halalMode", "halal");
  if (services.has("delivery")) query.set("deliveryOnly", "1");
  if (truthy(filters.requires_observation_location)) query.set("observationOnly", "1");
  if (truthy(filters.requires_education_location)) query.set("educationalLocationOnly", "1");

  const minStars = Number(filters.min_stars || 0);
  if (Number.isFinite(minStars) && minStars > 0) query.set("minStars", String(Math.trunc(minStars)));

  const priorities = asStringArray(criteria.priority_codes)
    .map((code) => PRIORITY_MAP[code.toUpperCase()])
    .filter((code, index, array): code is string => Boolean(code) && array.indexOf(code) === index);
  if (priorities.length) {
    query.set("priorities", priorities.map((code) => `${code}:5`).join(","));
  }

  const sourceMessage = String(criteria.original_message || originalMessage).trim();
  if (sourceMessage) query.set("aiMessage", sourceMessage.slice(0, 500));

  return {
    type: "search_redirect",
    response: `Kriteria ${category.replace(/-/g, " ")} sudah saya pahami. Saya arahkan ke halaman pencarian untuk menghitung ranking SAW.`,
    criteria,
    redirect_url: `/pencarian?${query.toString()}`,
    compatibility_mode: "kriteria_fallback",
  };
}

async function postToPython(endpoint: string, body: Record<string, unknown>, signal: AbortSignal) {
  return fetch(`${NLP_API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const message = String(body.message ?? "").trim();
    if (!message) {
      return NextResponse.json({ message: "Pertanyaan tidak boleh kosong." }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ message: "Pertanyaan terlalu panjang." }, { status: 400 });
    }

    const pythonBody = {
      message,
      latitude: finiteOrNull(body.latitude),
      longitude: finiteOrNull(body.longitude),
      limit: 12,
      use_ai: Boolean(body.useAI),
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      // Endpoint utama pada backend Python v2.
      let response = await postToPython("/web-intent", pythonBody, controller.signal);

      // Kompatibilitas dengan chatbot_pariwisata_spk.py versi awal yang belum
      // memiliki /web-intent tetapi sudah memiliki /kriteria.
      if (response.status === 404) {
        const fallback = await postToPython("/kriteria", pythonBody, controller.signal);
        const fallbackPayload = await fallback.json().catch(() => ({})) as Record<string, unknown>;

        if (!fallback.ok) {
          return NextResponse.json(
            {
              message: String(fallbackPayload.detail || fallbackPayload.message || "Endpoint NLP Python tidak ditemukan."),
              hint: "Pastikan service Python yang aktif adalah chatbot_pariwisata_spk.py dari project ini.",
            },
            { status: 502 },
          );
        }

        const criteria = asRecord(fallbackPayload.criteria) as Criteria;
        const payload = buildFallbackWebIntent(criteria, message);
        return NextResponse.json(payload, { headers: { "Cache-Control": "no-store, max-age=0" } });
      }

      const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
      if (!response.ok) {
        const detail = String(payload.detail || payload.message || "");
        return NextResponse.json(
          {
            message: detail === "Not Found"
              ? "Endpoint NLP tidak ditemukan. Pastikan Python backend yang dijalankan adalah versi terbaru dari project."
              : detail || "Layanan NLP Python gagal memproses pertanyaan.",
          },
          { status: 502 },
        );
      }
      return NextResponse.json(payload, { headers: { "Cache-Control": "no-store, max-age=0" } });
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    console.error("NLP chatbot proxy error:", error);
    return NextResponse.json(
      {
        message: "Layanan NLP Python belum aktif atau tidak dapat dijangkau. Jalankan chatbot_pariwisata_spk.py pada port 8000 atau atur NLP_API_URL.",
      },
      { status: 503 },
    );
  }
}
