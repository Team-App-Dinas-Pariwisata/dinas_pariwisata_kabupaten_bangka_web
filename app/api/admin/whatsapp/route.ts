import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import {
  controlWhatsApp,
  getWhatsAppProvider,
  getWhatsAppStatus,
} from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Service WhatsApp tidak dapat dihubungi.";
}

export async function GET(request: NextRequest) {
  if (!(await requireRequestRole(request, "admin"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const status = await getWhatsAppStatus();
    return NextResponse.json({ status }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { message: errorMessage(error) },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireRequestRole(request, "admin"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    if (getWhatsAppProvider() !== "webjs") {
      return NextResponse.json(
        { message: "Restart dan reset QR hanya tersedia saat provider Node.js dipilih." },
        { status: 409 },
      );
    }

    const body = (await request.json()) as { action?: unknown; confirmation?: unknown };
    if (body.action !== "restart" && body.action !== "reset") {
      return NextResponse.json({ message: "Aksi tidak valid." }, { status: 400 });
    }
    if (body.action === "reset" && body.confirmation !== "RESET") {
      return NextResponse.json(
        { message: "Konfirmasi RESET diperlukan untuk menghapus sesi." },
        { status: 400 },
      );
    }

    const status = await controlWhatsApp(body.action);
    return NextResponse.json({
      message: body.action === "reset"
        ? "Sesi lama dihapus. QR baru sedang disiapkan."
        : "Koneksi WhatsApp sedang dimulai ulang.",
      status,
    }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ message: errorMessage(error) }, { status: 502 });
  }
}
