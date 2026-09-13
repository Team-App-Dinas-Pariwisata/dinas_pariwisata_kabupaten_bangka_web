import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import type { SubmissionType } from "@/lib/submission-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationKind = "pengajuan_baru" | "pengajuan_diperbaiki" | "verifikasi";
export type NotificationTargetRole = "admin" | "petugas";

export type NotificationRow = {
  id: number;
  target_role: NotificationTargetRole;
  judul: string;
  pesan: string;
  jenis: NotificationKind;
  referensi_tipe: SubmissionType | null;
  referensi_id: number | null;
  pengirim_nama: string | null;
  is_read: number;
  created_at: string;
};

type DbNotificationRow = RowDataPacket & NotificationRow;
type CountRow = RowDataPacket & { total: number };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const typeLabel: Record<SubmissionType, string> = {
  ekraf: "Pelaku Ekraf",
  sdm: "SDM Pariwisata",
  komunitas: "Komunitas/Asosiasi",
};

/**
 * Insert satu notifikasi ke database.
 * Best-effort: kegagalan tidak boleh menghambat proses utama.
 */
export async function createNotification(params: {
  targetRole: NotificationTargetRole;
  targetUserId?: number | null;
  judul: string;
  pesan: string;
  jenis: NotificationKind;
  referensiTipe?: SubmissionType | null;
  referensiId?: number | null;
  pengirimNama?: string | null;
}): Promise<void> {
  try {
    await db().execute<ResultSetHeader>(
      `INSERT INTO notifikasi (target_role, target_user_id, judul, pesan, jenis, referensi_tipe, referensi_id, pengirim_nama)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.targetRole,
        params.targetUserId ?? null,
        params.judul,
        params.pesan,
        params.jenis,
        params.referensiTipe ?? null,
        params.referensiId ?? null,
        params.pengirimNama ?? null,
      ],
    );
  } catch (error) {
    console.error("[notifikasi] Gagal menyimpan notifikasi:", error);
  }
}

/**
 * Hitung notifikasi belum dibaca untuk role tertentu.
 */
export async function getUnreadCount(role: NotificationTargetRole): Promise<number> {
  const [rows] = await db().execute<CountRow[]>(
    "SELECT COUNT(*) AS total FROM notifikasi WHERE target_role = ? AND is_read = 0",
    [role],
  );
  return Number(rows[0]?.total ?? 0);
}

/**
 * Ambil daftar notifikasi terbaru untuk role tertentu.
 */
export async function getNotifications(
  role: NotificationTargetRole,
  limit = 30,
): Promise<NotificationRow[]> {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));

  const [rows] = await db().execute<DbNotificationRow[]>(
    `SELECT id, target_role, judul, pesan, jenis, referensi_tipe, referensi_id, pengirim_nama, is_read, created_at
     FROM notifikasi
     WHERE target_role = ?
     ORDER BY created_at DESC
     LIMIT ${safeLimit}`,
    [role],
  );

  return rows;
}

/**
 * Tandai satu notifikasi sebagai sudah dibaca.
 */
export async function markAsRead(id: number): Promise<boolean> {
  const [result] = await db().execute<ResultSetHeader>(
    "UPDATE notifikasi SET is_read = 1 WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
}

/**
 * Tandai semua notifikasi role sebagai sudah dibaca.
 */
export async function markAllAsRead(role: NotificationTargetRole): Promise<number> {
  const [result] = await db().execute<ResultSetHeader>(
    "UPDATE notifikasi SET is_read = 1 WHERE target_role = ? AND is_read = 0",
    [role],
  );
  return result.affectedRows;
}

// ---------------------------------------------------------------------------
// Shortcut helpers for common notification scenarios
// ---------------------------------------------------------------------------

/**
 * Notifikasi ke petugas: pengajuan baru masuk dari pengaju.
 */
export async function notifyNewSubmission(params: {
  type: SubmissionType;
  submissionId: number;
  applicantName: string;
  noRegistrasi?: string | null;
}): Promise<void> {
  const label = typeLabel[params.type];
  const reg = params.noRegistrasi ? ` (${params.noRegistrasi})` : "";
  await createNotification({
    targetRole: "petugas",
    judul: `Pengajuan baru: ${label}`,
    pesan: `${params.applicantName} mengirimkan pengajuan ${label}${reg}. Silakan tinjau dan verifikasi.`,
    jenis: "pengajuan_baru",
    referensiTipe: params.type,
    referensiId: params.submissionId,
    pengirimNama: params.applicantName,
  });
}

/**
 * Notifikasi ke petugas: pengajuan diperbaiki oleh pengaju.
 */
export async function notifySubmissionRevised(params: {
  type: SubmissionType;
  submissionId: number;
  applicantName: string;
  noRegistrasi?: string | null;
}): Promise<void> {
  const label = typeLabel[params.type];
  const reg = params.noRegistrasi ? ` (${params.noRegistrasi})` : "";
  await createNotification({
    targetRole: "petugas",
    judul: `Pengajuan diperbaiki: ${label}`,
    pesan: `${params.applicantName} memperbaiki dan mengirim ulang pengajuan ${label}${reg}. Silakan tinjau kembali.`,
    jenis: "pengajuan_diperbaiki",
    referensiTipe: params.type,
    referensiId: params.submissionId,
    pengirimNama: params.applicantName,
  });
}

/**
 * Notifikasi ke admin: petugas memverifikasi pengajuan.
 */
export async function notifyVerificationAction(params: {
  type: SubmissionType;
  submissionId: number;
  staffName: string;
  action: "approve" | "reject";
  noRegistrasi?: string | null;
}): Promise<void> {
  const label = typeLabel[params.type];
  const verb = params.action === "approve" ? "menyetujui" : "menolak";
  const reg = params.noRegistrasi ? ` ${params.noRegistrasi}` : "";
  await createNotification({
    targetRole: "admin",
    judul: `Pengajuan ${params.action === "approve" ? "disetujui" : "ditolak"}`,
    pesan: `Petugas ${params.staffName} telah ${verb} pengajuan ${label}${reg}.`,
    jenis: "verifikasi",
    referensiTipe: params.type,
    referensiId: params.submissionId,
    pengirimNama: params.staffName,
  });
}
