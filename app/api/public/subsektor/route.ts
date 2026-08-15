import { NextResponse } from "next/server";
import { getPublicSubsectors } from "@/lib/public-subsectors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getPublicSubsectors();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Public subsector error:", error);
    return NextResponse.json({ message: "Daftar subsektor belum dapat dimuat." }, { status: 500 });
  }
}
