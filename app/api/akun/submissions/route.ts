import type { ResultSetHeader } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
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
  if (code === "ER_DUP_ENTRY") return "Data unik sudah tercatat. Periksa kembali pengajuan Anda.";
  if (code === "ER_NO_REFERENCED_ROW_2") return "Kecamatan, kelurahan, subsektor, atau komunitas yang dipilih tidak valid.";
  if (code === "ER_BAD_FIELD_ERROR") return "Database belum menjalankan migration akun pengaju. Jalankan file database/migrations/2026-08-11_google_pengaju.sql.";
  if (code === "ER_DATA_TOO_LONG") return "Ada data yang terlalu panjang untuk disimpan.";
  if (error instanceof Error && (error.message.includes("maksimal") || error.message.includes("Format") || error.message.includes("Cloudflare R2") || error.message.includes("R2") || error.message.includes("Upload"))) return error.message;
  return "Pengajuan belum dapat disimpan. Periksa data dan koneksi database.";
}

export async function POST(request: NextRequest) {
  const user = await requireRequestRole(request, "pengaju");
  if (!user) return NextResponse.json({ message: "Sesi akun pengaju tidak valid. Silakan masuk kembali dengan Google." }, { status: 401 });

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

    const data: Record<string, unknown> = {
      no_registrasi: registration(config.registrationPrefix),
      created_by: user.id,
      updated_by: user.id,
    };

    for (const field of fields) {
      if (field.key === "konfirmasi_kebenaran") continue;
      if (field.type === "file") {
        const entry = form.get(field.key);
        if (entry instanceof File && entry.size > 0) data[field.key] = await saveFile(entry, type, field.key, user.id);
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
    if (type === "ekraf") data.status = "Menunggu";

    const keys = Object.keys(data);
    const [result] = await db().execute<ResultSetHeader>(
      `INSERT INTO ${config.table} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
      keys.map((key) => data[key]),
    );

    return NextResponse.json({
      message: "Pengajuan berhasil dikirim dan terhubung ke akun Google Anda.",
      data: { id: result.insertId, no_registrasi: data.no_registrasi },
    }, { status: 201 });
  } catch (error) {
    console.error("Applicant submission error:", error);
    return NextResponse.json({ message: dbErrorMessage(error) }, { status: 400 });
  }
}
