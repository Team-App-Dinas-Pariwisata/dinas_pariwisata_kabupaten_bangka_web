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
};

type SubmissionFileRow = RowDataPacket & Record<string, unknown> & { id: number };

export function isSubmissionType(value: unknown): value is SubmissionType {
  return value === "ekraf" || value === "sdm" || value === "komunitas";
}

export async function deleteSubmissionWithManagedFiles(
  type: SubmissionType,
  id: number,
): Promise<SubmissionCleanupResult | null> {
  const config = submissionConfigs[type];
  const fileFields = allSubmissionFields(type)
    .filter((field) => field.type === "file")
    .map((field) => field.key);

  const connection = await db().getConnection();
  let keys: string[] = [];
  try {
    await connection.beginTransaction();

    const columns = ["id", ...fileFields];
    const [rows] = await connection.execute<SubmissionFileRow[]>(
      `SELECT ${columns.join(", ")} FROM ${config.table} WHERE id = ? LIMIT 1 FOR UPDATE`,
      [id],
    );
    const row = rows[0];
    if (!row) {
      await connection.rollback();
      return null;
    }

    keys = [...new Set(
      fileFields
        .map((field) => keyFromR2SubmissionStorageReference(String(row[field] ?? "")))
        .filter((key): key is string => Boolean(key)),
    )];

    await connection.execute(`DELETE FROM ${config.table} WHERE id = ?`, [id]);
    await connection.commit();
  } catch (error) {
    try { await connection.rollback(); } catch { /* ignore rollback failure */ }
    throw error;
  } finally {
    connection.release();
  }

  const cleanup = await Promise.allSettled(keys.map((key) => deleteSubmissionFileFromR2(key)));
  const failedFiles = cleanup.filter((result) => result.status === "rejected").length;
  if (failedFiles) {
    console.error(`Submission ${type}#${id} deleted, but ${failedFiles} R2 file(s) could not be removed.`);
  }

  return {
    id,
    type,
    deletedFiles: cleanup.length - failedFiles,
    failedFiles,
  };
}
