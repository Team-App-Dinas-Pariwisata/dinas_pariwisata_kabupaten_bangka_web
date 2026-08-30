import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  deleteImageFromR2,
  keyFromR2StorageReference,
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
type DetectionRow = RowDataPacket & {
  id: number;
  image_url: string | null;
  image_key: string | null;
  detections: unknown;
  deteksi_jenis: unknown;
};
type CountRow = RowDataPacket & { total: number };
type LocationRow = RowDataPacket & { id: number; title: string };

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

function databaseMessage(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "ER_NO_SUCH_TABLE") {
    return "Tabel laporan deteksi belum tersedia. Jalankan migration database/migrations/2026-08-30_laporan_deteksi.sql.";
  }
  if (code === "ER_DATA_TOO_LONG") return "Ada data laporan yang terlalu panjang untuk disimpan.";
  if (error instanceof Error && error.message) return error.message;
  return "Laporan deteksi belum dapat diproses.";
}

async function canonicalLocation(kind: LocationKind, id: number) {
  const source = LOCATION_SOURCES[kind];
  const [rows] = await db().query<LocationRow[]>(
    `SELECT id, ${source.title} AS title FROM ${source.table} WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

async function requireStaff(request: NextRequest) {
  const user = await getRequestUser(request);
  return user && ["pengguna", "admin"].includes(user.role) ? user : null;
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
    const [result] = await db().execute<ResultSetHeader>(
      `INSERT INTO laporan_deteksi
        (nama_pelapor, lokasi_id, lokasi_jenis, lokasi_nama, latitude, longitude, catatan,
         image_url, image_key, image_kind, deteksi_utama, confidence, jumlah_objek,
         deteksi_jenis, detections, status, source, reporter_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'hasil_deteksi', ?, ?, ?, ?, ?, 'baru', 'flutter-mysql-r2', ?)`,
      [
        namaPelapor,
        String(lokasiId),
        lokasiJenis,
        String(location.title || text(form, "lokasi_nama", 255) || "Lokasi SI PARIK"),
        latitude,
        longitude,
        catatan || null,
        uploaded.storageUrl,
        uploaded.key,
        deteksiUtama,
        confidence,
        detections.length,
        JSON.stringify(detectionTypes),
        JSON.stringify(detections),
        requestUser?.id ?? null,
      ],
    );

    uploadedKey = null;
    return NextResponse.json({
      message: "Laporan deteksi berhasil dikirim.",
      data: {
        id: result.insertId,
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
    return NextResponse.json({ message: databaseMessage(error) }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  if (!(await requireStaff(request))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 1000);
  const limit = Number.isFinite(rawLimit) ? Math.min(5000, Math.max(1, Math.floor(rawLimit))) : 1000;

  try {
    const [countResult, rowsResult] = await Promise.all([
      db().query<CountRow[]>("SELECT COUNT(*) AS total FROM laporan_deteksi"),
      db().query<DetectionRow[]>(
        `SELECT id, nama_pelapor, lokasi_id, lokasi_jenis, lokasi_nama, latitude, longitude,
                catatan, image_url, image_key, image_kind, deteksi_utama, confidence,
                jumlah_objek, deteksi_jenis, detections, status, source, reporter_user_id,
                created_at, updated_at
         FROM laporan_deteksi
         ORDER BY created_at DESC, id DESC
         LIMIT ?`,
        [limit],
      ),
    ]);
    const countRows = countResult[0];
    const rows = rowsResult[0];

    const items = rows.map((row) => ({
      ...row,
      deteksi_jenis: parseJsonColumn(row.deteksi_jenis),
      detections: parseJsonColumn(row.detections),
    }));
    return NextResponse.json({ data: { items, total: Number(countRows[0]?.total ?? 0) } });
  } catch (error) {
    console.error("Mobile detection list error:", error);
    return NextResponse.json({ message: databaseMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireStaff(request))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = Number(body?.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ message: "Laporan deteksi yang akan dihapus tidak valid." }, { status: 400 });
    }

    const connection = await db().getConnection();
    let key: string | null = null;
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute<DetectionRow[]>(
        "SELECT id, image_url, image_key, detections, deteksi_jenis FROM laporan_deteksi WHERE id = ? LIMIT 1 FOR UPDATE",
        [id],
      );
      const row = rows[0];
      if (!row) {
        await connection.rollback();
        return NextResponse.json({ message: "Laporan deteksi tidak ditemukan." }, { status: 404 });
      }
      key = row.image_key || keyFromR2StorageReference(row.image_url);
      await connection.execute("DELETE FROM laporan_deteksi WHERE id = ?", [id]);
      await connection.commit();
    } catch (error) {
      try { await connection.rollback(); } catch { /* ignore rollback failure */ }
      throw error;
    } finally {
      connection.release();
    }

    let cleanupFailed = false;
    if (key) {
      try { await deleteImageFromR2(key); } catch (error) {
        cleanupFailed = true;
        console.error(`Detection #${id} removed from MySQL but R2 cleanup failed:`, error);
      }
    }

    return NextResponse.json({
      message: cleanupFailed
        ? "Laporan berhasil dihapus dari MySQL. Foto R2 belum dapat dibersihkan dan sudah dicatat pada log server."
        : "Laporan deteksi dan foto R2 berhasil dihapus permanen.",
      data: { id, imageDeleted: Boolean(key) && !cleanupFailed },
    });
  } catch (error) {
    console.error("Mobile detection delete error:", error);
    return NextResponse.json({ message: databaseMessage(error) }, { status: 500 });
  }
}
