import { NextRequest, NextResponse } from "next/server";
import {
  getPublicDirectoryDetail,
  getRelatedPublicDirectory,
  isPublicDirectoryType,
} from "@/lib/public-directory";

export async function GET(request: NextRequest) {
  const type = String(request.nextUrl.searchParams.get("type") || "");
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!isPublicDirectoryType(type) || !Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ message: "Profil direktori tidak valid." }, { status: 400 });
  }
  try {
    const item = await getPublicDirectoryDetail(type, id);
    if (!item) return NextResponse.json({ message: "Profil tidak ditemukan." }, { status: 404 });
    const related = await getRelatedPublicDirectory(type, id, 3);
    return NextResponse.json({ data: { item, related } });
  } catch (error) {
    console.error("Mobile public directory detail error:", error);
    return NextResponse.json({ message: "Profil direktori belum dapat dimuat." }, { status: 500 });
  }
}
