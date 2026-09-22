import { allSubmissionFields, submissionConfigs, type SubmissionType } from "@/lib/submission-config";
import { deleteById, deleteByKey, getById, type DbRecord } from "@/lib/realtime-db";
import {
  deleteImageFromR2,
  deleteSubmissionFileFromR2,
  isManagedR2ImageKey,
  isManagedR2SubmissionKey,
  keyFromR2StorageReference,
  keyFromR2SubmissionStorageReference,
} from "@/lib/r2";

export type CleanupResult = {
  deletedRecordId: number | string;
  deletedFiles: number;
  skippedFiles: number;
};

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

export function isSubmissionType(value: unknown): value is SubmissionType {
  return value === "ekraf" || value === "sdm" || value === "komunitas";
}

/**
 * Hapus beberapa pengajuan secara massal sekaligus dari Firebase Realtime Database,
 * termasuk membersihkan berkas terkait di Cloudflare R2.
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

  const deletedIds: number[] = [];
  const r2KeysToDelete: string[] = [];

  for (const id of uniqueIds) {
    const row = await getById<DbRecord>(config.table, id);
    if (!row) continue;

    for (const field of fileFields) {
      const rawVal = row[field];
      if (typeof rawVal === "string" && rawVal.trim()) {
        const key = keyFromR2SubmissionStorageReference(rawVal);
        if (key && isManagedR2SubmissionKey(key)) {
          r2KeysToDelete.push(key);
        }
      }
    }

    await deleteById(config.table, id);
    await deleteByKey(`public_directory/${type}`, id);
    deletedIds.push(id);
  }

  const uniqueR2Keys = [...new Set(r2KeysToDelete)];
  const cleanup = await Promise.allSettled(uniqueR2Keys.map((key) => deleteSubmissionFileFromR2(key)));
  const failedFiles = cleanup.filter((result) => result.status === "rejected").length;

  return {
    type,
    requestedIds: uniqueIds,
    deletedIds,
    deletedCount: deletedIds.length,
    deletedFiles: cleanup.length - failedFiles,
    failedFiles,
    deletedNotifications: 0,
  };
}

/**
 * Hapus satu pengajuan beserta berkas R2 terkait.
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

export async function deleteSubmissionWithFiles(type: SubmissionType, id: number | string): Promise<CleanupResult> {
  const numId = Number(id);
  const result = await deleteSubmissionWithManagedFiles(type, numId);
  if (!result) throw new Error("Pengajuan tidak ditemukan.");
  return { deletedRecordId: id, deletedFiles: result.deletedFiles, skippedFiles: result.failedFiles };
}

export async function deleteDetectionReportWithImage(id: number | string): Promise<CleanupResult> {
  const row = await getById<DbRecord>("laporan_deteksi", id);
  if (!row) throw new Error("Laporan deteksi tidak ditemukan.");

  const imageReference = typeof row.image_key === "string" && row.image_key.trim()
    ? row.image_key.trim()
    : typeof row.image_url === "string"
      ? row.image_url.trim()
      : "";

  let deletedFiles = 0;
  let skippedFiles = 0;
  if (imageReference) {
    const key = isManagedR2ImageKey(imageReference)
      ? imageReference
      : keyFromR2StorageReference(imageReference);
    if (key && isManagedR2ImageKey(key)) {
      await deleteImageFromR2(key);
      deletedFiles = 1;
    } else {
      skippedFiles = 1;
    }
  }

  const deleted = await deleteById("laporan_deteksi", id);
  if (!deleted) throw new Error("Laporan deteksi tidak ditemukan saat proses penghapusan.");

  return { deletedRecordId: id, deletedFiles, skippedFiles };
}
