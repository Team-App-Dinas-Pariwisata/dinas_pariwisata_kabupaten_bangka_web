import type { ResultSetHeader } from "mysql2/promise";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allSubmissionFields, submissionConfigs, type SubmissionField, type SubmissionType } from "@/lib/submission-config";
import { uploadSubmissionFileToR2 } from "@/lib/r2";

export const runtime = "nodejs";

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

async function saveFile(file: File, type: SubmissionType, key: string, ownerId?: number | null) {
  const uploaded = await uploadSubmissionFileToR2(file, type, key, ownerId);
  return uploaded.storageUrl;
}


function validateFileForField(file: File, field: SubmissionField) {
  const mime = file.type.toLowerCase().split(";", 1)[0].trim();
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const isJpeg = mime === "image/jpeg" || mime === "image/jpg" || ext === "jpg" || ext === "jpeg";
  const isPng = mime === "image/png" || ext === "png";
  const isPdf = mime === "application/pdf" || ext === "pdf";

  if (field.fileKind === "document") {
    if (!(isPdf || isJpeg || isPng)) {
      throw new Error(`${field.label}: format dokumen harus PDF, JPG/JPEG, atau PNG.`);
    }
    return;
  }

  if (!(isJpeg || isPng)) {
    throw new Error(`${field.label}: format gambar harus JPG/JPEG atau PNG.`);
  }
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
  if (error instanceof Error && /(maksimal|format|cloudflare r2|r2|upload)/i.test(error.message)) return error.message;
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

    const data: Record<string, string | number | null> = { no_registrasi: registration(config.registrationPrefix) };

    for (const field of fields) {
      if (field.key === "konfirmasi_kebenaran") continue;
      if (field.type === "file") {
        const entry = form.get(field.key);
        if (entry instanceof File && entry.size > 0) {
          validateFileForField(entry, field);
          data[field.key] = await saveFile(entry, type, field.key, null);
        }
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
