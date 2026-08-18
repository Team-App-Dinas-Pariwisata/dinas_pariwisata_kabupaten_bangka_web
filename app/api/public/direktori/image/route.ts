import type { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getSubmissionFileFromR2,
  keyFromR2SubmissionStorageReference,
  r2MimeFromKey,
} from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DirectoryType = "ekraf" | "sdm" | "komunitas";

type ImageRow = RowDataPacket & {
  primary_image?: string | null;
  secondary_image?: string | null;
  tertiary_image?: string | null;
};

function validType(value: string | null): value is DirectoryType {
  return value === "ekraf" || value === "sdm" || value === "komunitas";
}

function validId(value: string | null) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

async function approvedImageReferences(type: DirectoryType, id: number) {
  if (type === "ekraf") {
    const [rows] = await db().query<ImageRow[]>(
      `SELECT
         NULLIF(file_logo_usaha, '') AS primary_image,
         NULLIF(file_foto_dokumentasi, '') AS secondary_image,
         NULLIF(file_foto_diri, '') AS tertiary_image
       FROM pengajuan_ekraf
       WHERE id = ? AND status = 'Disetujui'
       LIMIT 1`,
      [id],
    );
    return rows[0] || null;
  }

  if (type === "sdm") {
    const [rows] = await db().query<ImageRow[]>(
      `SELECT NULLIF(file_foto_diri, '') AS primary_image
       FROM pengajuan_sdm_pariwisata
       WHERE id = ?
         AND status_pengajuan = 'Disetujui'
         AND persetujuan_publikasi = 1
       LIMIT 1`,
      [id],
    );
    return rows[0] || null;
  }

  const [rows] = await db().query<ImageRow[]>(
    `SELECT
       NULLIF(file_logo_organisasi, '') AS primary_image,
       NULLIF(file_foto_dokumentasi, '') AS secondary_image
     FROM pengajuan_komunitas_asosiasi
     WHERE id = ?
       AND status_pengajuan = 'Disetujui'
       AND persetujuan_publikasi = 1
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

function firstManagedImageKey(row: ImageRow | null) {
  if (!row) return null;
  const references = [row.primary_image, row.secondary_image, row.tertiary_image];
  for (const reference of references) {
    const key = keyFromR2SubmissionStorageReference(reference);
    if (key) return key;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const typeValue = request.nextUrl.searchParams.get("type");
  const id = validId(request.nextUrl.searchParams.get("id"));

  if (!validType(typeValue) || !id) {
    return NextResponse.json({ message: "Gambar direktori tidak ditemukan." }, { status: 404 });
  }

  try {
    const row = await approvedImageReferences(typeValue, id);
    const key = firstManagedImageKey(row);
    if (!key) {
      return NextResponse.json({ message: "Gambar direktori tidak ditemukan." }, { status: 404 });
    }

    const object = await getSubmissionFileFromR2(key);
    if (!object) {
      return NextResponse.json({ message: "Gambar direktori tidak ditemukan." }, { status: 404 });
    }

    const contentType = object.contentType || r2MimeFromKey(key);
    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ message: "File ini bukan gambar publik." }, { status: 415 });
    }

    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    });

    if (object.etag) headers.set("ETag", `\"${object.etag}\"`);
    if (object.lastModified) headers.set("Last-Modified", object.lastModified.toUTCString());
    if (typeof object.contentLength === "number") {
      headers.set("Content-Length", String(object.contentLength));
    }

    return new NextResponse(object.body, { status: 200, headers });
  } catch (error) {
    console.error("Public directory image error:", error);
    return NextResponse.json(
      { message: "Gambar direktori belum dapat dimuat." },
      { status: 502 },
    );
  }
}
