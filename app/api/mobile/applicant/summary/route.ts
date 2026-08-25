import type { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { db } from "@/lib/db";
type Row = RowDataPacket & {id:number;no_registrasi:string|null;status_label:string|null;title_label:string|null;created_at:string};
const editable=(s:string)=>["Menunggu","Perlu Perbaikan","Ditolak"].includes(s);
export async function GET(request:NextRequest){
 const user=await requireRequestRole(request,"pengaju");if(!user)return NextResponse.json({message:"Sesi akun pengaju tidak valid."},{status:401});
 try{
  const [e,s,k]=await Promise.all([
   db().execute<Row[]>("SELECT id,no_registrasi,COALESCE(status,'Menunggu') status_label,nama_usaha title_label,created_at FROM pengajuan_ekraf WHERE created_by=? ORDER BY created_at DESC",[user.id]),
   db().execute<Row[]>("SELECT id,no_registrasi,COALESCE(status_pengajuan,'Menunggu') status_label,COALESCE(tempat_bertugas,nama_lengkap) title_label,created_at FROM pengajuan_sdm_pariwisata WHERE created_by=? ORDER BY created_at DESC",[user.id]),
   db().execute<Row[]>("SELECT id,no_registrasi,COALESCE(status_pengajuan,'Menunggu') status_label,nama_organisasi title_label,created_at FROM pengajuan_komunitas_asosiasi WHERE created_by=? ORDER BY created_at DESC",[user.id]),
  ]);
  const map=(rows:Row[],type:"ekraf"|"sdm"|"komunitas",typeLabel:string)=>rows.map(r=>{const status=r.status_label||"Menunggu";return{id:r.id,type,typeLabel,title:r.title_label||"Pengajuan",noRegistrasi:r.no_registrasi||"—",status,createdAt:r.created_at,canEdit:editable(status)}});
  const items=[...map(e[0],"ekraf","Pelaku Ekraf"),...map(s[0],"sdm","SDM Pariwisata"),...map(k[0],"komunitas","Komunitas")].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  return NextResponse.json({data:{total:items.length,pending:items.filter(x=>["Menunggu","Perlu Perbaikan"].includes(x.status)).length,approved:items.filter(x=>x.status==="Disetujui").length,items}});
 }catch(error){console.error("mobile applicant summary",error);return NextResponse.json({message:"Riwayat pengajuan belum dapat dimuat."},{status:500});}
}
