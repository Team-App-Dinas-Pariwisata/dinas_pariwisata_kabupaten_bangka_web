import { getAll, isTruthyDb, multiPathUpdate, type DbRecord } from "@/lib/realtime-db";

export type FacilityOwnerTable = "tempat_wisata" | "hotel" | "kuliner";

export type FacilityInfo = {
  id: number;
  code: string;
  name: string;
  category: string;
};

type FacilityRelationConfig = {
  relationTable: "tempat_wisata_fasilitas" | "hotel_fasilitas" | "kuliner_fasilitas";
  ownerField: "tempat_wisata_id" | "hotel_id" | "kuliner_id";
  allowedCategories: string[];
};

const relationConfig: Record<FacilityOwnerTable, FacilityRelationConfig> = {
  tempat_wisata: {
    relationTable: "tempat_wisata_fasilitas",
    ownerField: "tempat_wisata_id",
    allowedCategories: ["Umum", "Wisata", "Aksesibilitas", "Keamanan"],
  },
  hotel: {
    relationTable: "hotel_fasilitas",
    ownerField: "hotel_id",
    allowedCategories: ["Umum", "Hotel", "Aksesibilitas", "Keamanan"],
  },
  kuliner: {
    relationTable: "kuliner_fasilitas",
    ownerField: "kuliner_id",
    allowedCategories: ["Umum", "Kuliner", "Aksesibilitas", "Keamanan"],
  },
};

const categoryOrder = ["Umum", "Hotel", "Kuliner", "Wisata", "Aksesibilitas", "Keamanan"];

export function facilityConfigForTable(table: string): FacilityRelationConfig | null {
  return relationConfig[table as FacilityOwnerTable] ?? null;
}

export function isFacilityOwnerTable(table: string): table is FacilityOwnerTable {
  return Boolean(facilityConfigForTable(table));
}

export function sortFacilityInfo(a: FacilityInfo, b: FacilityInfo) {
  const categoryDifference = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
  if (categoryDifference !== 0) return categoryDifference;
  return a.name.localeCompare(b.name, "id", { sensitivity: "base" });
}

export function activeFacilityInfo(rows: DbRecord[], table: FacilityOwnerTable): FacilityInfo[] {
  const config = relationConfig[table];
  return rows
    .filter((row) => isTruthyDb(row.aktif) && config.allowedCategories.includes(String(row.kategori ?? "")))
    .map((row) => ({
      id: Number(row.id),
      code: String(row.kode ?? ""),
      name: String(row.nama_fasilitas ?? ""),
      category: String(row.kategori ?? "Umum"),
    }))
    .filter((row) => Number.isSafeInteger(row.id) && row.id > 0 && row.name)
    .sort(sortFacilityInfo);
}

export function facilityInfoForOwner(
  table: FacilityOwnerTable,
  ownerId: number,
  relations: DbRecord[],
  facilityRows: DbRecord[],
): FacilityInfo[] {
  const config = relationConfig[table];
  const facilityMap = new Map(activeFacilityInfo(facilityRows, table).map((facility) => [facility.id, facility]));
  const seen = new Set<number>();
  const resolved: FacilityInfo[] = [];

  for (const relation of relations) {
    if (Number(relation[config.ownerField]) !== ownerId) continue;
    const facilityId = Number(relation.fasilitas_id);
    if (!Number.isSafeInteger(facilityId) || seen.has(facilityId)) continue;
    const facility = facilityMap.get(facilityId);
    if (!facility) continue;
    seen.add(facilityId);
    resolved.push(facility);
  }

  return resolved.sort(sortFacilityInfo);
}

export async function validateFacilityIds(table: FacilityOwnerTable, value: unknown): Promise<number[]> {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) throw new Error("Fasilitas harus berupa daftar pilihan.");
  const requested = [...new Set(value.map((item) => Number(item)).filter((id) => Number.isSafeInteger(id) && id > 0))];
  if (!requested.length) return [];

  const facilities = activeFacilityInfo(await getAll<DbRecord>("master_fasilitas"), table);
  const allowed = new Set(facilities.map((facility) => facility.id));
  const invalid = requested.filter((id) => !allowed.has(id));
  if (invalid.length) {
    throw new Error(`Fasilitas tidak valid atau tidak sesuai kategori: ${invalid.join(", ")}.`);
  }
  return requested;
}

export async function syncFacilityRelations(table: FacilityOwnerTable, ownerId: number, facilityIds: number[]) {
  const config = relationConfig[table];
  const existing = (await getAll<DbRecord>(config.relationTable)).filter((row) => Number(row[config.ownerField]) === ownerId);
  const updates: Record<string, unknown> = {};

  for (const row of existing) {
    const relationKey = row.id !== undefined && row.id !== null
      ? String(row.id)
      : `${ownerId}_${Number(row.fasilitas_id)}`;
    updates[`${config.relationTable}/${relationKey}`] = null;
  }

  for (const fasilitasId of facilityIds) {
    const relationKey = `${ownerId}_${fasilitasId}`;
    updates[`${config.relationTable}/${relationKey}`] = {
      [config.ownerField]: ownerId,
      fasilitas_id: fasilitasId,
      keterangan: null,
    };
  }

  if (Object.keys(updates).length) await multiPathUpdate(updates);
}

export async function deleteFacilityRelations(table: FacilityOwnerTable, ownerId: number) {
  await syncFacilityRelations(table, ownerId, []);
}
