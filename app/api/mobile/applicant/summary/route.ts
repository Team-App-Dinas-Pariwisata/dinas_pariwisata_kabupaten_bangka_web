import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { getAll, toTime, type DbRecord } from "@/lib/realtime-db";
const editable=(s:string)=>["Menunggu","Perlu Perbaikan","Ditolak"].includes(s);
export async function GET(request:NextRequest){
 const user=await requireRequestRole(request,"pengaju");if(!user)return NextResponse.json({message:"Sesi akun pengaju tidak valid."},{status:401});
 try{
  const [e,s,k]=await Promise.all([getAll("pengajuan_ekraf"),getAll("pengajuan_sdm_pariwisata"),getAll("pengajuan_komunitas_asosiasi")]);
  const own=(rows:DbRecord[])=>rows.filter(r=>Number(r.created_by)===user.id);
  const map=(rows:DbRecord[],type:"ekraf"|"sdm"|"komunitas",typeLabel:string,statusField:string,title:(r:DbRecord)=>unknown)=>own(rows).map(r=>{const status=String(r[statusField]??"Menunggu");return{id:Number(r.id),type,typeLabel,title:String(title(r)??"Pengajuan"),noRegistrasi:String(r.no_registrasi??"—"),status,createdAt:String(r.created_at??""),canEdit:editable(status)}});
  const items=[...map(e,"ekraf","Pelaku Ekraf","status",r=>r.nama_usaha),...map(s,"sdm","SDM Pariwisata","status_pengajuan",r=>r.tempat_bertugas??r.nama_lengkap),...map(k,"komunitas","Komunitas","status_pengajuan",r=>r.nama_organisasi)].sort((a,b)=>toTime(b.createdAt)-toTime(a.createdAt));
  return NextResponse.json({data:{total:items.length,pending:items.filter(x=>["Menunggu","Perlu Perbaikan"].includes(x.status)).length,approved:items.filter(x=>x.status==="Disetujui").length,items}});
 }catch(error){console.error("mobile applicant summary",error);return NextResponse.json({message:"Riwayat pengajuan belum dapat dimuat."},{status:500});}
}
