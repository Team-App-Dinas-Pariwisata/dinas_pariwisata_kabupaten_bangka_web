import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";

type SettingRow = RowDataPacket & {
  setting_key: string;
  setting_value: string;
  keterangan: string | null;
};

let tableInitialized = false;

export async function ensureSettingsTable(): Promise<void> {
  if (tableInitialized) return;
  try {
    await db().execute(`
      CREATE TABLE IF NOT EXISTS pengaturan_sistem (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT NOT NULL,
        keterangan VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_setting_key (setting_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db().execute(`
      INSERT INTO pengaturan_sistem (setting_key, setting_value, keterangan)
      VALUES ('petugas_mass_delete_enabled', '1', 'Mengaktifkan fitur hapus massal pengajuan untuk akun petugas')
      ON DUPLICATE KEY UPDATE id = id
    `);

    tableInitialized = true;
  } catch (error) {
    console.error("[system-settings] Failed to ensure settings table:", error);
  }
}

export async function getSystemSetting(key: string, defaultValue = ""): Promise<string> {
  await ensureSettingsTable();
  try {
    const [rows] = await db().execute<SettingRow[]>(
      "SELECT setting_value FROM pengaturan_sistem WHERE setting_key = ? LIMIT 1",
      [key],
    );
    if (rows.length > 0 && rows[0].setting_value !== undefined) {
      return rows[0].setting_value;
    }
  } catch (error) {
    console.error(`[system-settings] Error reading key "${key}":`, error);
  }
  return defaultValue;
}

export async function setSystemSetting(key: string, value: string, keterangan?: string): Promise<void> {
  await ensureSettingsTable();
  await db().execute<ResultSetHeader>(
    `INSERT INTO pengaturan_sistem (setting_key, setting_value, keterangan)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), keterangan = COALESCE(VALUES(keterangan), keterangan)`,
    [key, value, keterangan ?? null],
  );
}

export async function isPetugasMassDeleteEnabled(): Promise<boolean> {
  const val = await getSystemSetting("petugas_mass_delete_enabled", "1");
  return val === "1" || val.toLowerCase() === "true";
}

export async function setPetugasMassDeleteEnabled(enabled: boolean): Promise<void> {
  await setSystemSetting(
    "petugas_mass_delete_enabled",
    enabled ? "1" : "0",
    "Mengaktifkan fitur hapus massal pengajuan untuk akun petugas",
  );
}

export async function getAllSystemSettings(): Promise<Record<string, { value: string; keterangan: string | null }>> {
  await ensureSettingsTable();
  const [rows] = await db().execute<SettingRow[]>(
    "SELECT setting_key, setting_value, keterangan FROM pengaturan_sistem",
  );
  const result: Record<string, { value: string; keterangan: string | null }> = {};
  for (const row of rows) {
    result[row.setting_key] = {
      value: row.setting_value,
      keterangan: row.keterangan,
    };
  }
  return result;
}
