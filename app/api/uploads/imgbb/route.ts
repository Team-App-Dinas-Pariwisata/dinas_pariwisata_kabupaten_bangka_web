import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { uploadImageToImgBB } from "@/lib/imgbb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await requireRequestRole(request, "pengguna"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const entry = form.get("image");
    if (!(entry instanceof File) || !entry.size) {
      return NextResponse.json({ message: "Pilih gambar yang akan diunggah." }, { status: 400 });
    }

    const result = await uploadImageToImgBB(entry);

    return NextResponse.json(
      {
        message: "Gambar berhasil diunggah. Database akan menyimpan URL viewer ImgBB.",
        data: {
          ...result,
          storageUrl: result.viewerUrl,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("ImgBB upload error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Upload gambar ke ImgBB gagal." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
