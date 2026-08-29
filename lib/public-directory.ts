import { containsText } from "@/lib/data-helpers";
import { getAll, getById, isTruthyDb, toTime, type DbRecord } from "@/lib/realtime-db";
import { keyFromR2SubmissionStorageReference } from "@/lib/r2";

export type PublicDirectoryType = "ekraf" | "sdm" | "komunitas";

export type PublicDirectoryDetail = {
  id:number; type:PublicDirectoryType; title:string; subtitle:string|null; category:string|null; location:string|null; description:string|null; image:string|null; unggulan:number;
  registration_number:string|null; address:string|null; latitude:number|null; longitude:number|null; updated_at:string|null;
  year_started:number|null; employee_count:number|null; products_services:string|null; vision:string|null; mission:string|null; achievements:string|null; trainings:string|null;
  exhibitions:string|null; social_media:string|null; website:string|null; shopee:string|null;
  role:string|null; workplace:string|null; workplace_address:string|null; start_month:number|null; start_year:number|null;
  organization_kind:string|null; legal_status:string|null; legal_number:string|null; chairman:string|null; vision_mission:string|null;
};

export const publicDirectoryMeta: Record<PublicDirectoryType,{label:string;eyebrow:string;description:string}> = {
  ekraf:{label:"Pelaku Ekraf",eyebrow:"Direktori Ekonomi Kreatif",description:"Profil pelaku ekonomi kreatif Kabupaten Bangka yang telah disetujui dan terverifikasi."},
  sdm:{label:"SDM Pariwisata",eyebrow:"Direktori SDM Pariwisata",description:"Profil sumber daya manusia pariwisata Kabupaten Bangka yang telah disetujui untuk dipublikasikan."},
  komunitas:{label:"Komunitas / Asosiasi",eyebrow:"Direktori Komunitas",description:"Profil komunitas, lembaga, dan asosiasi yang telah disetujui untuk dipublikasikan."},
};

export function isPublicDirectoryType(value:string):value is PublicDirectoryType{return value==="ekraf"||value==="sdm"||value==="komunitas"}
function txt(v:unknown){return v==null||String(v).trim()===""?null:String(v)}
function num(v:unknown){const n=Number(v);return v==null||v===""||!Number.isFinite(n)?null:n}
function publicImage(type:PublicDirectoryType,id:number,reference:string|null){if(!reference)return null;const managed=keyFromR2SubmissionStorageReference(reference);return managed?`/api/public/direktori/image?type=${encodeURIComponent(type)}&id=${encodeURIComponent(String(id))}`:reference}
function joinedLocation(...values:unknown[]){const parts=values.map(txt).filter((v):v is string=>Boolean(v));return parts.length?parts.join(", "):null}

async function maps(){
 const [subsectors,kecamatan,kelurahan]=await Promise.all([getAll<DbRecord>("master_subsektor_ekraf"),getAll<DbRecord>("master_kecamatan"),getAll<DbRecord>("master_kelurahan")]);
 return {sub:new Map(subsectors.map(r=>[Number(r.id),String(r.nama_subsektor??"")])),kec:new Map(kecamatan.map(r=>[Number(r.id),String(r.nama_kecamatan??"")])),kel:new Map(kelurahan.map(r=>[Number(r.id),String(r.nama_kelurahan??"")]))};
}

function nullBusiness(){return {year_started:null,employee_count:null,products_services:null,vision:null,mission:null,achievements:null,trainings:null,exhibitions:null,social_media:null,website:null,shopee:null}}
function nullSdm(){return {role:null,workplace:null,workplace_address:null,start_month:null,start_year:null}}
function nullCommunity(){return {organization_kind:null,legal_status:null,legal_number:null,chairman:null,vision_mission:null}}

async function buildType(type:PublicDirectoryType):Promise<PublicDirectoryDetail[]> {
 const m=await maps();
 if(type==="ekraf"){
  const rows=await getAll<DbRecord>("pengajuan_ekraf");
  return rows.filter(r=>String(r.status??"")==="Disetujui").map(r=>{
   const id=Number(r.id),image=txt(r.file_logo_usaha)??txt(r.file_foto_dokumentasi)??txt(r.file_foto_diri);
   return {id,type,title:String(txt(r.nama_merek)??txt(r.nama_usaha)??r.nama_lengkap??"Pelaku Ekraf"),subtitle:txt(r.nama_lengkap),category:m.sub.get(Number(r.subsektor_id))??null,
    location:joinedLocation(m.kel.get(Number(r.kelurahan_usaha_id)),m.kec.get(Number(r.kecamatan_usaha_id)))??txt(r.alamat_usaha),description:txt(r.deskripsi_usaha)??txt(r.produk_jasa),image:publicImage(type,id,image),unggulan:Number(r.unggulan??0),
    registration_number:txt(r.no_registrasi),address:txt(r.alamat_usaha),latitude:num(r.latitude),longitude:num(r.longitude),updated_at:txt(r.updated_at),
    year_started:num(r.tahun_mulai_usaha??r.tahun_berdiri),employee_count:num(r.jumlah_tenaga_kerja),products_services:txt(r.produk_jasa),vision:txt(r.visi_usaha),mission:txt(r.misi_usaha),achievements:txt(r.prestasi),
    trainings:txt(r.pelatihan),exhibitions:txt(r.pameran),social_media:txt(r.media_sosial),website:txt(r.website),shopee:txt(r.link_shopee),...nullSdm(),...nullCommunity()};
  }).sort((a,b)=>b.unggulan-a.unggulan||toTime(b.updated_at)-toTime(a.updated_at)||b.id-a.id);
 }
 if(type==="sdm"){
  const rows=await getAll<DbRecord>("pengajuan_sdm_pariwisata");
  return rows.filter(r=>String(r.status_pengajuan??"")==="Disetujui"&&isTruthyDb(r.persetujuan_publikasi)).map(r=>{const id=Number(r.id);return {
   id,type,title:String(r.nama_lengkap??"SDM Pariwisata"),subtitle:txt(r.jabatan),category:"SDM Pariwisata",location:txt(r.tempat_bertugas),
   description:r.jabatan&&r.tempat_bertugas?`Bertugas sebagai ${r.jabatan} di ${r.tempat_bertugas}.`:txt(r.tempat_bertugas),image:publicImage(type,id,txt(r.file_foto_diri)),unggulan:0,
   registration_number:txt(r.no_registrasi),address:txt(r.alamat_bertugas),latitude:null,longitude:null,updated_at:txt(r.updated_at),...nullBusiness(),role:txt(r.jabatan),workplace:txt(r.tempat_bertugas),
   workplace_address:txt(r.alamat_bertugas),start_month:num(r.bulan_mulai_bertugas),start_year:num(r.tahun_mulai_bertugas),...nullCommunity()};
  }).sort((a,b)=>toTime(b.updated_at)-toTime(a.updated_at)||b.id-a.id);
 }
 const rows=await getAll<DbRecord>("pengajuan_komunitas_asosiasi");
 return rows.filter(r=>String(r.status_pengajuan??"")==="Disetujui"&&isTruthyDb(r.persetujuan_publikasi)).map(r=>{const id=Number(r.id);return {
  id,type,title:String(r.nama_organisasi??"Komunitas"),subtitle:txt(r.kategori),category:m.sub.get(Number(r.subsektor_id))??txt(r.kategori),location:joinedLocation(m.kel.get(Number(r.kelurahan_id)),m.kec.get(Number(r.kecamatan_id))),
  description:txt(r.rincian),image:publicImage(type,id,txt(r.file_logo_organisasi)??txt(r.file_foto_dokumentasi)),unggulan:0,registration_number:txt(r.no_registrasi),address:txt(r.alamat),latitude:num(r.latitude),longitude:num(r.longitude),updated_at:txt(r.updated_at),
  ...nullBusiness(),...nullSdm(),organization_kind:txt(r.kategori),legal_status:txt(r.status_badan_hukum),legal_number:txt(r.nomor_akta),chairman:txt(r.nama_ketua),vision_mission:txt(r.visi_misi)};
 }).sort((a,b)=>toTime(b.updated_at)-toTime(a.updated_at)||b.id-a.id);
}

export async function getPublicDirectoryDetail(type:PublicDirectoryType,id:number){if(!Number.isSafeInteger(id)||id<=0)return null;return (await buildType(type)).find(r=>r.id===id)??null}
export async function getRelatedPublicDirectory(type:PublicDirectoryType,excludeId:number,limit=3){const safe=Math.min(Math.max(Math.floor(limit),1),6);return (await buildType(type)).filter(r=>r.id!==excludeId).slice(0,safe)}

export async function getPublicDirectoryList(options:{type?:PublicDirectoryType|null;query?:string;featuredOnly?:boolean;limit?:number}={}){
 const query=String(options.query??"").trim().slice(0,100), featured=Boolean(options.featuredOnly), limit=Math.min(60,Math.max(1,Math.floor(options.limit??24)));
 const types=options.type?[options.type]:(["ekraf","sdm","komunitas"] as PublicDirectoryType[]);
 const groups=await Promise.all(types.map(t=>featured&&t!=="ekraf"?Promise.resolve([]):buildType(t)));
 const rows=groups.flat().filter(item=>(!featured||item.unggulan===1)&&containsText([item.title,item.subtitle,item.category,item.location,item.description,item.products_services],query));
 return rows.sort((a,b)=>b.unggulan-a.unggulan||toTime(b.updated_at)-toTime(a.updated_at)||b.id-a.id).slice(0,limit);
}

export async function getApprovedDirectoryImageReferences(type:PublicDirectoryType,id:number){
 const table=type==="ekraf"?"pengajuan_ekraf":type==="sdm"?"pengajuan_sdm_pariwisata":"pengajuan_komunitas_asosiasi";
 const row=await getById<DbRecord>(table,id);if(!row)return null;
 if(type==="ekraf"&&String(row.status??"")!=="Disetujui")return null;
 if(type!=="ekraf"&&(String(row.status_pengajuan??"")!=="Disetujui"||!isTruthyDb(row.persetujuan_publikasi)))return null;
 if(type==="ekraf")return [txt(row.file_logo_usaha),txt(row.file_foto_dokumentasi),txt(row.file_foto_diri)];
 if(type==="sdm")return [txt(row.file_foto_diri)];
 return [txt(row.file_logo_organisasi),txt(row.file_foto_dokumentasi)];
}
