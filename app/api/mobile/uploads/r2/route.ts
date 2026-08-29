import { NextRequest, NextResponse } from "next/server";
import { getMobileRequestUser } from "@/lib/mobile-request-user";
import { uploadImageToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("image");
    const resource = String(form.get("resource") ?? "").trim();
    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ message: "Pilih gambar yang akan diunggah." }, { status: 400 });
    }

    // Laporan deteksi tersedia untuk pengunjung, sama seperti halaman deteksi publik.
    // Resource lain tetap membutuhkan sesi pengguna dari tabel `pengguna`.
    if (resource !== "deteksi") {
      const user = await getMobileRequestUser(request);
      if (!user || !["admin", "pengguna"].includes(user.role)) {
        return NextResponse.json({ message: "Akses upload ditolak." }, { status: 403 });
      }
    }

    const result = await uploadImageToR2(file, resource);
    return NextResponse.json({ message: "File berhasil diunggah ke Cloudflare R2.", data: result });
  } catch (error) {
    console.error("Mobile R2 upload error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Upload Cloudflare R2 gagal." },
      { status: 400 },
    );
  }
}
