import { getById, getTableMap, setByKey, type DbRecord } from "@/lib/realtime-db";

type SettingRecord = DbRecord & {
  setting_key?: string;
  setting_value?: string;
  keterangan?: string | null;
  updated_at?: string;
};

export async function ensureSettingsTable(): Promise<void> {
  // Firebase RTDB bersifat schemaless; tidak perlu pembuatan tabel terpisah.
}

export async function getSystemSetting(key: string, defaultValue = ""): Promise<string> {
  try {
    const item = await getById<SettingRecord>("pengaturan_sistem", key);
    if (item && item.setting_value !== undefined && item.setting_value !== null) {
      return String(item.setting_value);
    }
  } catch (error) {
    console.error(`[system-settings] Error reading key "${key}":`, error);
  }
  return defaultValue;
}

export async function setSystemSetting(key: string, value: string, keterangan?: string): Promise<void> {
  await setByKey("pengaturan_sistem", key, {
    setting_key: key,
    setting_value: value,
    keterangan: keterangan ?? null,
  });
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
  try {
    const map = await getTableMap<SettingRecord>("pengaturan_sistem");
    const result: Record<string, { value: string; keterangan: string | null }> = {
      petugas_mass_delete_enabled: {
        value: "1",
        keterangan: "Mengaktifkan fitur hapus massal pengajuan untuk akun petugas",
      },
    };
    for (const [key, item] of Object.entries(map)) {
      result[key] = {
        value: String(item.setting_value ?? ""),
        keterangan: item.keterangan ? String(item.keterangan) : null,
      };
    }
    return result;
  } catch (error) {
    console.error("[system-settings] Error getting all settings:", error);
    return {
      petugas_mass_delete_enabled: {
        value: "1",
        keterangan: "Mengaktifkan fitur hapus massal pengajuan untuk akun petugas",
      },
    };
  }
}
