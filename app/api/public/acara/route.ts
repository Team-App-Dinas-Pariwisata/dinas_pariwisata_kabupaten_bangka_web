import { NextResponse } from "next/server";
import { getPublicEventList } from "@/lib/public-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getPublicEventList(1, 6);
    return NextResponse.json({ data: result.items }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Public acara error:", error);
    return NextResponse.json({ message: "Acara belum dapat dimuat saat ini.", data: [] }, { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
