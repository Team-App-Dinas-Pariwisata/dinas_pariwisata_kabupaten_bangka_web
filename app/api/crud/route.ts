import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import {
  deleteFacilityRelations,
  isFacilityOwnerTable,
  syncFacilityRelations,
  validateFacilityIds,
} from "@/lib/facilities";
import { createNumeric, deleteById, dbNow, updateById } from "@/lib/realtime-db";
import { loadResourceRows } from "@/lib/resource-data";
import { resourceConfigs, type ResourceConfig } from "@/lib/resources";
import { browserSafeR2ImageUrl } from "@/lib/r2";

function configFor(resource: unknown): ResourceConfig | null {
  return resourceConfigs[String(resource ?? "")] ?? null;
}

const PETUGAS_DELETABLE_RESOURCES = new Set([
  "berita",
  "acara",
  "tempat-wisata",
  "hotel",
  "satwa-endemik",
  "kuliner",
]);

function petugasCanDelete(resource: unknown) {
  return PETUGAS_DELETABLE_RESOURCES.has(String(resource ?? ""));
}

function slugify(value: string) {
  const slug = value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
  return slug || "item";
}

function toDatabaseDate(value: unknown) {
  if (!value) return null;
  const text = String(value);
  if (text.includes("T")) return text.replace("T", " ") + (text.length <= 16 ? ":00" : "");
  return text;
}

type DatabaseValue = string | number | boolean | null;

function normalizeData(config: ResourceConfig, raw: Record<string, unknown>): Record<string, DatabaseValue> {
  const out: Record<string, DatabaseValue> = {};
  for (const key of config.writable) {
    if (!(key in raw)) continue;
    const field = config.fields.find((item) => item.key === key);
    let value = raw[key];
    if (field?.type === "checkbox") value = value ? 1 : 0;
    else if (field?.type === "number") {
      if (value === "" || value === null || value === undefined) value = null;
      else {
        const numberValue = Number(value);
        if (!Number.isFinite(numberValue)) throw new Error(`Nilai ${field.label} harus berupa angka yang valid.`);
        value = numberValue;
      }
    }
    else if (field?.type === "datetime-local") value = toDatabaseDate(value);
    else if (typeof value === "string") value = value.trim() || null;
    else if (value === undefined) value = null;
    else if (value !== null && typeof value !== "number" && typeof value !== "boolean") {
      throw new Error(`Nilai ${field?.label ?? key} tidak valid.`);
    }
    out[key] = value as DatabaseValue;
  }
  return out;
}

function validateRequired(config: ResourceConfig, data: Record<string, DatabaseValue>) {
  return config.required.find((key) => data[key] === null || data[key] === undefined || data[key] === "");
}

function errorMessage(error: unknown) {
  if (error instanceof Error && (error.message.startsWith("Nilai ") || error.message.startsWith("Fasilitas "))) return error.message;
  return "Permintaan belum dapat diproses.";
}

async function selectedFacilityIds(config: ResourceConfig, raw: Record<string, unknown>) {
  if (!isFacilityOwnerTable(config.table)) return null;
  if (!Object.prototype.hasOwnProperty.call(raw, "fasilitas_ids")) return null;
  return validateFacilityIds(config.table, raw.fasilitas_ids);
}

async function userOnly(request: NextRequest) {
  return requireRequestRole(request, "pengguna");
}

export async function GET(request: NextRequest) {
  if (!(await userOnly(request))) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  const config = configFor(request.nextUrl.searchParams.get("resource"));
  if (!config) return NextResponse.json({ message: "Resource tidak tersedia." }, { status: 404 });

  const rows = await loadResourceRows(config);
  const data = rows.map((row) => {
    if ("foto_utama" in row) return { ...row, foto_utama: browserSafeR2ImageUrl(row.foto_utama as string | null) };
    return row;
  });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const user = await userOnly(request);
  if (!user) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const body = await request.json();
    const config = configFor(body.resource);
    if (!config) return NextResponse.json({ message: "Resource tidak tersedia." }, { status: 404 });
    const raw = (body.data ?? {}) as Record<string, unknown>;
    const facilityIds = await selectedFacilityIds(config, raw);
    const data = normalizeData(config, raw);
    const missing = validateRequired(config, data);
    if (missing) return NextResponse.json({ message: `Field ${missing} wajib diisi.` }, { status: 400 });

    const slugSource =
      config.table === "berita" ? data.judul :
      config.table === "acara" ? data.nama_acara :
      config.table === "tempat_wisata" ? data.nama_tempat :
      config.table === "hotel" ? data.nama_hotel :
      config.table === "kuliner" ? data.nama_usaha :
      config.table === "satwa_endemik" ? data.nama_umum : null;
    if (slugSource) data.slug = `${slugify(String(slugSource))}-${Date.now().toString().slice(-7)}`;
    if ("dipublikasikan" in data && Number(data.dipublikasikan) === 1 && !data.tanggal_publikasi) data.tanggal_publikasi = dbNow();
    data.created_by = user.id;
    data.updated_by = user.id;

    const id = await createNumeric(config.table, data);
    if (facilityIds !== null && isFacilityOwnerTable(config.table)) {
      try {
        await syncFacilityRelations(config.table, id, facilityIds);
      } catch (error) {
        await deleteById(config.table, id).catch(() => false);
        throw error;
      }
    }
    return NextResponse.json({ message: `${config.label} berhasil ditambahkan.`, id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await userOnly(request);
  if (!user) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const body = await request.json();
    const config = configFor(body.resource);
    const id = Number(body.id);
    if (!config || !id) return NextResponse.json({ message: "Resource atau ID tidak valid." }, { status: 400 });
    const raw = (body.data ?? {}) as Record<string, unknown>;
    const facilityIds = await selectedFacilityIds(config, raw);
    const data = normalizeData(config, raw);
    const missing = validateRequired(config, data);
    if (missing) return NextResponse.json({ message: `Field ${missing} wajib diisi.` }, { status: 400 });
    if (Number(data.dipublikasikan) === 1 && !data.tanggal_publikasi) data.tanggal_publikasi = dbNow();
    data.updated_by = user.id;
    if (!Object.keys(data).length && facilityIds === null) return NextResponse.json({ message: "Tidak ada data yang diubah." }, { status: 400 });

    const updated = Object.keys(data).length ? await updateById(config.table, id, data) : true;
    if (!updated) return NextResponse.json({ message: "Data tidak ditemukan." }, { status: 404 });
    if (facilityIds !== null && isFacilityOwnerTable(config.table)) {
      await syncFacilityRelations(config.table, id, facilityIds);
    }
    return NextResponse.json({ message: `${config.label} berhasil diperbarui.` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const petugas = await userOnly(request);
  if (!petugas) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const body = await request.json();
    const config = configFor(body.resource);
    const id = Number(body.id);
    if (!config || !id) return NextResponse.json({ message: "Resource atau ID tidak valid." }, { status: 400 });
    if (!petugasCanDelete(body.resource)) {
      return NextResponse.json({ message: "Akun petugas tidak memiliki izin hapus untuk resource ini." }, { status: 403 });
    }
    const removed = await deleteById(config.table, id);
    if (!removed) return NextResponse.json({ message: "Data tidak ditemukan." }, { status: 404 });
    if (isFacilityOwnerTable(config.table)) {
      try {
        await deleteFacilityRelations(config.table, id);
      } catch (cleanupError) {
        console.error("Facility relation cleanup error:", cleanupError);
      }
    }
    return NextResponse.json({ message: `${config.label} berhasil dihapus.` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 409 });
  }
}
