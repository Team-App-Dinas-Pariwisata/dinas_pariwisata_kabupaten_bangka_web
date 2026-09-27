// app/api/diagnostic/db/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      status: "DISABLED",
      message: "Endpoint diagnostik database telah dinonaktifkan demi keamanan sistem.",
    },
    { status: 404 },
  );
}
