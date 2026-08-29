import { NextRequest, NextResponse } from "next/server";
import { getMobileRequestUser } from "@/lib/mobile-request-user";
import { deleteDetectionReportWithImage } from "@/lib/staff-record-cleanup";

export async function DELETE(request: NextRequest) {
  const user = await getMobileRequestUser(request);
  if (!user || !["admin", "pengguna"].includes(user.role)) {
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
    console.error("Mobile detection delete error:", error);
    const message = error instanceof Error ? error.message : "Laporan deteksi gagal dihapus.";
    return NextResponse.json({ message }, { status: message.includes("tidak ditemukan") ? 404 : 500 });
  }
}
