import { getAll, type DbRecord } from "@/lib/realtime-db";
import { sortByOrder } from "@/lib/data-helpers";
import type { ResourceConfig } from "@/lib/resources";

export async function loadResourceRows(config: ResourceConfig) {
  const [rows, kategoriWisata, kategoriKuliner, jenisHotel, kecamatan, statusKonservasi] = await Promise.all([
    getAll<DbRecord>(config.table),
    config.table === "tempat_wisata" ? getAll<DbRecord>("master_kategori_wisata") : Promise.resolve([]),
    config.table === "kuliner" ? getAll<DbRecord>("master_kategori_kuliner") : Promise.resolve([]),
    config.table === "hotel" ? getAll<DbRecord>("master_jenis_hotel") : Promise.resolve([]),
    ["tempat_wisata", "hotel", "kuliner"].includes(config.table) ? getAll<DbRecord>("master_kecamatan") : Promise.resolve([]),
    config.table === "satwa_endemik" ? getAll<DbRecord>("master_status_konservasi") : Promise.resolve([]),
  ]);

  const wisataMap = new Map(kategoriWisata.map((row) => [Number(row.id), row.nama_kategori]));
  const kulinerMap = new Map(kategoriKuliner.map((row) => [Number(row.id), row.nama_kategori]));
  const hotelMap = new Map(jenisHotel.map((row) => [Number(row.id), row.nama_jenis]));
  const kecamatanMap = new Map(kecamatan.map((row) => [Number(row.id), row.nama_kecamatan]));
  const konservasiMap = new Map(statusKonservasi.map((row) => [Number(row.id), `${row.kode ?? ""} - ${row.nama_status ?? ""}`.trim().replace(/^\-\s*/, "")]));

  const enriched = rows.map((row) => {
    const out: DbRecord = { ...row };
    if (config.table === "tempat_wisata") out.kategori_wisata = wisataMap.get(Number(row.kategori_wisata_id)) ?? null;
    if (config.table === "kuliner") out.kategori_kuliner = kulinerMap.get(Number(row.kategori_kuliner_id)) ?? null;
    if (config.table === "hotel") out.jenis_hotel = hotelMap.get(Number(row.jenis_hotel_id)) ?? null;
    if (["tempat_wisata", "hotel", "kuliner"].includes(config.table)) out.kecamatan = kecamatanMap.get(Number(row.kecamatan_id)) ?? null;
    if (config.table === "satwa_endemik") out.status_konservasi = konservasiMap.get(Number(row.status_konservasi_id)) ?? null;
    return out;
  });

  return sortByOrder(enriched, config.orderBy);
}
