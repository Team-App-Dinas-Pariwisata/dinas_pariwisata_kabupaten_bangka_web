import { redirect } from "next/navigation";
import { WhatsAppManager } from "@/components/portal/WhatsAppManager";
import { checkIsLiveServer } from "@/lib/is-live";

export const metadata = { title: "Koneksi WhatsApp | SI PARIK BANGKA" };

export default async function AdminWhatsAppPage() {
  if (await checkIsLiveServer()) {
    redirect("/admin/petugas");
  }

  return <WhatsAppManager />;
}
