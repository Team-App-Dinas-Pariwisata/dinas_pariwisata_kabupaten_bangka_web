import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import {
  applicantOwnsR2SubmissionKey,
  getSubmissionFileFromR2,
  isManagedR2SubmissionKey,
  r2MimeFromKey,
} from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key")?.trim() || "";
  if (!isManagedR2SubmissionKey(key)) {
    return NextResponse.json({ message: "File pengajuan tidak ditemukan." }, { status: 404 });
  }

  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ message: "Silakan masuk untuk mengakses file pengajuan." }, { status: 401 });
  }

  const isStaff = user.role === "admin" || user.role === "pengguna";
  const isOwner = user.role === "pengaju" && applicantOwnsR2SubmissionKey(key, user.id);
  if (!isStaff && !isOwner) {
    return NextResponse.json({ message: "Anda tidak memiliki akses ke file pengajuan ini." }, { status: 403 });
  }

  try {
    const object = await getSubmissionFileFromR2(key);
    if (!object) {
      return NextResponse.json({ message: "File pengajuan tidak ditemukan." }, { status: 404 });
    }

    const contentType = object.contentType || r2MimeFromKey(key);
    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    });

    if (object.etag) headers.set("ETag", `\"${object.etag}\"`);
    if (object.lastModified) headers.set("Last-Modified", object.lastModified.toUTCString());
    if (typeof object.contentLength === "number") headers.set("Content-Length", String(object.contentLength));

    return new NextResponse(object.body, { status: 200, headers });
  } catch (error) {
    console.error("R2 submission file read error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "File pengajuan di Cloudflare R2 belum dapat dimuat." },
      { status: 502 },
    );
  }
}
