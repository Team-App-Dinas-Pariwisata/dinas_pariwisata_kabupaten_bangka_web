import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import {
  buildWhatsAppChatUrl,
  getChatWhatsAppConfig,
  isPetugasMassDeleteEnabled,
  setChatWhatsAppConfig,
  setPetugasMassDeleteEnabled,
} from "@/lib/system-settings";

export async function GET(request: NextRequest) {
  if (!(await requireRequestRole(request, "admin"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const [petugasMassDeleteEnabled, chatWhatsApp] = await Promise.all([
      isPetugasMassDeleteEnabled(),
      getChatWhatsAppConfig(),
    ]);

    const previewUrl = chatWhatsApp.number
      ? buildWhatsAppChatUrl(chatWhatsApp.number, chatWhatsApp.message)
      : null;

    return NextResponse.json({
      data: {
        petugas_mass_delete_enabled: petugasMassDeleteEnabled,
        chat_whatsapp_number: chatWhatsApp.number,
        chat_whatsapp_message: chatWhatsApp.message,
        chat_whatsapp_enabled: chatWhatsApp.enabled,
        chat_whatsapp_preview_url: previewUrl,
      },
    });
  } catch (error) {
    console.error("[api/admin/settings] GET error:", error);
    return NextResponse.json({ message: "Gagal memuat pengaturan sistem." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await requireRequestRole(request, "admin"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const body = await request.json();
    let updatedAnything = false;

    if (typeof body.petugas_mass_delete_enabled === "boolean") {
      await setPetugasMassDeleteEnabled(body.petugas_mass_delete_enabled);
      updatedAnything = true;
    }

    if (
      body.chat_whatsapp_number !== undefined ||
      body.chat_whatsapp_message !== undefined ||
      body.chat_whatsapp_enabled !== undefined
    ) {
      await setChatWhatsAppConfig({
        number: typeof body.chat_whatsapp_number === "string" ? body.chat_whatsapp_number : undefined,
        message: typeof body.chat_whatsapp_message === "string" ? body.chat_whatsapp_message : undefined,
        enabled: typeof body.chat_whatsapp_enabled === "boolean" ? body.chat_whatsapp_enabled : undefined,
      });
      updatedAnything = true;
    }

    if (!updatedAnything) {
      return NextResponse.json(
        { message: "Tidak ada parameter pengaturan yang dikirim untuk diperbarui." },
        { status: 400 },
      );
    }

    const [updatedStatus, chatWhatsApp] = await Promise.all([
      isPetugasMassDeleteEnabled(),
      getChatWhatsAppConfig(),
    ]);

    const previewUrl = chatWhatsApp.number
      ? buildWhatsAppChatUrl(chatWhatsApp.number, chatWhatsApp.message)
      : null;

    return NextResponse.json({
      message: "Pengaturan berhasil diperbarui.",
      data: {
        petugas_mass_delete_enabled: updatedStatus,
        chat_whatsapp_number: chatWhatsApp.number,
        chat_whatsapp_message: chatWhatsApp.message,
        chat_whatsapp_enabled: chatWhatsApp.enabled,
        chat_whatsapp_preview_url: previewUrl,
      },
    });
  } catch (error) {
    console.error("[api/admin/settings] PATCH error:", error);
    return NextResponse.json({ message: "Gagal menyimpan pengaturan sistem." }, { status: 500 });
  }
}

