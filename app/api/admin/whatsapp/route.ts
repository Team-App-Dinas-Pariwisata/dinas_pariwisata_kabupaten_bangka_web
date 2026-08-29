import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { getWhatsAppStatus, sendWhatsAppMessage } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "FlazHost WhatsApp Gateway tidak dapat dihubungi.";
}

export async function GET(request: NextRequest) {
  if (!(await requireRequestRole(request, "admin"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const status = await getWhatsAppStatus();
    return NextResponse.json(
      { status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { message: errorMessage(error) },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

/** Endpoint admin untuk menguji kirim pesan tanpa mengubah data pengajuan. */
export async function POST(request: NextRequest) {
  if (!(await requireRequestRole(request, "admin"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      action?: unknown;
      phone?: unknown;
      message?: unknown;
    };

    if (body.action !== "test") {
      return NextResponse.json({ message: "Aksi tidak valid." }, { status: 400 });
    }

    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!phone) {
      return NextResponse.json(
        { message: "Nomor WhatsApp tujuan wajib diisi." },
        { status: 400 },
      );
    }
    if (!message) {
      return NextResponse.json(
        { message: "Pesan tes wajib diisi." },
        { status: 400 },
      );
    }
    if (message.length > 5_000) {
      return NextResponse.json(
        { message: "Pesan tes terlalu panjang." },
        { status: 400 },
      );
    }

    const result = await sendWhatsAppMessage(phone, message);
    if (!result.ok) {
      return NextResponse.json(
        {
          message: result.reason,
          code: result.code,
          gatewayStatus: result.status,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      message: "Pesan tes berhasil dikirim melalui FlazHost.",
      messageId: result.messageId || null,
    });
  } catch (error) {
    return NextResponse.json({ message: errorMessage(error) }, { status: 502 });
  }
}
