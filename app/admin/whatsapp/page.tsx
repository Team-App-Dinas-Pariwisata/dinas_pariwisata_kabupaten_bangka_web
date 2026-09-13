import { redirect } from "next/navigation";
import { WhatsAppManager } from "@/components/portal/WhatsAppManager";

export const metadata = { title: "Koneksi WhatsApp | SI PARIK BANGKA" };

export default function AdminWhatsAppPage() {
  const appUrl = process.env.APP_BASE_URL || "";
  const isLiveServer = Boolean(appUrl && !appUrl.includes("localhost") && !appUrl.includes("127.0.0.1"));
  if (isLiveServer) {
    redirect("/admin/petugas");
  }

  return <WhatsAppManager />;
}
