import { firebaseRealtimeDatabase } from "@/lib/firebase-rtdb";

export type DbRecord = Record<string, unknown> & { id?: number | string };

function safeValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => safeValue(item)) as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (item === undefined) continue;
      if (typeof item === "number" && !Number.isFinite(item)) {
        out[key] = null;
        continue;
      }
      out[key] = safeValue(item);
    }
    return out as T;
  }
  if (value instanceof Date) return value.toISOString() as T;
  return value;
}

export function dbNow(date = new Date()) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export function toTime(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value);
  const normalized = text.includes("T") ? text : text.replace(" ", "T");
  const parsed = new Date(normalized).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isTruthyDb(value: unknown) {
  return value === true || value === 1 || value === "1";
}

export function isPublishedRecord(row: Record<string, unknown>, now = Date.now()) {
  if (!isTruthyDb(row.aktif) || !isTruthyDb(row.dipublikasikan)) return false;
  if (!row.tanggal_publikasi) return false;
  return toTime(row.tanggal_publikasi) <= now;
}

export async function getTableMap<T extends DbRecord = DbRecord>(table: string): Promise<Record<string, T>> {
  const snapshot = await firebaseRealtimeDatabase().ref(table).get();
  const raw = snapshot.val();
  if (!raw || typeof raw !== "object") return {};
  return raw as Record<string, T>;
}

export async function getAll<T extends DbRecord = DbRecord>(table: string): Promise<T[]> {
  const map = await getTableMap<T>(table);
  return Object.entries(map).map(([key, value]) => {
    if (value && typeof value === "object" && value.id !== undefined) return value;
    const numeric = Number(key);
    return { ...(value as T), id: Number.isSafeInteger(numeric) ? numeric : key } as T;
  });
}

export async function getById<T extends DbRecord = DbRecord>(table: string, id: number | string): Promise<T | null> {
  const snapshot = await firebaseRealtimeDatabase().ref(`${table}/${String(id)}`).get();
  if (!snapshot.exists()) return null;
  const value = snapshot.val() as T;
  if (value && typeof value === "object" && value.id !== undefined) return value;
  const numeric = Number(id);
  return { ...value, id: Number.isSafeInteger(numeric) ? numeric : id } as T;
}

export async function findOne<T extends DbRecord = DbRecord>(
  table: string,
  predicate: (row: T) => boolean,
): Promise<T | null> {
  const rows = await getAll<T>(table);
  return rows.find(predicate) ?? null;
}

export async function createNumeric<T extends Record<string, unknown>>(
  table: string,
  data: T,
): Promise<number> {
  const database = firebaseRealtimeDatabase();
  const counterRef = database.ref(`__meta/counters/${table}`);

  // Jika database di-import manual tanpa counter, ambil ID terbesar sebagai baseline.
  const [counterSnapshot, tableMap] = await Promise.all([counterRef.get(), getTableMap(table)]);
  let baseline = Number(counterSnapshot.val() ?? 0);
  for (const key of Object.keys(tableMap)) {
    const id = Number(key);
    if (Number.isSafeInteger(id) && id > baseline) baseline = id;
  }

  const transaction = await counterRef.transaction((current) => {
    const value = Number(current ?? baseline);
    return Math.max(Number.isFinite(value) ? value : 0, baseline) + 1;
  });
  const id = Number(transaction.snapshot.val());
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`Gagal membuat ID baru untuk ${table}.`);

  const now = dbNow();
  const record = safeValue({
    ...data,
    id,
    created_at: data.created_at ?? now,
    updated_at: data.updated_at ?? now,
  });
  await database.ref(`${table}/${id}`).set(record);
  return id;
}

export async function setByKey<T extends Record<string, unknown>>(
  table: string,
  key: string | number,
  data: T,
) {
  await firebaseRealtimeDatabase().ref(`${table}/${String(key)}`).set(safeValue(data));
}

export async function updateById<T extends Record<string, unknown>>(
  table: string,
  id: number | string,
  patch: T,
): Promise<boolean> {
  const ref = firebaseRealtimeDatabase().ref(`${table}/${String(id)}`);
  const snapshot = await ref.get();
  if (!snapshot.exists()) return false;
  const value = safeValue({ ...patch, updated_at: patch.updated_at ?? dbNow() });
  await ref.update(value);
  return true;
}

export async function updateByKey<T extends Record<string, unknown>>(
  table: string,
  key: string | number,
  patch: T,
) {
  const ref = firebaseRealtimeDatabase().ref(`${table}/${String(key)}`);
  const snapshot = await ref.get();
  const existing = snapshot.exists() ? snapshot.val() : {};
  await ref.set(safeValue({ ...existing, ...patch }));
}

export async function deleteById(table: string, id: number | string): Promise<boolean> {
  const ref = firebaseRealtimeDatabase().ref(`${table}/${String(id)}`);
  const snapshot = await ref.get();
  if (!snapshot.exists()) return false;
  await ref.remove();
  return true;
}

export async function deleteByKey(table: string, key: string | number) {
  await firebaseRealtimeDatabase().ref(`${table}/${String(key)}`).remove();
}

export async function multiPathUpdate(updates: Record<string, unknown>) {
  await firebaseRealtimeDatabase().ref().update(safeValue(updates));
}

export function pick<T extends DbRecord>(row: T, fields: string[]) {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in row) out[field] = row[field];
  }
  return out;
}

export function byNumericId<T extends DbRecord>(rows: T[]) {
  return new Map(rows.map((row) => [Number(row.id), row]));
}

export function nullIfBlank(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

export function firstNonBlank(...values: unknown[]) {
  for (const value of values) {
    const normalized = nullIfBlank(value);
    if (normalized !== null) return normalized;
  }
  return null;
}
