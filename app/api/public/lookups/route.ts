import { NextResponse } from "next/server";
import { getAll, isTruthyDb, type DbRecord } from "@/lib/realtime-db";

function active(rows: DbRecord[]) { return rows.filter((row) => isTruthyDb(row.aktif)); }
function alpha(a: unknown, b: unknown) { return String(a ?? "").localeCompare(String(b ?? ""), "id", { sensitivity:"base" }); }

export async function GET() {
  try {
    const [subsektorRaw, kecamatanRaw, kelurahanRaw, komunitasRaw] = await Promise.all([
      getAll("master_subsektor_ekraf"), getAll("master_kecamatan"), getAll("master_kelurahan"), getAll("master_komunitas"),
    ]);
    const subsektor = active(subsektorRaw).sort((a,b)=>alpha(a.nama_subsektor,b.nama_subsektor)).map((r)=>({value:Number(r.id),label:r.nama_subsektor}));
    const kecamatan = active(kecamatanRaw).sort((a,b)=>alpha(a.nama_kecamatan,b.nama_kecamatan)).map((r)=>({value:Number(r.id),label:r.nama_kecamatan}));
    const kelurahan = [...kelurahanRaw].sort((a,b)=>alpha(a.nama_kelurahan,b.nama_kelurahan)).map((r)=>({value:Number(r.id),kecamatan_id:Number(r.kecamatan_id),label:`${r.jenis ?? ""} ${r.nama_kelurahan ?? ""}`.trim()}));
    const komunitas = active(komunitasRaw).sort((a,b)=>alpha(a.nama_komunitas,b.nama_komunitas)).map((r)=>({value:Number(r.id),label:r.nama_komunitas}));
    return NextResponse.json({ data: { subsektor, kecamatan, kelurahan, komunitas } });
  } catch (error) {
    console.error("Public lookups error:", error);
    return NextResponse.json({ message: "Pilihan data belum dapat dimuat. Periksa koneksi Firebase Realtime Database." }, { status: 500 });
  }
}
