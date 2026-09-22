import MonitoringSampahTable from "@/components/portal/MonitoringSampahTable";
import { requirePageRole } from "@/lib/auth";
import { checkIsLiveServer } from "@/lib/is-live";
import { getAll, type DbRecord } from "@/lib/realtime-db";
import { redirect } from "next/navigation";

export const metadata = { title: "Monitoring Sampah | SI PARIK BANGKA" };

export default async function MonitoringSampahPage() {
  await requirePageRole("petugas");
  if (await checkIsLiveServer()) {
    redirect("/dashboard");
  }

  const allRows = await getAll<DbRecord>("laporan_deteksi");
  const rows = allRows
    .sort((a, b) => new Date(String(b.created_at || "")).getTime() - new Date(String(a.created_at || "")).getTime())
    .slice(0, 100);

  return (
    <main className="portal-content">
      <section className="portal-page-head">
        <div>
          <p className="portal-breadcrumb">Dashboard / Monitoring Sampah</p>
          <h1>Monitoring Sampah</h1>
          <p>Kelola laporan deteksi sampah dari aplikasi lapangan.</p>
        </div>
      </section>
      <MonitoringSampahTable rows={rows} />
    </main>
  );
}

