import { NextRequest, NextResponse } from "next/server";
import { getMobileRequestUser } from "@/lib/mobile-request-user";
import { deleteSubmissionWithFiles } from "@/lib/staff-record-cleanup";
import type { SubmissionType } from "@/lib/submission-config";

function validType(value: string): value is SubmissionType {
  return value === "ekraf" || value === "sdm" || value === "komunitas";
}

export async function DELETE(request: NextRequest) {
  const user = await getMobileRequestUser(request);
  if (!user || !["admin", "pengguna"].includes(user.role)) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const body = await request.json() as { type?: string; id?: number | string };
    const type = String(body.type ?? "");
    const id = Number(body.id);
    if (!validType(type) || !Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ message: "Jenis atau ID pengajuan tidak valid." }, { status: 400 });
    }
    const result = await deleteSubmissionWithFiles(type, id);
    return NextResponse.json({
      message: `Pengajuan berhasil dihapus. ${result.deletedFiles} file Cloudflare R2 ikut dihapus.`,
      data: result,
    });
  } catch (error) {
    console.error("Mobile submission delete error:", error);
    const message = error instanceof Error ? error.message : "Pengajuan gagal dihapus.";
    return NextResponse.json({ message }, { status: message.includes("tidak ditemukan") ? 404 : 500 });
  }
}
