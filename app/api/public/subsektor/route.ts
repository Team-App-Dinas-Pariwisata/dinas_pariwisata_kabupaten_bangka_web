import { NextResponse } from "next/server";
import { getPublicSubsectors } from "@/lib/public-subsectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    const data = await getPublicSubsectors();
    return NextResponse.json({ data }, { headers: noCacheHeaders });
  } catch (error) {
    console.error("Public subsector error:", error);
    return NextResponse.json({ message: "Daftar subsektor belum dapat dimuat." }, { status: 500, headers: noCacheHeaders });
  }
}
