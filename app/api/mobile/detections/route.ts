import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { createNumeric, getAll, getById, type DbRecord } from "@/lib/realtime-db";
import { deleteDetectionReportWithImage } from "@/lib/staff-record-cleanup";
import {
  deleteImageFromR2,
  uploadImageToR2,
} from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOCATION_SOURCES = {
  "tempat-wisata": { table: "tempat_wisata", title: "nama_tempat" },
  kuliner: { table: "kuliner", title: "nama_usaha" },
  hotel: { table: "hotel", title: "nama_hotel" },
  "satwa-endemik": { table: "satwa_endemik", title: "nama_umum" },
} as const;

type LocationKind = keyof typeof LOCATION_SOURCES;
type DetectionInput = {
  label: string;
  confidence: number;
  class_index: number | null;
  x: number | null;
  y: number | null;
  w: number | null;
  h: number | null;
};

function text(form: FormData, key: string, max = 1000) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function numberValue(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function optionalNumber(value: unknown) {
  const n = numberValue(value);
  return n === null ? null : n;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function validLocationKind(value: string): value is LocationKind {
  return Object.prototype.hasOwnProperty.call(LOCATION_SOURCES, value);
}

function parseDetections(raw: string): DetectionInput[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Format hasil deteksi tidak valid.");
  }
  if (!Array.isArray(parsed)) throw new Error("Format hasil deteksi tidak valid.");
  if (parsed.length > 250) throw new Error("Jumlah objek deteksi melebihi batas laporan.");

  return parsed.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const item = value as Record<string, unknown>;
    const label = String(item.label ?? "").trim().slice(0, 120);
    if (!label) return [];
    const confidence = clamp(numberValue(item.confidence) ?? 0, 0, 1);
    const classIndex = optionalNumber(item.class_index);
    return [{
      label,
      confidence,
      class_index: classIndex === null ? null : Math.trunc(classIndex),
      x: optionalNumber(item.x),
      y: optionalNumber(item.y),
      w: optionalNumber(item.w),
      h: optionalNumber(item.h),
    }];
  });
}

function groupDetections(detections: DetectionInput[]) {
  const grouped = new Map<string, { label: string; count: number; max_confidence: number; confidence_sum: number }>();
  for (const detection of detections) {
    const current = grouped.get(detection.label) ?? {
      label: detection.label,
      count: 0,
      max_confidence: 0,
      confidence_sum: 0,
    };
    current.count += 1;
    current.max_confidence = Math.max(current.max_confidence, detection.confidence);
    current.confidence_sum += detection.confidence;
    grouped.set(detection.label, current);
  }
  return [...grouped.values()]
    .map((item) => ({
      label: item.label,
      count: item.count,
      max_confidence: item.max_confidence,
      avg_confidence: item.count ? item.confidence_sum / item.count : 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function parseJsonColumn(value: unknown) {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
}

async function canonicalLocation(kind: LocationKind, id: number) {
  const source = LOCATION_SOURCES[kind];
  if (!source) return null;
  const row = await getById<DbRecord>(source.table, id);
  if (!row) return null;
  return { id, title: String(row[source.title] ?? "") };
}

async function requireDetectionAccess(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return null;
  const allowedRoles = ["pengaju", "pengguna", "petugas", "admin"];
  return allowedRoles.includes(user.role) ? user : null;
}

export async function POST(request: NextRequest) {
  let uploadedKey: string | null = null;
  try {
    const form = await request.formData();
    const namaPelapor = text(form, "nama_pelapor", 150);
    const lokasiJenis = text(form, "lokasi_jenis", 40);
    const lokasiId = Number(text(form, "lokasi_id", 40));
    const catatan = text(form, "catatan", 4000);
    const latitude = numberValue(text(form, "latitude", 40));
    const longitude = numberValue(text(form, "longitude", 40));
    const image = form.get("image");

    if (!namaPelapor) return NextResponse.json({ message: "Nama pelapor wajib diisi." }, { status: 400 });
    if (!validLocationKind(lokasiJenis) || !Number.isSafeInteger(lokasiId) || lokasiId <= 0) {
      return NextResponse.json({ message: "Lokasi laporan tidak valid." }, { status: 400 });
    }
    if (latitude === null || latitude < -90 || latitude > 90 || longitude === null || longitude < -180 || longitude > 180) {
      return NextResponse.json({ message: "Koordinat GPS laporan tidak valid." }, { status: 400 });
    }
    if (!(image instanceof File) || !image.size) {
      return NextResponse.json({ message: "Foto hasil deteksi wajib diunggah." }, { status: 400 });
    }

    const location = await canonicalLocation(lokasiJenis, lokasiId);
    if (!location) return NextResponse.json({ message: "Lokasi tidak ditemukan pada database SI PARIK BANGKA." }, { status: 400 });

    const detections = parseDetections(text(form, "detections", 250_000));
    const detectionTypes = groupDetections(detections);
    const primaryFromObjects = detections.reduce<DetectionInput | null>(
      (best, item) => !best || item.confidence > best.confidence ? item : best,
      null,
    );
    const submittedPrimary = text(form, "deteksi_utama", 120);
    const submittedConfidence = numberValue(text(form, "confidence", 40));
    const deteksiUtama = submittedPrimary || primaryFromObjects?.label || null;
    const confidence = clamp(submittedConfidence ?? primaryFromObjects?.confidence ?? 0, 0, 1);

    const uploaded = await uploadImageToR2(image, "deteksi");
    uploadedKey = uploaded.key;

    const requestUser = await getRequestUser(request);
    const now = new Date().toISOString();

    const insertedId = await createNumeric("laporan_deteksi", {
      nama_pelapor: namaPelapor,
      lokasi_id: String(lokasiId),
      lokasi_jenis: lokasiJenis,
      lokasi_nama: String(location.title || text(form, "lokasi_nama", 255) || "Lokasi SI PARIK"),
      latitude,
      longitude,
      catatan: catatan || null,
      image_url: uploaded.storageUrl,
      image_key: uploaded.key,
      image_kind: "hasil_deteksi",
      deteksi_utama: deteksiUtama,
      confidence,
      jumlah_objek: detections.length,
      deteksi_jenis: detectionTypes,
      detections: detections,
      status: "baru",
      source: "flutter-rtdb-r2",
      reporter_user_id: requestUser?.id ?? null,
      created_at: now,
      updated_at: now,
    });

    uploadedKey = null;
    return NextResponse.json({
      message: "Laporan deteksi berhasil dikirim.",
      data: {
        id: insertedId,
        jumlah_objek: detections.length,
        jumlah_jenis: detectionTypes.length,
        image_url: uploaded.storageUrl,
      },
    }, { status: 201 });
  } catch (error) {
    if (uploadedKey) {
      try { await deleteImageFromR2(uploadedKey); } catch (cleanupError) {
        console.error("Detection R2 rollback cleanup error:", cleanupError);
      }
    }
    console.error("Mobile detection create error:", error);
    const message = error instanceof Error ? error.message : "Laporan deteksi belum dapat diproses.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  if (!(await requireDetectionAccess(request))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 1000);
  const limit = Number.isFinite(rawLimit) ? Math.min(5000, Math.max(1, Math.floor(rawLimit))) : 1000;

  try {
    const allReports = await getAll<DbRecord>("laporan_deteksi");
    const sorted = allReports.sort((a, b) =>
      new Date(String(b.created_at || "")).getTime() - new Date(String(a.created_at || "")).getTime()
    );

    const rows = sorted.slice(0, limit);
    const items = rows.map((row) => ({
      ...row,
      deteksi_jenis: parseJsonColumn(row.deteksi_jenis),
      detections: parseJsonColumn(row.detections),
    }));

    return NextResponse.json({ data: { items, total: sorted.length } });
  } catch (error) {
    console.error("Mobile detection list error:", error);
    const message = error instanceof Error ? error.message : "Gagal memuat laporan deteksi.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireDetectionAccess(request))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = Number(body?.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ message: "Laporan deteksi yang akan dihapus tidak valid." }, { status: 400 });
    }

    const result = await deleteDetectionReportWithImage(id);

    return NextResponse.json({
      message: "Laporan deteksi dan foto R2 berhasil dihapus permanen.",
      data: { id, imageDeleted: result.deletedFiles > 0 },
    });
  } catch (error) {
    console.error("Mobile detection delete error:", error);
    const message = error instanceof Error ? error.message : "Laporan deteksi gagal dihapus.";
    return NextResponse.json({ message }, { status: message.includes("tidak ditemukan") ? 404 : 500 });
  }
}
