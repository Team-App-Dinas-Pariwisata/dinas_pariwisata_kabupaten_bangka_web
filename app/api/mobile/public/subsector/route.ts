import { NextRequest, NextResponse } from "next/server";
import { getApprovedEkrafBySubsector, getPublicSubsector } from "@/lib/public-subsectors";

export async function GET(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("id"));
  const page = Number(request.nextUrl.searchParams.get("page") || 1);
  const pageSize = Number(request.nextUrl.searchParams.get("pageSize") || 9);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ message: "Subsektor tidak valid." }, { status: 400 });
  }
  try {
    const subsector = await getPublicSubsector(id);
    if (!subsector) return NextResponse.json({ message: "Subsektor tidak ditemukan." }, { status: 404 });
    const result = await getApprovedEkrafBySubsector(id, page, pageSize);
    return NextResponse.json({ data: { subsector, ...result } });
  } catch (error) {
    console.error("Mobile public subsector error:", error);
    return NextResponse.json({ message: "Data subsektor belum dapat dimuat." }, { status: 500 });
  }
}
