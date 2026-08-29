import { NextResponse } from "next/server";
import { getAll, isTruthyDb, type DbRecord } from "@/lib/realtime-db";
export const runtime="nodejs";
export async function GET(){
 try{
  const [kecamatanRaw,subsektorRaw,ekraf]=await Promise.all([getAll<DbRecord>("master_kecamatan"),getAll<DbRecord>("master_subsektor_ekraf"),getAll<DbRecord>("pengajuan_ekraf")]);
  const approved=ekraf.filter((p)=>String(p.status??"")==="Disetujui");
  const kecamatan=kecamatanRaw.filter((k)=>isTruthyDb(k.aktif)).map((k)=>({id:Number(k.id),label:String(k.nama_kecamatan??""),total:approved.filter((p)=>Number(p.kecamatan_usaha_id??p.kecamatan_id)===Number(k.id)).length})).sort((a,b)=>b.total-a.total||a.label.localeCompare(b.label,"id"));
  const subsektor=subsektorRaw.filter((s)=>isTruthyDb(s.aktif)).map((s)=>({id:Number(s.id),label:String(s.nama_subsektor??""),total:approved.filter((p)=>Number(p.subsektor_id)===Number(s.id)).length})).sort((a,b)=>b.total-a.total||a.label.localeCompare(b.label,"id"));
  return NextResponse.json({total:approved.length,kecamatan,subsektor});
 }catch(error){console.error("Public ekraf statistics error:",error);return NextResponse.json({message:"Statistik Pelaku Ekraf belum dapat dimuat."},{status:500});}
}
