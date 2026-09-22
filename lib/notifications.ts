import { createNumeric, dbNow, getAll, getById, updateById, type DbRecord } from "@/lib/realtime-db";
import type { SubmissionType } from "@/lib/submission-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationKind = "pengajuan_baru" | "pengajuan_diperbaiki" | "verifikasi";
export type NotificationTargetRole = "admin" | "petugas" | "pengaju" | "pengguna";

export type NotificationRow = DbRecord & {
  id: number;
  target_role: NotificationTargetRole;
  target_user_id: number | null;
  judul: string;
  pesan: string;
  jenis: NotificationKind;
  referensi_tipe: SubmissionType | null;
  referensi_id: number | null;
  pengirim_nama: string | null;
  is_read: number;
  created_at: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const typeLabel: Record<SubmissionType, string> = {
  ekraf: "Pelaku Ekraf",
  sdm: "SDM Pariwisata",
  komunitas: "Komunitas/Asosiasi",
};

/**
 * Insert satu notifikasi ke Firebase Realtime Database.
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
    await createNumeric("notifikasi", {
      target_role: params.targetRole,
      target_user_id: params.targetUserId ?? null,
      judul: params.judul,
      pesan: params.pesan,
      jenis: params.jenis,
      referensi_tipe: params.referensiTipe ?? null,
      referensi_id: params.referensiId ?? null,
      pengirim_nama: params.pengirimNama ?? null,
      is_read: 0,
      created_at: dbNow(),
    });
  } catch (error) {
    console.error("[notifikasi] Gagal menyimpan notifikasi ke Firebase:", error);
  }
}

/**
 * Hitung notifikasi belum dibaca untuk role / user tertentu.
 */
export async function getUnreadCount(role: NotificationTargetRole, userId?: number): Promise<number> {
  const effectiveRole = role === "pengguna" ? "petugas" : role;
  try {
    const all = await getAll<NotificationRow>("notifikasi");
    if (effectiveRole === "pengaju" && userId) {
      return all.filter(
        (n) => n.target_role === "pengaju" && Number(n.target_user_id) === userId && Number(n.is_read ?? 0) === 0,
      ).length;
    }
    return all.filter((n) => n.target_role === effectiveRole && Number(n.is_read ?? 0) === 0).length;
  } catch (error) {
    console.error("[notifikasi] Error reading unread count:", error);
    return 0;
  }
}

/**
 * Ambil daftar notifikasi terbaru untuk role / user tertentu.
 */
export async function getNotifications(
  role: NotificationTargetRole,
  limit = 30,
  userId?: number,
): Promise<NotificationRow[]> {
  const effectiveRole = role === "pengguna" ? "petugas" : role;
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 100));
  try {
    const all = await getAll<NotificationRow>("notifikasi");
    const filtered = all.filter((n) => {
      if (effectiveRole === "pengaju" && userId) {
        return n.target_role === "pengaju" && Number(n.target_user_id) === userId;
      }
      return n.target_role === effectiveRole;
    });

    return filtered
      .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")) || Number(b.id) - Number(a.id))
      .slice(0, safeLimit);
  } catch (error) {
    console.error("[notifikasi] Error reading notifications:", error);
    return [];
  }
}

/**
 * Tandai satu notifikasi sebagai sudah dibaca.
 */
export async function markAsRead(id: number, userId?: number, role?: NotificationTargetRole): Promise<boolean> {
  const effectiveRole = role === "pengguna" ? "petugas" : role;
  try {
    const existing = await getById<NotificationRow>("notifikasi", id);
    if (!existing) return false;
    if (effectiveRole === "pengaju" && userId && Number(existing.target_user_id) !== userId) return false;
    await updateById("notifikasi", id, { is_read: 1 });
    return true;
  } catch (error) {
    console.error("[notifikasi] Error marking notification as read:", error);
    return false;
  }
}

/**
 * Tandai semua notifikasi role / user sebagai sudah dibaca.
 */
export async function markAllAsRead(role: NotificationTargetRole, userId?: number): Promise<number> {
  const effectiveRole = role === "pengguna" ? "petugas" : role;
  try {
    const all = await getAll<NotificationRow>("notifikasi");
    const targets = all.filter((n) => {
      if (Number(n.is_read ?? 0) === 1) return false;
      if (effectiveRole === "pengaju" && userId) {
        return n.target_role === "pengaju" && Number(n.target_user_id) === userId;
      }
      return n.target_role === effectiveRole;
    });

    await Promise.all(targets.map((n) => updateById("notifikasi", n.id, { is_read: 1 })));
    return targets.length;
  } catch (error) {
    console.error("[notifikasi] Error marking all notifications as read:", error);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Shortcut helpers for common notification scenarios
// ---------------------------------------------------------------------------

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

export async function notifyApplicantDecision(params: {
  applicantUserId: number;
  type: SubmissionType;
  submissionId: number;
  status: "Disetujui" | "Ditolak" | "Perlu Perbaikan";
  note?: string;
  noRegistrasi?: string | null;
  staffName?: string;
}): Promise<void> {
  const label = typeLabel[params.type];
  const reg = params.noRegistrasi ? ` (${params.noRegistrasi})` : "";
  const isApproved = params.status === "Disetujui";
  const judul = isApproved
    ? `Pengajuan Disetujui: ${label}`
    : `Pengajuan Perlu Revisi / Ditolak: ${label}`;
  const noteInfo = params.note ? ` Catatan petugas: "${params.note}".` : "";
  const pesan = isApproved
    ? `Selamat! Pengajuan ${label}${reg} Anda telah diverifikasi dan disetujui.${noteInfo}`
    : `Pengajuan ${label}${reg} Anda belum disetujui atau memerlukan perbaikan.${noteInfo} Silakan klik untuk meninjau dan memperbarui data.`;

  await createNotification({
    targetRole: "pengaju",
    targetUserId: params.applicantUserId,
    judul,
    pesan,
    jenis: "verifikasi",
    referensiTipe: params.type,
    referensiId: params.submissionId,
    pengirimNama: params.staffName ?? null,
  });
}
