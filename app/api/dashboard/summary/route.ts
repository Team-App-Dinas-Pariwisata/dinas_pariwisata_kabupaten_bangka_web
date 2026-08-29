import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { getAll, toTime, type DbRecord } from "@/lib/realtime-db";

type RecentRow = { id:number; jenis:"ekraf"|"sdm"|"komunitas"; no_registrasi:string|null; nama:string; detail:string; status:string; created_at:string };

function submissionStats(rows: DbRecord[], statusField: string) {
  const statuses = rows.map((row) => String(row[statusField] ?? "Menunggu"));
  return {
    total: rows.length,
    menunggu: statuses.filter((status) => ["Menunggu","Perlu Perbaikan"].includes(status)).length,
    disetujui: statuses.filter((status) => status === "Disetujui").length,
    ditolak: statuses.filter((status) => status === "Ditolak").length,
  };
}

export async function GET(request: NextRequest) {
  if (!(await requireRequestRole(request, "pengguna"))) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const [ekrafRows, sdmRows, communityRows, beritaRows, acaraRows] = await Promise.all([
      getAll("pengajuan_ekraf"), getAll("pengajuan_sdm_pariwisata"), getAll("pengajuan_komunitas_asosiasi"), getAll("berita"), getAll("acara"),
    ]);
    const ekraf = submissionStats(ekrafRows, "status");
    const sdm = submissionStats(sdmRows, "status_pengajuan");
    const komunitas = submissionStats(communityRows, "status_pengajuan");

    const recent: RecentRow[] = [
      ...ekrafRows.filter((row)=>["Menunggu","Perlu Perbaikan"].includes(String(row.status ?? "Menunggu"))).map((row)=>({id:Number(row.id),jenis:"ekraf" as const,no_registrasi:row.no_registrasi?String(row.no_registrasi):null,nama:String(row.nama_lengkap ?? ""),detail:String(row.nama_usaha ?? ""),status:String(row.status ?? "Menunggu"),created_at:String(row.created_at ?? "")})),
      ...sdmRows.filter((row)=>["Menunggu","Perlu Perbaikan"].includes(String(row.status_pengajuan ?? "Menunggu"))).map((row)=>({id:Number(row.id),jenis:"sdm" as const,no_registrasi:row.no_registrasi?String(row.no_registrasi):null,nama:String(row.nama_lengkap ?? ""),detail:String(row.tempat_bertugas ?? ""),status:String(row.status_pengajuan ?? "Menunggu"),created_at:String(row.created_at ?? "")})),
      ...communityRows.filter((row)=>["Menunggu","Perlu Perbaikan"].includes(String(row.status_pengajuan ?? "Menunggu"))).map((row)=>({id:Number(row.id),jenis:"komunitas" as const,no_registrasi:row.no_registrasi?String(row.no_registrasi):null,nama:String(row.nama_organisasi ?? ""),detail:String(row.kategori ?? ""),status:String(row.status_pengajuan ?? "Menunggu"),created_at:String(row.created_at ?? "")})),
    ].sort((a,b)=>toTime(b.created_at)-toTime(a.created_at)).slice(0,8);

    return NextResponse.json({ data: {
      total: ekraf.total + sdm.total + komunitas.total,
      menunggu: ekraf.menunggu + sdm.menunggu + komunitas.menunggu,
      disetujui: ekraf.disetujui + sdm.disetujui + komunitas.disetujui,
      ditolak: ekraf.ditolak + sdm.ditolak + komunitas.ditolak,
      ekraf: ekraf.total, sdm: sdm.total, komunitas: komunitas.total,
      berita: beritaRows.length, acara: acaraRows.length, recent,
    }});
  } catch (error) {
    console.error("[dashboard/summary]", error);
    const detail = error instanceof Error ? error.message : "Unknown Firebase error";
    return NextResponse.json({ message: "Ringkasan dashboard gagal dimuat dari Firebase Realtime Database.", ...(process.env.NODE_ENV !== "production" ? {detail}: {}) }, { status:500 });
  }
}
