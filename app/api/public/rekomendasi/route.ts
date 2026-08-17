import { NextRequest, NextResponse } from "next/server";
import {
  findSawRecommendations,
  getSawCriteria,
  type RecommendationKind,
  type RecommendationSearchInput,
} from "@/lib/spk-saw";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedKinds = new Set<RecommendationKind>(["tempat-wisata", "kuliner", "hotel", "satwa-endemik"]);

function isKind(value: unknown): value is RecommendationKind {
  return typeof value === "string" && allowedKinds.has(value as RecommendationKind);
}

function finiteOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function sanitizePriorities(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!/^[A-Za-z0-9_-]{1,50}$/.test(key)) continue;
    const number = Number(raw);
    if (Number.isFinite(number)) output[key] = clamp(number, 1, 5);
  }
  return output;
}

function sanitizeRequirements(value: unknown): RecommendationSearchInput["requirements"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const data = value as Record<string, unknown>;
  const halalMode = ["semua", "halal", "bersertifikat"].includes(String(data.halalMode))
    ? String(data.halalMode) as "semua" | "halal" | "bersertifikat"
    : "semua";
  return {
    parking: Boolean(data.parking),
    prayerRoom: Boolean(data.prayerRoom),
    childFriendly: Boolean(data.childFriendly),
    familyFriendly: Boolean(data.familyFriendly),
    seniorFriendly: Boolean(data.seniorFriendly),
    halalMode,
    deliveryOnly: Boolean(data.deliveryOnly),
    minStars: clamp(Number(data.minStars ?? 0), 0, 5),
    observationOnly: Boolean(data.observationOnly),
    educationalLocationOnly: Boolean(data.educationalLocationOnly),
  };
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");
  if (!isKind(category)) {
    return NextResponse.json({ message: "Kategori pencarian tidak valid." }, { status: 400 });
  }

  try {
    const criteria = await getSawCriteria(category);
    return NextResponse.json(
      { data: { criteria } },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Load recommendation criteria error:", error);
    return NextResponse.json({ message: "Kriteria rekomendasi belum dapat dimuat." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (!isKind(body.category)) {
      return NextResponse.json({ message: "Pilih kategori wisata yang valid." }, { status: 400 });
    }

    const latitude = finiteOrNull(body.latitude);
    const longitude = finiteOrNull(body.longitude);
    if ((latitude === null) !== (longitude === null)) {
      return NextResponse.json({ message: "Latitude dan longitude harus diisi bersama." }, { status: 400 });
    }
    if (latitude !== null && (latitude < -90 || latitude > 90)) {
      return NextResponse.json({ message: "Latitude tidak valid." }, { status: 400 });
    }
    if (longitude !== null && (longitude < -180 || longitude > 180)) {
      return NextResponse.json({ message: "Longitude tidak valid." }, { status: 400 });
    }

    const keyword = String(body.keyword ?? "").trim().slice(0, 120);
    const maxDistanceKmRaw = finiteOrNull(body.maxDistanceKm);
    const maxBudgetRaw = finiteOrNull(body.maxBudget);
    const input: RecommendationSearchInput = {
      category: body.category,
      keyword,
      latitude,
      longitude,
      maxDistanceKm: maxDistanceKmRaw === null ? null : clamp(maxDistanceKmRaw, 0, 500),
      maxBudget: maxBudgetRaw === null ? null : clamp(maxBudgetRaw, 0, 100_000_000),
      priorities: sanitizePriorities(body.priorities),
      requirements: sanitizeRequirements(body.requirements),
      limit: clamp(Number(body.limit ?? 12), 1, 24),
    };

    const result = await findSawRecommendations(input);
    return NextResponse.json(
      {
        data: result,
        method: {
          name: "Penilaian rekomendasi",
          benefitNormalization: "penyesuaian nilai sesuai kebutuhan",
          costNormalization: "penyesuaian batas biaya dan jarak",
          preferenceWeighting: "prioritas pengguna digunakan untuk menyusun urutan rekomendasi",
        },
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Public recommendation error:", error);
    return NextResponse.json(
      { message: "Rekomendasi belum dapat disiapkan. Silakan coba beberapa saat lagi." },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
