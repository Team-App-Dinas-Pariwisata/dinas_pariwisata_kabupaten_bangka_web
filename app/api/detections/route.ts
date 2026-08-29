import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { getAll, toTime, type DbRecord } from "@/lib/realtime-db";
import { deleteDetectionReportWithImage } from "@/lib/staff-record-cleanup";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requireRequestRole(request, "pengguna"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const rows = await getAll<DbRecord>("laporan_deteksi");
    rows.sort((a, b) => toTime(b.created_at) - toTime(a.created_at));
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Detection monitoring list error:", error);
    return NextResponse.json({ message: "Laporan deteksi gagal dimuat dari Firebase." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireRequestRole(request, "pengguna"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const body = await request.json() as { id?: number | string };
    const id = Number(body.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ message: "ID laporan deteksi tidak valid." }, { status: 400 });
    }

    const result = await deleteDetectionReportWithImage(id);
    return NextResponse.json({
      message: `Laporan deteksi berhasil dihapus. ${result.deletedFiles} foto Cloudflare R2 ikut dihapus.`,
      data: result,
    });
  } catch (error) {
    console.error("Detection monitoring delete error:", error);
    const message = error instanceof Error ? error.message : "Laporan deteksi gagal dihapus.";
    const status = message.includes("tidak ditemukan") ? 404 : 500;
    return NextResponse.json({ message }, { status });
  }
}
