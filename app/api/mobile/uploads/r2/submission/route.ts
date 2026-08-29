import { NextRequest, NextResponse } from "next/server";
import { getMobileRequestUser } from "@/lib/mobile-request-user";
import { uploadSubmissionFileToR2, type R2SubmissionType } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validType(value: string): value is R2SubmissionType {
  return value === "ekraf" || value === "sdm" || value === "komunitas";
}

export async function POST(request: NextRequest) {
  const user = await getMobileRequestUser(request);
  if (!user) return NextResponse.json({ message: "Sesi akun tidak valid." }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get("file");
    const type = String(form.get("type") ?? "").trim();
    const field = String(form.get("field") ?? "").trim();
    if (!(file instanceof File) || !file.size || !validType(type) || !field) {
      return NextResponse.json({ message: "File atau tujuan pengajuan tidak valid." }, { status: 400 });
    }
    if (user.role !== "pengaju" && user.role !== "admin" && user.role !== "pengguna") {
      return NextResponse.json({ message: "Akses upload ditolak." }, { status: 403 });
    }

    const result = await uploadSubmissionFileToR2(file, type, field, user.id);
    return NextResponse.json({ message: "File pengajuan berhasil diunggah ke Cloudflare R2.", data: result });
  } catch (error) {
    console.error("Mobile R2 submission upload error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Upload file pengajuan ke Cloudflare R2 gagal." },
      { status: 400 },
    );
  }
}
