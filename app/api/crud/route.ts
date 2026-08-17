import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { resourceConfigs, type ResourceConfig } from "@/lib/resources";
import { browserSafeR2ImageUrl } from "@/lib/r2";

function configFor(resource: unknown): ResourceConfig | null {
  return resourceConfigs[String(resource ?? "")] ?? null;
}

function slugify(value: string) {
  const slug = value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
  return slug || "item";
}

function toMysqlDate(value: unknown) {
  if (!value) return null;
  const text = String(value);
  if (text.includes("T")) return text.replace("T", " ") + (text.length <= 16 ? ":00" : "");
  return text;
}

function nowMysql() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
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
    else if (field?.type === "datetime-local") value = toMysqlDate(value);
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
  const code = (error as { code?: string })?.code;
  if (code === "ER_DUP_ENTRY") return "Data duplikat terdeteksi. Periksa judul atau data unik lainnya.";
  if (code === "ER_NO_REFERENCED_ROW_2") return "Data referensi tidak ditemukan. Periksa kategori yang dipilih.";
  if (code === "ER_ROW_IS_REFERENCED_2") return "Data masih digunakan oleh data lain dan tidak dapat dihapus.";
  if (code === "ER_CHECK_CONSTRAINT_VIOLATED") return "Data tidak memenuhi aturan yang berlaku.";
  if (error instanceof Error && error.message.startsWith("Nilai ")) return error.message;
  return "Permintaan belum dapat diproses.";
}

async function userOnly(request: NextRequest) {
  return requireRequestRole(request, "pengguna");
}

export async function GET(request: NextRequest) {
  if (!(await userOnly(request))) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  const config = configFor(request.nextUrl.searchParams.get("resource"));
  if (!config) return NextResponse.json({ message: "Resource tidak tersedia." }, { status: 404 });

  const [rows] = await db().execute<RowDataPacket[]>(
    `SELECT ${config.select.join(", ")} FROM ${config.table} ORDER BY ${config.orderBy}`,
  );
  const data = rows.map((row) => {
    if ("foto_utama" in row) {
      return { ...row, foto_utama: browserSafeR2ImageUrl(row.foto_utama as string | null) };
    }
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
    const data = normalizeData(config, body.data ?? {});
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
    if ("dipublikasikan" in data && Number(data.dipublikasikan) === 1 && !data.tanggal_publikasi) {
      data.tanggal_publikasi = nowMysql();
    }
    data.created_by = user.id;
    data.updated_by = user.id;

    const keys = Object.keys(data);
    const placeholders = keys.map(() => "?").join(", ");
    const [result] = await db().execute<ResultSetHeader>(
      `INSERT INTO ${config.table} (${keys.join(", ")}) VALUES (${placeholders})`,
      keys.map((key) => data[key]),
    );
    return NextResponse.json({ message: `${config.label} berhasil ditambahkan.`, id: result.insertId }, { status: 201 });
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
    const data = normalizeData(config, body.data ?? {});
    const missing = validateRequired(config, data);
    if (missing) return NextResponse.json({ message: `Field ${missing} wajib diisi.` }, { status: 400 });
    if (Number(data.dipublikasikan) === 1 && !data.tanggal_publikasi) data.tanggal_publikasi = nowMysql();
    data.updated_by = user.id;
    const keys = Object.keys(data);
    if (!keys.length) return NextResponse.json({ message: "Tidak ada data yang diubah." }, { status: 400 });
    await db().execute(
      `UPDATE ${config.table} SET ${keys.map((key) => `${key} = ?`).join(", ")} WHERE id = ?`,
      [...keys.map((key) => data[key]), id],
    );
    return NextResponse.json({ message: `${config.label} berhasil diperbarui.` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: errorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await userOnly(request))) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const body = await request.json();
    const config = configFor(body.resource);
    const id = Number(body.id);
    if (!config || !id) return NextResponse.json({ message: "Resource atau ID tidak valid." }, { status: 400 });
    const [result] = await db().execute<ResultSetHeader>(`DELETE FROM ${config.table} WHERE id = ?`, [id]);
    if (!result.affectedRows) return NextResponse.json({ message: "Data tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ message: `${config.label} berhasil dihapus.` });
  } catch (error) {
    return NextResponse.json({ message: errorMessage(error) }, { status: 409 });
  }
}
