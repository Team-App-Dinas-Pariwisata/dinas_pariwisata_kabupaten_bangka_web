import { notFound } from "next/navigation";
import { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = { title: "Detail Monitoring Sampah | SI PARIK BANGKA" };

export default async function DetailMonitoringSampah({
  params,
}: PageProps) {

  const { id } = await params;

  await requirePageRole("petugas");


  const [rows] = await db().execute<RowDataPacket[]>(
    "SELECT * FROM laporan_deteksi WHERE id=?",
    [id]
  );


  if (!rows.length) {
    notFound();
  }


  const data = rows[0];
  const statusClass = String(data.status ?? "").toLowerCase().replaceAll(" ", "-");
  const waktu = new Date(data.created_at).toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const confidencePercent = data.confidence
    ? `${(Number(data.confidence) * 100).toFixed(1)}%`
    : "—";


  return (
    <section>

      {/* HEADER */}
      <div className="portal-page-head">
        <div>
          <p className="portal-breadcrumb">
            Dashboard / <Link href="/dashboard/monitoring-sampah">Monitoring Sampah</Link> / Detail
          </p>
          <h1>Detail Laporan Sampah</h1>
          <p>Informasi lengkap laporan deteksi sampah dari aplikasi lapangan.</p>
        </div>
        <Link href="/dashboard/monitoring-sampah" className="portal-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "7px", textDecoration: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "17px", height: "17px" }}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
          Kembali
        </Link>
      </div>


      {/* MAIN CONTENT */}
      <div className="detail-sampah-layout">

        {/* FOTO SECTION */}
        <div className="portal-panel detail-sampah-photo">
          <div className="portal-panel-head">
            <div>
              <h2>Foto Sampah</h2>
              <p>Dokumentasi visual dari lokasi pelaporan</p>
            </div>
          </div>
          <div className="detail-sampah-photo-body">
            {data.image_url ? (
              <a href={data.image_url} target="_blank" rel="noreferrer" className="detail-sampah-img-link">
                <img
                  src={data.image_url}
                  alt="Foto Sampah"
                />
              </a>
            ) : (
              <div className="detail-sampah-no-photo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                <span>Foto tidak tersedia</span>
              </div>
            )}
          </div>
        </div>

        {/* INFORMASI SECTION */}
        <div className="portal-panel detail-sampah-info">
          <div className="portal-panel-head">
            <div>
              <h2>Informasi Laporan</h2>
              <p>Data lengkap dari hasil deteksi di lapangan</p>
            </div>
            <span className={`portal-status ${statusClass}`}>
              {data.status}
            </span>
          </div>
          <div className="detail-sampah-info-body">

            <div className="detail-sampah-grid">

              <DetailField
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
                label="Nama Pelapor"
                value={data.nama_pelapor}
              />

              <DetailField
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>}
                label="Lokasi"
                value={data.lokasi_nama}
              />

              <DetailField
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>}
                label="Jenis Lokasi"
                value={data.lokasi_jenis}
              />

              <DetailField
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12 12 20l-8-8V4h8z" /><circle cx="8.5" cy="8.5" r="1.5" /></svg>}
                label="Jenis Sampah"
                value={data.deteksi_utama}
              />

              <DetailField
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9 5-9-5 9-5z" /><path d="m3 8 9 5 9-5v9l-9 5-9-5z" /><path d="M12 13v9" /></svg>}
                label="Jumlah Objek"
                value={data.jumlah_objek ? `${data.jumlah_objek} objek terdeteksi` : undefined}
              />

              <DetailField
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>}
                label="Confidence"
                value={confidencePercent}
                highlight
              />

              <DetailField
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>}
                label="Waktu Laporan"
                value={waktu}
                fullWidth
              />

            </div>

          </div>
        </div>

      </div>

    </section>
  );
}




function DetailField({
  icon,
  label,
  value,
  highlight,
  fullWidth,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  highlight?: boolean;
  fullWidth?: boolean;
}) {

  return (
    <div className={`detail-sampah-field${fullWidth ? " full" : ""}`}>
      <div className="detail-sampah-field-icon">
        {icon}
      </div>
      <div className="detail-sampah-field-content">
        <span className="detail-sampah-field-label">{label}</span>
        <span className={`detail-sampah-field-value${highlight ? " highlight" : ""}`}>
          {value || "—"}
        </span>
      </div>
    </div>
  );

}