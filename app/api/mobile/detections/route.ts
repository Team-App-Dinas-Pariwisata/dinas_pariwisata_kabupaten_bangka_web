import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { browserSafeR2ImageUrl, uploadImageToR2 } from "@/lib/r2";
import { createNumeric, dbNow, getAll, toTime, type DbRecord } from "@/lib/realtime-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: FormDataEntryValue | null, max = 500) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized.slice(0, max) : "";
}

function numberValue(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function parseJson(value: string) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.slice(0, 50) : [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const image = form.get("image");
    const namaPelapor = text(form.get("nama_pelapor"), 120);
    const lokasiNama = text(form.get("lokasi_nama"), 220);
    const lokasiJenis = text(form.get("lokasi_jenis"), 50);
    const lokasiId = text(form.get("lokasi_id"), 80);
    const catatan = text(form.get("catatan"), 1500);
    const latitude = numberValue(form.get("latitude"));
    const longitude = numberValue(form.get("longitude"));
    const deteksiUtama = text(form.get("deteksi_utama"), 120);
    const confidence = numberValue(form.get("confidence"));
    const detections = parseJson(text(form.get("detections"), 12000));

    if (!namaPelapor) return NextResponse.json({ message: "Nama pelapor wajib diisi." }, { status: 400 });
    if (!(image instanceof File) || !image.size) {
      return NextResponse.json({ message: "Gambar deteksi wajib dipilih." }, { status: 400 });
    }
    if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ message: "Koordinat lokasi belum valid. Aktifkan GPS dan coba lagi." }, { status: 400 });
    }
    if (!lokasiNama || !lokasiJenis || !lokasiId) {
      return NextResponse.json({ message: "Pilih lokasi dari daftar lokasi SI PARIK BANGKA." }, { status: 400 });
    }

    const upload = await uploadImageToR2(image, "deteksi");
    const id = await createNumeric("laporan_deteksi", {
      nama_pelapor: namaPelapor,
      lokasi_id: lokasiId,
      lokasi_jenis: lokasiJenis,
      lokasi_nama: lokasiNama,
      latitude,
      longitude,
      catatan: catatan || null,
      image_url: upload.url,
      image_key: upload.key,
      deteksi_utama: deteksiUtama || null,
      confidence: confidence == null ? null : Math.max(0, Math.min(1, confidence)),
      detections,
      status: "baru",
      created_at: dbNow(),
      updated_at: dbNow(),
      source: "flutter",
    });

    return NextResponse.json({ message: "Laporan deteksi berhasil dikirim.", data: { id } }, { status: 201 });
  } catch (error) {
    console.error("Detection report POST error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Laporan deteksi gagal disimpan." },
      { status: 400 },
    );
  }
}

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !["admin", "pengguna"].includes(user.role)) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 500);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 1000) : 500;
  const rows = await getAll<DbRecord>("laporan_deteksi");
  const items = rows
    .sort((a, b) => toTime(b.created_at) - toTime(a.created_at) || Number(b.id ?? 0) - Number(a.id ?? 0))
    .slice(0, limit)
    .map((row) => ({
      ...row,
      image_url: browserSafeR2ImageUrl(row.image_url == null ? null : String(row.image_url)),
    }));

  return NextResponse.json({ data: { items, total: rows.length } }, { headers: { "Cache-Control": "no-store" } });
}
