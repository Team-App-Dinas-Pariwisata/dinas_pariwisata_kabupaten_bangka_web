import { NextResponse } from "next/server";
import { buildWhatsAppChatUrl, getChatWhatsAppConfig } from "@/lib/system-settings";

export async function GET() {
  try {
    const waConfig = await getChatWhatsAppConfig();
    const waUrl = waConfig.enabled ? buildWhatsAppChatUrl(waConfig.number, waConfig.message) : null;

    return NextResponse.json(
      {
        data: {
          whatsapp: {
            enabled: waConfig.enabled && Boolean(waUrl),
            number: waConfig.number,
            url: waUrl ?? "",
          },
        },
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("[chat/settings GET]", error);
    return NextResponse.json(
      {
        data: {
          whatsapp: {
            enabled: false,
            number: "",
            url: "",
          },
        },
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
