import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import { allSubmissionFields, submissionConfigs, type SubmissionType } from "@/lib/submission-config";
import {
  deleteSubmissionFileFromR2,
  keyFromR2SubmissionStorageReference,
} from "@/lib/r2";

export type SubmissionCleanupResult = {
  id: number;
  type: SubmissionType;
  deletedFiles: number;
  failedFiles: number;
  deletedNotifications?: number;
};

export type BatchSubmissionCleanupResult = {
  type: SubmissionType;
  requestedIds: number[];
  deletedIds: number[];
  deletedCount: number;
  deletedFiles: number;
  failedFiles: number;
  deletedNotifications: number;
};

type SubmissionFileRow = RowDataPacket & Record<string, unknown> & { id: number };

export function isSubmissionType(value: unknown): value is SubmissionType {
  return value === "ekraf" || value === "sdm" || value === "komunitas";
}

/**
 * Hapus beberapa pengajuan secara massal sekaligus dalam satu transaksi,
 * termasuk membersihkan seluruh relasi di tabel notifikasi dan berkas di Cloudflare R2.
 */
export async function deleteSubmissionsWithManagedFiles(
  type: SubmissionType,
  ids: number[],
): Promise<BatchSubmissionCleanupResult> {
  const uniqueIds = [...new Set(ids.filter((id) => Number.isSafeInteger(id) && id > 0))];
  if (uniqueIds.length === 0) {
    return {
      type,
      requestedIds: ids,
      deletedIds: [],
      deletedCount: 0,
      deletedFiles: 0,
      failedFiles: 0,
      deletedNotifications: 0,
    };
  }

  const config = submissionConfigs[type];
  const fileFields = allSubmissionFields(type)
    .filter((field) => field.type === "file")
    .map((field) => field.key);

  const connection = await db().getConnection();
  let keys: string[] = [];
  let deletedIds: number[] = [];
  let deletedNotifCount = 0;

  try {
    await connection.beginTransaction();

    const placeholders = uniqueIds.map(() => "?").join(", ");
    const columns = ["id", ...fileFields];

    const [rows] = await connection.execute<SubmissionFileRow[]>(
      `SELECT ${columns.join(", ")} FROM ${config.table} WHERE id IN (${placeholders}) FOR UPDATE`,
      uniqueIds,
    );

    if (rows.length === 0) {
      await connection.rollback();
      return {
        type,
        requestedIds: uniqueIds,
        deletedIds: [],
        deletedCount: 0,
        deletedFiles: 0,
        failedFiles: 0,
        deletedNotifications: 0,
      };
    }

    deletedIds = rows.map((r) => r.id);

    // Kumpulkan seluruh key R2 dari semua kolom file
    const extractedKeys: string[] = [];
    for (const row of rows) {
      for (const field of fileFields) {
        const rawVal = row[field];
        if (rawVal) {
          const key = keyFromR2SubmissionStorageReference(String(rawVal));
          if (key) extractedKeys.push(key);
        }
      }
    }
    keys = [...new Set(extractedKeys)];

    const matchedPlaceholders = deletedIds.map(() => "?").join(", ");

    // Catatan: Sesuai kebutuhan audit sistem, entri di tabel `notifikasi` TIDAK dihapus
    // agar riwayat/histori pengajuan (disetujui, ditolak, pengajuan baru) tetap dapat dipantau oleh Administrator.
    deletedNotifCount = 0;

    // Hapus baris pengajuan dari database
    await connection.execute(
      `DELETE FROM ${config.table} WHERE id IN (${matchedPlaceholders})`,
      deletedIds,
    );

    await connection.commit();
  } catch (error) {
    try { await connection.rollback(); } catch { /* ignore rollback failure */ }
    throw error;
  } finally {
    connection.release();
  }

  // Bersihkan file R2
  const cleanup = await Promise.allSettled(keys.map((key) => deleteSubmissionFileFromR2(key)));
  const failedFiles = cleanup.filter((result) => result.status === "rejected").length;
  if (failedFiles) {
    console.error(`Submissions ${type}[${deletedIds.join(",")}] deleted, but ${failedFiles} R2 file(s) could not be removed.`);
  }

  return {
    type,
    requestedIds: uniqueIds,
    deletedIds,
    deletedCount: deletedIds.length,
    deletedFiles: cleanup.length - failedFiles,
    failedFiles,
    deletedNotifications: deletedNotifCount,
  };
}

/**
 * Hapus satu pengajuan beserta berkas R2 dan notifikasi terkait.
 */
export async function deleteSubmissionWithManagedFiles(
  type: SubmissionType,
  id: number,
): Promise<SubmissionCleanupResult | null> {
  const batchResult = await deleteSubmissionsWithManagedFiles(type, [id]);
  if (batchResult.deletedCount === 0) return null;

  return {
    id,
    type,
    deletedFiles: batchResult.deletedFiles,
    failedFiles: batchResult.failedFiles,
    deletedNotifications: batchResult.deletedNotifications,
  };
}
