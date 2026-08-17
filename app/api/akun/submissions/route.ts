import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { allSubmissionFields, submissionConfigs, type SubmissionField, type SubmissionType } from "@/lib/submission-config";
import {
  applicantOwnsR2SubmissionKey,
  deleteSubmissionFileFromR2,
  keyFromR2SubmissionStorageReference,
  uploadSubmissionFileToR2,
} from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApplicantSubmissionRow = RowDataPacket & Record<string, unknown> & {
  id: number;
  created_by: number | null;
  no_registrasi: string | null;
  status?: string | null;
  status_pengajuan?: string | null;
};

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

function validType(value: string | null | undefined): value is SubmissionType {
  return value === "ekraf" || value === "sdm" || value === "komunitas";
}

function statusColumn(type: SubmissionType) {
  return type === "ekraf" ? "status" : "status_pengajuan";
}

function currentStatus(type: SubmissionType, row: ApplicantSubmissionRow) {
  return String(type === "ekraf" ? row.status ?? "Menunggu" : row.status_pengajuan ?? "Menunggu");
}

function canApplicantEdit(status: string) {
  return ["Menunggu", "Perlu Perbaikan", "Ditolak"].includes(status);
}

async function saveFile(file: File, type: SubmissionType, key: string, ownerId?: number | null) {
  return uploadSubmissionFileToR2(file, type, key, ownerId);
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

function requiredMissing(form: FormData, field: SubmissionField, existing?: ApplicantSubmissionRow | null) {
  if (!field.required) return false;
  if (field.type === "checkbox") return !checked(form, field.key);
  if (field.type === "file") {
    const file = form.get(field.key);
    const hasNewFile = file instanceof File && file.size > 0;
    const hasExistingFile = Boolean(existing?.[field.key]);
    return !hasNewFile && !hasExistingFile;
  }
  return !text(form, field.key);
}

function dbErrorMessage(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "ER_DUP_ENTRY") return "Data unik sudah tercatat. Periksa kembali pengajuan Anda.";
  if (code === "ER_NO_REFERENCED_ROW_2") return "Kecamatan, kelurahan, subsektor, atau komunitas yang dipilih tidak valid.";
  if (code === "ER_BAD_FIELD_ERROR") return "Database belum menjalankan migration akun pengaju. Jalankan file database/migrations/2026-08-11_google_pengaju.sql.";
  if (code === "ER_DATA_TOO_LONG") return "Ada data yang terlalu panjang untuk disimpan.";
  if (error instanceof Error && /(maksimal|format|cloudflare r2|r2|upload)/i.test(error.message)) return error.message;
  return "Pengajuan belum dapat disimpan. Periksa data dan koneksi database.";
}

function normalizeFieldValue(form: FormData, field: SubmissionField): string | number | null {
  if (field.type === "checkbox") return checked(form, field.key) ? 1 : 0;
  const value = text(form, field.key);
  if (!value) return null;
  if (["number", "year"].includes(field.type ?? "")) return Number(value);
  return value;
}

async function getOwnedSubmission(type: SubmissionType, id: number, userId: number) {
  const config = submissionConfigs[type];
  const fields = allSubmissionFields(type);
  const columns = [
    "id",
    "no_registrasi",
    statusColumn(type),
    "created_by",
    "created_at",
    "updated_at",
    "catatan_verifikasi",
    ...fields.filter((field) => field.key !== "konfirmasi_kebenaran").map((field) => field.key),
  ];
  const uniqueColumns = [...new Set(columns)];
  const [rows] = await db().execute<ApplicantSubmissionRow[]>(
    `SELECT ${uniqueColumns.join(", ")} FROM ${config.table} WHERE id = ? AND created_by = ? LIMIT 1`,
    [id, userId],
  );
  return rows[0] ?? null;
}

export async function GET(request: NextRequest) {
  const user = await requireRequestRole(request, "pengaju");
  if (!user) return NextResponse.json({ message: "Sesi akun pengaju tidak valid. Silakan masuk kembali dengan Google." }, { status: 401 });

  const type = request.nextUrl.searchParams.get("type");
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!validType(type) || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ message: "Pengajuan tidak valid." }, { status: 400 });
  }

  try {
    const row = await getOwnedSubmission(type, id, user.id);
    if (!row) return NextResponse.json({ message: "Pengajuan tidak ditemukan pada akun Anda." }, { status: 404 });
    const status = currentStatus(type, row);
    return NextResponse.json({
      data: {
        ...row,
        status_label: status,
        can_edit: canApplicantEdit(status),
      },
    });
  } catch (error) {
    console.error("Applicant submission detail error:", error);
    return NextResponse.json({ message: "Data pengajuan belum dapat dimuat." }, { status: 500 });
  }
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

    const data: Record<string, string | number | null> = {
      no_registrasi: registration(config.registrationPrefix),
      created_by: user.id,
      updated_by: user.id,
    };

    for (const field of fields) {
      if (field.key === "konfirmasi_kebenaran") continue;
      if (field.type === "file") {
        const entry = form.get(field.key);
        if (entry instanceof File && entry.size > 0) {
          validateFileForField(entry, field);
          data[field.key] = (await saveFile(entry, type, field.key, user.id)).storageUrl;
        }
        continue;
      }
      data[field.key] = normalizeFieldValue(form, field);
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

export async function PATCH(request: NextRequest) {
  const user = await requireRequestRole(request, "pengaju");
  if (!user) return NextResponse.json({ message: "Sesi akun pengaju tidak valid. Silakan masuk kembali dengan Google." }, { status: 401 });

  const newlyUploadedKeys: string[] = [];
  const replacedOldKeys: string[] = [];

  try {
    const form = await request.formData();
    const type = text(form, "type") as SubmissionType;
    const id = Number(text(form, "id"));
    if (!validType(type) || !Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "Pengajuan yang akan diedit tidak valid." }, { status: 400 });
    }

    const config = submissionConfigs[type];
    const existing = await getOwnedSubmission(type, id, user.id);
    if (!existing) return NextResponse.json({ message: "Pengajuan tidak ditemukan pada akun Anda." }, { status: 404 });

    const status = currentStatus(type, existing);
    if (!canApplicantEdit(status)) {
      return NextResponse.json({ message: "Pengajuan yang sudah disetujui tetap dapat dilihat, tetapi tidak dapat diubah setelah verifikasi final." }, { status: 409 });
    }

    const fields = allSubmissionFields(type);
    const missing = fields.find((field) => requiredMissing(form, field, existing));
    if (missing) return NextResponse.json({ message: `${missing.label} wajib diisi.` }, { status: 400 });

    if (["ekraf", "sdm"].includes(type)) {
      const nik = text(form, "nik").replace(/\D/g, "");
      if (nik.length !== 16) return NextResponse.json({ message: "NIK wajib terdiri dari 16 digit." }, { status: 400 });
    }

    const data: Record<string, string | number | null> = { updated_by: user.id };

    for (const field of fields) {
      if (field.key === "konfirmasi_kebenaran") continue;
      if (field.type === "file") {
        const entry = form.get(field.key);
        if (entry instanceof File && entry.size > 0) {
          validateFileForField(entry, field);
          const uploaded = await saveFile(entry, type, field.key, user.id);
          data[field.key] = uploaded.storageUrl;
          newlyUploadedKeys.push(uploaded.key);

          const oldKey = keyFromR2SubmissionStorageReference(String(existing[field.key] ?? ""));
          if (oldKey && applicantOwnsR2SubmissionKey(oldKey, user.id)) replacedOldKeys.push(oldKey);
        }
        continue;
      }
      data[field.key] = normalizeFieldValue(form, field);
    }

    // Setiap perubahan oleh pengaju masuk kembali ke antrean verifikasi.
    data[statusColumn(type)] = "Menunggu";
    data.catatan_verifikasi = null;
    data.diverifikasi_oleh = null;
    data.tanggal_verifikasi = null;
    if (type === "sdm" || type === "komunitas") {
      data.alasan_penolakan = null;
      data.dipublikasikan = 0;
      data.tanggal_publikasi = null;
      data.token_perbaikan = null;
      data.token_perbaikan_kedaluwarsa = null;
    }

    const keys = Object.keys(data);
    const [result] = await db().execute<ResultSetHeader>(
      `UPDATE ${config.table} SET ${keys.map((key) => `${key} = ?`).join(", ")} WHERE id = ? AND created_by = ?`,
      [...keys.map((key) => data[key]), id, user.id],
    );
    if (!result.affectedRows) throw new Error("Pengajuan tidak ditemukan atau tidak berubah.");

    // Setelah referensi database berhasil diganti, file R2 lama dibersihkan.
    await Promise.allSettled(replacedOldKeys.map((key) => deleteSubmissionFileFromR2(key)));

    return NextResponse.json({
      message: "Perubahan pengajuan berhasil disimpan dan dikirim kembali untuk verifikasi.",
      data: { id, no_registrasi: existing.no_registrasi, status: "Menunggu" },
    });
  } catch (error) {
    // Jika database gagal setelah file baru terunggah, bersihkan object baru agar tidak orphan.
    await Promise.allSettled(newlyUploadedKeys.map((key) => deleteSubmissionFileFromR2(key)));
    console.error("Applicant submission update error:", error);
    return NextResponse.json({ message: dbErrorMessage(error) }, { status: 400 });
  }
}
