import MonitoringSampahTable from "@/components/portal/MonitoringSampahTable";
import { requirePageRole } from "@/lib/auth";
import { db } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export const metadata={title:"Monitoring Sampah | SI PARIK BANGKA"};

export default async function MonitoringSampahPage(){
 await requirePageRole("petugas");
 const [rows]=await db().execute<RowDataPacket[]>(`SELECT id,nama_pelapor,lokasi_nama,lokasi_jenis,deteksi_utama,confidence,status,created_at FROM laporan_deteksi ORDER BY created_at DESC LIMIT 100`);
 return <main className="portal-content">
   <section className="portal-page-head">
    <div><p className="portal-breadcrumb">Dashboard / Monitoring Sampah</p><h1>Monitoring Sampah</h1><p>Kelola laporan deteksi sampah dari aplikasi lapangan.</p></div>
   </section>
   <MonitoringSampahTable rows={rows}/>
 </main>
}
