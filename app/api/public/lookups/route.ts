import type { RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [[subsektor], [kecamatan], [kelurahan], [komunitas]] = await Promise.all([
      db().execute<RowDataPacket[]>("SELECT id value, nama_subsektor label FROM master_subsektor_ekraf WHERE aktif = 1 ORDER BY nama_subsektor"),
      db().execute<RowDataPacket[]>("SELECT id value, nama_kecamatan label FROM master_kecamatan WHERE aktif = 1 ORDER BY nama_kecamatan"),
      db().execute<RowDataPacket[]>("SELECT id value, kecamatan_id, CONCAT(jenis, ' ', nama_kelurahan) label FROM master_kelurahan ORDER BY nama_kelurahan"),
      db().execute<RowDataPacket[]>("SELECT id value, nama_komunitas label FROM master_komunitas WHERE aktif = 1 ORDER BY nama_komunitas"),
    ]);
    return NextResponse.json({ data: { subsektor, kecamatan, kelurahan, komunitas } });
  } catch (error) {
    console.error("Public lookups error:", error);
    return NextResponse.json({ message: "Pilihan data belum dapat dimuat. Periksa koneksi database." }, { status: 500 });
  }
}
