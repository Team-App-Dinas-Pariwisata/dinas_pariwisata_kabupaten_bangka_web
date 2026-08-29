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

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export async function deleteSubmissionWithFiles(type: SubmissionType, id: number | string): Promise<CleanupResult> {
  const config = submissionConfigs[type];
  const row = await getById<DbRecord>(config.table, id);
  if (!row) throw new Error("Pengajuan tidak ditemukan.");

  const fileFields = allSubmissionFields(type).filter((field) => field.type === "file");
  const references = fileFields
    .map((field) => row[field.key])
    .filter((value) => typeof value === "string" && value.trim()) as string[];

  const keys = unique(
    references
      .map((value) => keyFromR2SubmissionStorageReference(value))
      .filter((value): value is string => Boolean(value && isManagedR2SubmissionKey(value))),
  );

  const skippedFiles = Math.max(0, references.length - keys.length);
  for (const key of keys) {
    await deleteSubmissionFileFromR2(key);
  }

  const deleted = await deleteById(config.table, id);
  if (!deleted) throw new Error("Pengajuan tidak ditemukan saat proses penghapusan.");

  // Flutter membaca direktori publik dari mirror ini. Hapus entri mirror
  // bersamaan agar pengajuan yang sudah dihapus tidak tetap tampil di mobile.
  await deleteByKey(`public_directory/${type}`, id);

  return { deletedRecordId: id, deletedFiles: keys.length, skippedFiles };
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
