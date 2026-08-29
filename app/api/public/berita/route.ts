import { NextResponse } from "next/server";
import { getPublicNewsList } from "@/lib/public-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getPublicNewsList(1, 6);
    const data = result.items.map(({ isi: _isi, sumber_nama: _sumberNama, foto_keterangan: _fotoKeterangan, ...row }) => row);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Public berita error:", error);
    return NextResponse.json({ message: "Berita belum dapat dimuat saat ini.", data: [] }, { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
