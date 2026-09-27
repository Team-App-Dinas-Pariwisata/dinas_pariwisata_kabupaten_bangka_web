import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import {
  deleteImageFromR2,
  getImageFromR2,
  getMobileKeyForOriginal,
  isManagedR2ImageKey,
  keyFromR2StorageReference,
  r2ImageMimeFromKey,
  uploadImageToR2,
} from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rawKey = request.nextUrl.searchParams.get("key")?.trim() || "";
  const variant = (request.nextUrl.searchParams.get("v") || request.nextUrl.searchParams.get("variant"))?.toLowerCase();

  if (!rawKey || !isManagedR2ImageKey(rawKey)) {
    return NextResponse.json({ message: "Gambar tidak ditemukan." }, { status: 404 });
  }

  // Deteksi apakah pemanggil adalah perangkat mobile:
  // 1. Client Hints resmi peramban modern (Sec-CH-UA-Mobile: ?1)
  // 2. User-Agent mobile (smartphone/tablet Android, iPhone, iPad, dll.)
  const secChUaMobile = request.headers.get("sec-ch-ua-mobile");
  const userAgent = request.headers.get("user-agent") || "";
  const isMobileClient = secChUaMobile === "?1" || /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // Klien meminta versi mobile jika:
  // - parameter eksplisit `v=mobile` atau `v=m`, ATAU
  // - perangkat yang mengakses adalah smartphone/mobile (kecuali diminta eksplisit `v=original` / `v=desktop`)
  const wantsMobile =
    variant === "mobile" ||
    variant === "m" ||
    (variant !== "original" && variant !== "desktop" && isMobileClient);

  try {
    let image = null;
    let servedKey = rawKey;

    if (wantsMobile) {
      const mobileKey = getMobileKeyForOriginal(rawKey);
      if (mobileKey) {
        // Coba ambil versi mobile yang sudah dikompresi
        image = await getImageFromR2(mobileKey);
        if (image) {
          servedKey = mobileKey;
        }
      }

      // KETENTUAN PENTING:
      // Jika gambar lama di Cloudflare R2 belum memiliki versi mobile,
      // otomatis gunakan versi asli langsung agar TIDAK error!
      if (!image) {
        image = await getImageFromR2(rawKey);
        servedKey = rawKey;
      }
    } else {
      // Tampilan laptop/desktop: sajikan versi asli tanpa kompresi
      image = await getImageFromR2(rawKey);
      servedKey = rawKey;
    }

    if (!image) {
      return NextResponse.json({ message: "Gambar tidak ditemukan." }, { status: 404 });
    }

    const contentType = image.contentType?.startsWith("image/")
      ? image.contentType
      : r2ImageMimeFromKey(servedKey);

    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
      "Vary": "Sec-CH-UA-Mobile, User-Agent",
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
  if (!(await requireRequestRole(request, "petugas"))) {
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
  if (!(await requireRequestRole(request, "petugas"))) {
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
