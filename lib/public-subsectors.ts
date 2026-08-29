import { getAll, getById, isTruthyDb, toTime, type DbRecord } from "@/lib/realtime-db";
import { keyFromR2SubmissionStorageReference } from "@/lib/r2";

export type PublicSubsector = { id:number; kode:string; nama_subsektor:string; deskripsi:string|null; pelaku_count:number };
export type PublicEkrafCard = { id:number; title:string; subtitle:string|null; category:string|null; location:string|null; description:string|null; image:string|null; unggulan:number };

function exposeEkrafImage(item: PublicEkrafCard): PublicEkrafCard {
  if (!item.image) return item;
  const managedKey=keyFromR2SubmissionStorageReference(item.image);
  if (!managedKey) return item;
  return {...item,image:`/api/public/direktori/image?type=ekraf&id=${encodeURIComponent(String(item.id))}`};
}
function text(value: unknown){return value==null||String(value).trim()===""?null:String(value)}

export async function getPublicSubsectors(): Promise<PublicSubsector[]> {
  const [subsectors, ekraf] = await Promise.all([getAll<DbRecord>("master_subsektor_ekraf"),getAll<DbRecord>("pengajuan_ekraf")]);
  return subsectors.filter((row)=>isTruthyDb(row.aktif)).sort((a,b)=>Number(a.id)-Number(b.id)).map((row)=>({
    id:Number(row.id),kode:String(row.kode??""),nama_subsektor:String(row.nama_subsektor??""),deskripsi:text(row.deskripsi),
    pelaku_count:ekraf.filter((p)=>String(p.status??"")==="Disetujui"&&Number(p.subsektor_id)===Number(row.id)).length,
  }));
}

export async function getPublicSubsector(id:number):Promise<PublicSubsector|null>{
  const row=await getById<DbRecord>("master_subsektor_ekraf",id);if(!row||!isTruthyDb(row.aktif))return null;
  const ekraf=await getAll<DbRecord>("pengajuan_ekraf");
  return {id:Number(row.id),kode:String(row.kode??""),nama_subsektor:String(row.nama_subsektor??""),deskripsi:text(row.deskripsi),pelaku_count:ekraf.filter((p)=>String(p.status??"")==="Disetujui"&&Number(p.subsektor_id)===id).length};
}

export async function getApprovedEkrafBySubsector(subsectorId:number,requestedPage=1,perPage=9){
  const safePerPage=Math.min(24,Math.max(1,Math.floor(perPage)));
  const [all,subsectors,kecamatans,kelurahans]=await Promise.all([getAll<DbRecord>("pengajuan_ekraf"),getAll<DbRecord>("master_subsektor_ekraf"),getAll<DbRecord>("master_kecamatan"),getAll<DbRecord>("master_kelurahan")]);
  const subMap=new Map(subsectors.map(r=>[Number(r.id),String(r.nama_subsektor??"")])), kecMap=new Map(kecamatans.map(r=>[Number(r.id),String(r.nama_kecamatan??"")])), kelMap=new Map(kelurahans.map(r=>[Number(r.id),String(r.nama_kelurahan??"")]));
  const rows=all.filter((p)=>String(p.status??"")==="Disetujui"&&Number(p.subsektor_id)===subsectorId).sort((a,b)=>Number(b.unggulan??0)-Number(a.unggulan??0)||toTime(b.tanggal_verifikasi)-toTime(a.tanggal_verifikasi)||toTime(b.updated_at)-toTime(a.updated_at)||Number(b.id)-Number(a.id));
  const total=rows.length,totalPages=Math.max(1,Math.ceil(total/safePerPage)),page=Math.min(totalPages,Math.max(1,Math.floor(requestedPage))),offset=(page-1)*safePerPage;
  const items=rows.slice(offset,offset+safePerPage).map((row)=>exposeEkrafImage({
    id:Number(row.id),title:String(text(row.nama_merek)??text(row.nama_usaha)??row.nama_lengkap??"Pelaku Ekraf"),subtitle:text(row.nama_lengkap),category:subMap.get(Number(row.subsektor_id))??null,
    location:kelMap.get(Number(row.kelurahan_usaha_id))??kecMap.get(Number(row.kecamatan_usaha_id))??text(row.alamat_usaha),description:text(row.deskripsi_usaha)??text(row.produk_jasa),
    image:text(row.file_logo_usaha)??text(row.file_foto_dokumentasi)??text(row.file_foto_diri),unggulan:Number(row.unggulan??0),
  }));
  return {items,total,page,perPage:safePerPage,totalPages};
}
