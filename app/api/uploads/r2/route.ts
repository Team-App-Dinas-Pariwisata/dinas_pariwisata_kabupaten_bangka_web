import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import {
  deleteImageFromR2,
  getImageFromR2,
  isManagedR2ImageKey,
  keyFromR2StorageReference,
  r2ImageMimeFromKey,
  uploadImageToR2,
} from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key")?.trim() || "";
  if (!isManagedR2ImageKey(key)) {
    return NextResponse.json({ message: "Gambar tidak ditemukan." }, { status: 404 });
  }

  try {
    const image = await getImageFromR2(key);
    if (!image) {
      return NextResponse.json({ message: "Gambar tidak ditemukan." }, { status: 404 });
    }

    const contentType = image.contentType?.startsWith("image/")
      ? image.contentType
      : r2ImageMimeFromKey(key);

    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    });

    if (image.etag) headers.set("ETag", `\"${image.etag}\"`);
    if (image.lastModified) headers.set("Last-Modified", image.lastModified.toUTCString());
    if (typeof image.contentLength === "number") headers.set("Content-Length", String(image.contentLength));

    return new NextResponse(image.body, { status: 200, headers });
  } catch (error) {
    console.error("R2 image read error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Gambar R2 belum dapat dimuat." },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireRequestRole(request, "pengguna"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const entry = form.get("image");
    const resource = String(form.get("resource") ?? "").trim();
    if (!(entry instanceof File) || !entry.size) {
      return NextResponse.json({ message: "Pilih gambar yang akan diunggah." }, { status: 400 });
    }

    const result = await uploadImageToR2(entry, resource);
    return NextResponse.json(
      { message: "Gambar berhasil diunggah ke Cloudflare R2.", data: result },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } },
    );
  } catch (error) {
    console.error("R2 upload error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Upload gambar ke Cloudflare R2 gagal." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireRequestRole(request, "pengguna"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { key?: string; url?: string };
    const key = body.key && isManagedR2ImageKey(body.key) ? body.key : keyFromR2StorageReference(body.url);
    if (!key) {
      return NextResponse.json({ message: "Object R2 tidak dikelola oleh aplikasi." }, { status: 400 });
    }

    await deleteImageFromR2(key);
    return NextResponse.json({ message: "Gambar R2 berhasil dihapus." });
  } catch (error) {
    console.error("R2 delete error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Gambar R2 gagal dihapus." },
      { status: 400 },
    );
  }
}
