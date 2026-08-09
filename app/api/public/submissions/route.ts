import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ResultSetHeader } from "mysql2/promise";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allSubmissionFields, submissionConfigs, type SubmissionField, type SubmissionType } from "@/lib/submission-config";
import { isImageFile, uploadImageToImgBB } from "@/lib/imgbb";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_MIME = new Set(["application/pdf"]);

function text(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function checked(form: FormData, key: string) {
  return ["1", "true", "on", "yes"].includes(text(form, key).toLowerCase());
}

function registration(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${new Date().getFullYear()}-${stamp.slice(-7)}${random}`.slice(0, 30);
}

function extensionFor(file: File) {
  if (file.type === "application/pdf") return ".pdf";
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/jpeg") return ".jpg";
  return path.extname(file.name).slice(0, 8).toLowerCase();
}

async function saveFile(file: File, type: SubmissionType, key: string) {
  if (!file.size) return null;
  if (file.size > MAX_FILE_BYTES) throw new Error(`Ukuran ${key} maksimal 5 MB.`);

  // Semua file gambar disimpan di ImgBB dan database menyimpan URL viewer ImgBB (data.url_viewer).
  if (isImageFile(file)) {
    const uploaded = await uploadImageToImgBB(file);
    return uploaded.viewerUrl;
  }

  // ImgBB adalah image-hosting API, jadi PDF tetap disimpan lokal sebagai dokumen pendukung.
  if (!ALLOWED_DOCUMENT_MIME.has(file.type)) {
    throw new Error(`Format ${key} harus berupa gambar atau PDF.`);
  }

  const month = new Date().toISOString().slice(0, 7);
  const directory = path.join(process.cwd(), "public", "uploads", "pengajuan", month);
  await mkdir(directory, { recursive: true });
  const filename = `${type}-${key}-${randomUUID()}${extensionFor(file)}`;
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/pengajuan/${month}/${filename}`;
}

function requiredMissing(form: FormData, field: SubmissionField) {
  if (!field.required) return false;
  if (field.type === "checkbox") return !checked(form, field.key);
  if (field.type === "file") {
    const file = form.get(field.key);
    return !(file instanceof File) || file.size === 0;
  }
  return !text(form, field.key);
}

function dbErrorMessage(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "ER_DUP_ENTRY") return "Nomor registrasi atau data unik sudah tercatat. Silakan kirim ulang.";
  if (code === "ER_NO_REFERENCED_ROW_2") return "Kecamatan, kelurahan, subsektor, atau komunitas yang dipilih tidak valid.";
  if (code === "ER_DATA_TOO_LONG") return "Ada data yang terlalu panjang untuk disimpan.";
  if (error instanceof Error && (error.message.includes("maksimal 5 MB") || error.message.includes("Format") || error.message.includes("ImgBB") || error.message.includes("IMGBB_API_KEY") || error.message.includes("Upload"))) return error.message;
  return "Pengajuan belum dapat disimpan. Periksa data dan koneksi database.";
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const type = text(form, "type") as SubmissionType;
    const config = submissionConfigs[type];
    if (!config) return NextResponse.json({ message: "Jenis pengajuan tidak valid." }, { status: 400 });

    const fields = allSubmissionFields(type);
    const missing = fields.find((field) => requiredMissing(form, field));
    if (missing) return NextResponse.json({ message: `${missing.label} wajib diisi.` }, { status: 400 });

    if (["ekraf", "sdm"].includes(type)) {
      const nik = text(form, "nik").replace(/\D/g, "");
      if (nik.length !== 16) return NextResponse.json({ message: "NIK wajib terdiri dari 16 digit." }, { status: 400 });
    }

    const data: Record<string, unknown> = { no_registrasi: registration(config.registrationPrefix) };

    for (const field of fields) {
      if (field.key === "konfirmasi_kebenaran") continue;
      if (field.type === "file") {
        const entry = form.get(field.key);
        if (entry instanceof File && entry.size > 0) data[field.key] = await saveFile(entry, type, field.key);
        continue;
      }
      if (field.type === "checkbox") {
        data[field.key] = checked(form, field.key) ? 1 : 0;
        continue;
      }
      const value = text(form, field.key);
      if (!value) {
        data[field.key] = null;
        continue;
      }
      if (["number", "year"].includes(field.type ?? "")) data[field.key] = Number(value);
      else data[field.key] = value;
    }

    if (type === "sdm" || type === "komunitas") data.status_pengajuan = "Menunggu";

    const keys = Object.keys(data);
    const [result] = await db().execute<ResultSetHeader>(
      `INSERT INTO ${config.table} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
      keys.map((key) => data[key]),
    );

    return NextResponse.json({
      message: "Pengajuan berhasil dikirim dan menunggu verifikasi petugas.",
      data: { id: result.insertId, no_registrasi: data.no_registrasi },
    }, { status: 201 });
  } catch (error) {
    console.error("Public submission error:", error);
    return NextResponse.json({ message: dbErrorMessage(error) }, { status: 400 });
  }
}
