import { getAll, isTruthyDb, toTime, type DbRecord } from "@/lib/realtime-db";

export function compareNullable(a: unknown, b: unknown) {
  if (a === b) return 0;
  if (a === null || a === undefined || a === "") return 1;
  if (b === null || b === undefined || b === "") return -1;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  const ta = toTime(a);
  const tb = toTime(b);
  if (ta || tb) return ta - tb;
  return String(a).localeCompare(String(b), "id", { sensitivity: "base", numeric: true });
}

export function sortByOrder<T extends Record<string, unknown>>(rows: T[], orderBy: string) {
  const specs = orderBy.split(",").map((part) => {
    const [rawField, rawDirection] = part.trim().split(/\s+/);
    const field = rawField.replace(/^[a-z]+\./i, "");
    return { field, direction: String(rawDirection ?? "ASC").toUpperCase() === "DESC" ? -1 : 1 };
  });

  return [...rows].sort((a, b) => {
    for (const spec of specs) {
      const diff = compareNullable(a[spec.field], b[spec.field]);
      if (diff) return diff * spec.direction;
    }
    return 0;
  });
}

export function activeOnly<T extends Record<string, unknown>>(rows: T[]) {
  return rows.filter((row) => isTruthyDb(row.aktif));
}

export async function lookupMap(table: string, labelField: string) {
  const rows = await getAll<DbRecord>(table);
  return new Map(rows.map((row) => [Number(row.id), row[labelField] == null ? null : String(row[labelField])]));
}

export function containsText(values: unknown[], query: string) {
  const needle = query.trim().toLocaleLowerCase("id-ID");
  if (!needle) return true;
  return values.some((value) => value != null && String(value).toLocaleLowerCase("id-ID").includes(needle));
}
