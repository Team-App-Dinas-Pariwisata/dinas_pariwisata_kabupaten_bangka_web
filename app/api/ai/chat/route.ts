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
  HARGA_TIKET: "HARGA_TIKET",
  JARAK: "JARAK",
  FASILITAS: "FASILITAS",
  KLASIFIKASI: "KLASIFIKASI",
  AKSESIBILITAS: "AKSESIBILITAS",
  STATUS_HALAL: "STATUS_HALAL",
  LAYANAN: "LAYANAN",
  KESESUAIAN_PENGUNJUNG: "KESESUAIAN_PENGUNJUNG",
  KEMUDAHAN_PENGAMATAN: "KEMUDAHAN_PENGAMATAN",
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

function budgetFromIndonesianText(message: string) {
  const text = message.toLowerCase();

  const rupiah = text.match(/\brp\s*(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?/i);
  if (rupiah) {
    const integer = rupiah[1].replace(/\./g, "");
    const amount = Number(rupiah[2] ? `${integer}.${rupiah[2]}` : integer);
    if (Number.isFinite(amount)) return amount;
  }

  const compact = text.match(/(\d+(?:[.,]\d+)?)\s*(ribu|rb|k|juta|jt)\b/i);
  if (compact) {
    const amount = Number(compact[1].replace(",", "."));
    if (!Number.isFinite(amount)) return null;
    const multiplier = /^(juta|jt)$/i.test(compact[2]) ? 1_000_000 : 1_000;
    return amount * multiplier;
  }

  const contextual = text.match(/(?:harga|tiket|budget|biaya)[^0-9]{0,40}(\d{1,3}(?:\.\d{3})+)/i);
  if (contextual) {
    const amount = Number(contextual[1].replace(/\./g, ""));
    return Number.isFinite(amount) ? amount : null;
  }

  return null;
}

function normalizeSearchRedirectPayload(payload: Record<string, unknown>, originalMessage: string) {
  if (payload.type !== "search_redirect" || typeof payload.redirect_url !== "string") return payload;
  const inferredBudget = budgetFromIndonesianText(originalMessage);
  if (inferredBudget === null) return payload;

  try {
    const url = new URL(payload.redirect_url, "http://local.invalid");
    if (!url.pathname.includes("/pencarian") || !url.searchParams.has("maxBudget")) return payload;
    url.searchParams.set("maxBudget", String(inferredBudget));
    return {
      ...payload,
      redirect_url: `${url.pathname}?${url.searchParams.toString()}`,
    };
  } catch {
    return payload;
  }
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
  // "Wisata Keluarga" diperlakukan sebagai preferensi cocok_keluarga, bukan
  // keyword keras, karena destinasi keluarga dapat berkategori Bahari/Alam/Buatan.
  const inferredCategory = (categories[0] || "").trim();
  const familyCategoryIntent = /^(wisata\s+keluarga|keluarga|ramah\s+keluarga)$/i.test(inferredCategory);
  const keyword = (searchTerms[0] || (familyCategoryIntent ? "" : inferredCategory)).trim();
  if (keyword) query.set("keyword", keyword.slice(0, 120));

  const setNumber = (key: string, value: unknown) => {
    const number = finiteOrNull(value);
    if (number !== null) query.set(key, String(number));
  };
  setNumber("latitude", origin.latitude);
  setNumber("longitude", origin.longitude);
  setNumber("maxDistanceKm", filters.max_distance_km);
  const inferredBudget = filters.max_price !== undefined && filters.max_price !== null
    ? budgetFromIndonesianText(String(criteria.original_message || originalMessage))
    : null;
  setNumber("maxBudget", inferredBudget ?? filters.max_price);

  if (truthy(filters.requires_parking)) query.set("parking", "1");
  if (truthy(filters.requires_prayer_room)) query.set("prayerRoom", "1");
  if (truthy(filters.suitable_for_children)) query.set("childFriendly", "1");
  if (truthy(filters.suitable_for_family) || familyCategoryIntent) query.set("familyFriendly", "1");
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
    response: `Kriteria ${category.replace(/-/g, " ")} sudah saya pahami. Saya arahkan ke halaman pencarian untuk menampilkan rekomendasi yang paling sesuai.`,
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
              message: "Layanan AI belum dapat memproses pertanyaan saat ini.",
              hint: "Silakan coba lagi beberapa saat lagi.",
            },
            { status: 502 },
          );
        }

        const criteria = asRecord(fallbackPayload.criteria) as Criteria;
        const payload = buildFallbackWebIntent(criteria, message);
        return NextResponse.json(normalizeSearchRedirectPayload(payload, message), { headers: { "Cache-Control": "no-store, max-age=0" } });
      }

      const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
      if (!response.ok) {
        return NextResponse.json(
          {
            message: "Layanan AI belum dapat memproses pertanyaan saat ini.",
          },
          { status: 502 },
        );
      }
      return NextResponse.json(normalizeSearchRedirectPayload(payload, message), { headers: { "Cache-Control": "no-store, max-age=0" } });
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    console.error("AI chat service error:", error);
    return NextResponse.json(
      {
        message: "Layanan AI sedang tidak tersedia. Silakan coba lagi beberapa saat lagi.",
      },
      { status: 503 },
    );
  }
}
