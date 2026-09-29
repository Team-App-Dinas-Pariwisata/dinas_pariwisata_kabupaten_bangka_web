// app/api/diagnostic/email-env/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      status: "DISABLED",
      message: "Endpoint diagnostik email telah dinonaktifkan demi keamanan sistem.",
    },
    { status: 404 },
  );
}
