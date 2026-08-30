import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { deleteSubmissionWithManagedFiles, isSubmissionType } from "@/lib/staff-record-cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !["pengguna", "admin"].includes(user.role)) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const type = body?.type;
    const id = Number(body?.id);
    if (!isSubmissionType(type) || !Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ message: "Pengajuan yang akan dihapus tidak valid." }, { status: 400 });
    }

    const result = await deleteSubmissionWithManagedFiles(type, id);
    if (!result) {
      return NextResponse.json({ message: "Pengajuan tidak ditemukan." }, { status: 404 });
    }

    const message = result.failedFiles
      ? "Pengajuan berhasil dihapus dari MySQL. Sebagian file R2 belum dapat dibersihkan dan sudah dicatat pada log server."
      : "Pengajuan dan file terkait berhasil dihapus permanen.";

    return NextResponse.json({ message, data: result });
  } catch (error) {
    console.error("Mobile submission delete error:", error);
    return NextResponse.json(
      { message: "Pengajuan belum dapat dihapus dari database." },
      { status: 500 },
    );
  }
}
