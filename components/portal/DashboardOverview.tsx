"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalIcon, type PortalIconName } from "./PortalIcon";

type Recent = { id: number; jenis: "ekraf" | "sdm" | "komunitas"; no_registrasi: string | null; nama: string; detail: string; status: string; created_at: string };
type Summary = { total: number; menunggu: number; disetujui: number; ditolak: number; ekraf: number; sdm: number; komunitas: number; berita: number; acara: number; recent: Recent[] };

const cards: { key: keyof Pick<Summary, "total" | "menunggu" | "disetujui" | "ditolak">; label: string; caption: string; icon: PortalIconName }[] = [
  { key: "total", label: "Total Pengajuan", caption: "Tiga jenis pengajuan", icon: "clipboard" },
  { key: "menunggu", label: "Menunggu Verifikasi", caption: "Perlu ditinjau petugas", icon: "clock" },
  { key: "disetujui", label: "Disetujui", caption: "Lolos verifikasi", icon: "check" },
  { key: "ditolak", label: "Ditolak", caption: "Tidak lolos verifikasi", icon: "x" },
];

const hrefByType = {
  ekraf: "/dashboard/pengajuan/pelaku-ekraf",
  sdm: "/dashboard/pengajuan/sdm-pariwisata",
  komunitas: "/dashboard/pengajuan/komunitas",
};

function formatDate(value: string) {
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

export function DashboardOverview() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/summary", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          const message = payload.detail ? `${payload.message} ${payload.detail}` : payload.message;
          throw new Error(message);
        }
        return payload;
      })
      .then((payload) => setData(payload.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat ringkasan."));
  }, []);

  return (
    <section>
      <div className="portal-page-head">
        <div><p className="portal-breadcrumb">Dashboard</p><h1>Dashboard Pengelolaan Data</h1><p>Pantau pengajuan yang masuk, berita, dan acara SI PARIK BANGKA Kabupaten Bangka.</p></div>
      </div>
      {error && <div className="portal-alert error">{error}</div>}
      <div className="portal-stat-row">
        {cards.map((card) => <div className="portal-stat-card" key={card.key}><span className="stat-icon"><PortalIcon name={card.icon} /></span><div><small>{card.label}</small><strong>{data?.[card.key] ?? "—"}</strong><p>{card.caption}</p></div></div>)}
      </div>

      <div className="portal-mini-stats portal-mini-stats-five">
        <Link href="/dashboard/pengajuan/pelaku-ekraf"><span>Pelaku Ekraf</span><strong>{data?.ekraf ?? "—"}</strong></Link>
        <Link href="/dashboard/pengajuan/sdm-pariwisata"><span>SDM Pariwisata</span><strong>{data?.sdm ?? "—"}</strong></Link>
        <Link href="/dashboard/pengajuan/komunitas"><span>Komunitas / Asosiasi</span><strong>{data?.komunitas ?? "—"}</strong></Link>
        <Link href="/dashboard/berita"><span>Berita</span><strong>{data?.berita ?? "—"}</strong></Link>
        <Link href="/dashboard/acara"><span>Acara</span><strong>{data?.acara ?? "—"}</strong></Link>
      </div>

      <div className="portal-panel">
        <div className="portal-panel-head"><div><h2>Pengajuan yang perlu ditinjau</h2><p>Hanya menampilkan pengajuan berstatus Menunggu atau Perlu Perbaikan dari Pelaku Ekraf, SDM Pariwisata, dan Komunitas.</p></div></div>
        <div className="dm-table-wrap embedded"><table className="dm-table"><thead><tr><th>No. Registrasi</th><th>Jenis</th><th>Nama</th><th>Detail</th><th>Status</th><th>Tanggal</th></tr></thead><tbody>
          {!data ? <tr><td colSpan={6} className="dm-empty">Memuat data…</td></tr> : data.recent.length === 0 ? <tr><td colSpan={6} className="dm-empty">Tidak ada pengajuan yang masih menunggu tindak lanjut.</td></tr> : data.recent.map((row) => <tr key={`${row.jenis}-${row.id}`}><td><Link className="table-link" href={hrefByType[row.jenis]}>{row.no_registrasi || "—"}</Link></td><td>{row.jenis === "ekraf" ? "Pelaku Ekraf" : row.jenis === "sdm" ? "SDM Pariwisata" : "Komunitas"}</td><td>{row.nama}</td><td>{row.detail}</td><td><span className={`portal-status ${row.status.toLowerCase().replaceAll(" ", "-")}`}>{row.status}</span></td><td>{formatDate(row.created_at)}</td></tr>)}
        </tbody></table></div>
      </div>
    </section>
  );
}
