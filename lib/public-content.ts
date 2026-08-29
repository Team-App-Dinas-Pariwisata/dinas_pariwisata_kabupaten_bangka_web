import { getAll, isPublishedRecord, isTruthyDb, toTime, type DbRecord } from "@/lib/realtime-db";
import { browserSafeR2ImageUrl } from "@/lib/r2";

export type PublicNewsItem = {
  id: number; slug: string; judul: string; subjudul: string | null; ringkasan: string | null; isi: string;
  penulis_tampil: string | null; sumber_nama: string | null; sumber_url: string | null; foto_utama: string | null;
  foto_keterangan: string | null; foto_alt: string | null; headline: number; tanggal_publikasi: string | null; nama_kategori: string | null;
};

export type PublicEventItem = {
  id: number; slug: string; nama_acara: string; ringkasan: string | null; deskripsi: string; tanggal_mulai: string; tanggal_selesai: string;
  sepanjang_hari: number; status_acara: string; jenis_pelaksanaan: string; nama_lokasi: string | null; alamat: string | null;
  tautan_daring: string | null; penyelenggara: string | null; narahubung_nama: string | null; narahubung_telepon: string | null;
  narahubung_email: string | null; memerlukan_pendaftaran: number; tautan_pendaftaran: string | null; kuota: number | null; gratis: number;
  harga_mulai: number | null; harga_sampai: number | null; syarat_ketentuan: string | null; foto_utama: string | null; foto_alt: string | null;
  unggulan: number; tanggal_publikasi: string | null; nama_kategori: string | null;
};

function normalizePage(page: number) { return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1; }
function textOrNull(value: unknown) { return value == null || String(value).trim() === "" ? null : String(value); }
function numberOrNull(value: unknown) { const n=Number(value); return value == null || value === "" || !Number.isFinite(n) ? null : n; }

async function publicNewsRows(): Promise<PublicNewsItem[]> {
  const [news, categories] = await Promise.all([getAll<DbRecord>("berita"), getAll<DbRecord>("master_kategori_berita")]);
  const categoryMap = new Map(categories.filter((row)=>isTruthyDb(row.aktif)).map((row)=>[Number(row.id), String(row.nama_kategori ?? "")]));
  return news
    .filter((row)=>isPublishedRecord(row) && categoryMap.has(Number(row.kategori_berita_id)))
    .map((row)=>({
      id:Number(row.id), slug:String(row.slug ?? ""), judul:String(row.judul ?? ""), subjudul:textOrNull(row.subjudul), ringkasan:textOrNull(row.ringkasan), isi:String(row.isi ?? ""),
      penulis_tampil:textOrNull(row.penulis_tampil), sumber_nama:textOrNull(row.sumber_nama), sumber_url:textOrNull(row.sumber_url), foto_utama:textOrNull(row.foto_utama),
      foto_keterangan:textOrNull(row.foto_keterangan), foto_alt:textOrNull(row.foto_alt), headline:Number(row.headline ?? 0), tanggal_publikasi:textOrNull(row.tanggal_publikasi),
      nama_kategori:categoryMap.get(Number(row.kategori_berita_id)) ?? null,
    }))
    .sort((a,b)=>b.headline-a.headline || toTime(b.tanggal_publikasi)-toTime(a.tanggal_publikasi) || b.id-a.id);
}

async function publicEventRows(): Promise<PublicEventItem[]> {
  const [events, categories] = await Promise.all([getAll<DbRecord>("acara"), getAll<DbRecord>("master_kategori_acara")]);
  const categoryMap = new Map(categories.filter((row)=>isTruthyDb(row.aktif)).map((row)=>[Number(row.id), String(row.nama_kategori ?? "")]));
  const now = Date.now();
  return events
    .filter((row)=>isPublishedRecord(row, now) && String(row.status_acara ?? "") !== "Dibatalkan" && categoryMap.has(Number(row.kategori_acara_id)))
    .map((row)=>({
      id:Number(row.id), slug:String(row.slug ?? ""), nama_acara:String(row.nama_acara ?? ""), ringkasan:textOrNull(row.ringkasan), deskripsi:String(row.deskripsi ?? ""),
      tanggal_mulai:String(row.tanggal_mulai ?? ""), tanggal_selesai:String(row.tanggal_selesai ?? ""), sepanjang_hari:Number(row.sepanjang_hari ?? 0), status_acara:String(row.status_acara ?? ""),
      jenis_pelaksanaan:String(row.jenis_pelaksanaan ?? ""), nama_lokasi:textOrNull(row.nama_lokasi), alamat:textOrNull(row.alamat), tautan_daring:textOrNull(row.tautan_daring),
      penyelenggara:textOrNull(row.penyelenggara), narahubung_nama:textOrNull(row.narahubung_nama), narahubung_telepon:textOrNull(row.narahubung_telepon), narahubung_email:textOrNull(row.narahubung_email),
      memerlukan_pendaftaran:Number(row.memerlukan_pendaftaran ?? 0), tautan_pendaftaran:textOrNull(row.tautan_pendaftaran), kuota:numberOrNull(row.kuota), gratis:Number(row.gratis ?? 0),
      harga_mulai:numberOrNull(row.harga_mulai), harga_sampai:numberOrNull(row.harga_sampai), syarat_ketentuan:textOrNull(row.syarat_ketentuan), foto_utama:textOrNull(row.foto_utama), foto_alt:textOrNull(row.foto_alt),
      unggulan:Number(row.unggulan ?? 0), tanggal_publikasi:textOrNull(row.tanggal_publikasi), nama_kategori:categoryMap.get(Number(row.kategori_acara_id)) ?? null,
    }))
    .sort((a,b)=>{
      const aUpcoming=toTime(a.tanggal_selesai)>=now?0:1, bUpcoming=toTime(b.tanggal_selesai)>=now?0:1;
      if(aUpcoming!==bUpcoming)return aUpcoming-bUpcoming;
      if(b.unggulan!==a.unggulan)return b.unggulan-a.unggulan;
      if(aUpcoming===0){const diff=toTime(a.tanggal_mulai)-toTime(b.tanggal_mulai);if(diff)return diff;}
      else {const diff=toTime(b.tanggal_mulai)-toTime(a.tanggal_mulai);if(diff)return diff;}
      return b.id-a.id;
    });
}

export async function getPublicNewsList(page = 1, pageSize = 9) {
  const safePage=normalizePage(page), safeSize=Math.min(Math.max(Math.floor(pageSize),1),24), offset=(safePage-1)*safeSize;
  const rows=await publicNewsRows();
  return {items:rows.slice(offset,offset+safeSize).map((row)=>({...row,foto_utama:browserSafeR2ImageUrl(row.foto_utama)})),total:rows.length,page:safePage,pageSize:safeSize,totalPages:Math.max(1,Math.ceil(rows.length/safeSize))};
}

export async function getPublicNewsBySlug(slug: string) {
  const row=(await publicNewsRows()).find((item)=>item.slug===slug);
  return row?{...row,foto_utama:browserSafeR2ImageUrl(row.foto_utama)}:null;
}

export async function getRelatedNews(excludeId: number, limit = 3) {
  const safeLimit=Math.min(Math.max(Math.floor(limit),1),6);
  return (await publicNewsRows()).filter((row)=>row.id!==excludeId).sort((a,b)=>toTime(b.tanggal_publikasi)-toTime(a.tanggal_publikasi)||b.id-a.id).slice(0,safeLimit).map((row)=>({...row,foto_utama:browserSafeR2ImageUrl(row.foto_utama)}));
}

export async function getPublicEventList(page = 1, pageSize = 9) {
  const safePage=normalizePage(page), safeSize=Math.min(Math.max(Math.floor(pageSize),1),24), offset=(safePage-1)*safeSize;
  const rows=await publicEventRows();
  return {items:rows.slice(offset,offset+safeSize).map((row)=>({...row,foto_utama:browserSafeR2ImageUrl(row.foto_utama)})),total:rows.length,page:safePage,pageSize:safeSize,totalPages:Math.max(1,Math.ceil(rows.length/safeSize))};
}

export async function getPublicEventBySlug(slug: string) {
  const row=(await publicEventRows()).find((item)=>item.slug===slug);
  return row?{...row,foto_utama:browserSafeR2ImageUrl(row.foto_utama)}:null;
}

export async function getRelatedEvents(excludeId: number, limit = 3) {
  const safeLimit=Math.min(Math.max(Math.floor(limit),1),6);
  return (await publicEventRows()).filter((row)=>row.id!==excludeId).slice(0,safeLimit).map((row)=>({...row,foto_utama:browserSafeR2ImageUrl(row.foto_utama)}));
}
