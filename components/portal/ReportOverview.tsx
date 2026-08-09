"use client";

import { useEffect, useState } from "react";
import { PortalIcon } from "./PortalIcon";

type Summary = { total: number; menunggu: number; disetujui: number; ditolak: number; ekraf: number; sdm: number; komunitas: number; berita: number; acara: number };

export function ReportOverview() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/dashboard/summary", { cache: "no-store" })
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.message); return payload.data; })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Laporan gagal dimuat."));
  }, []);
  const approval = data?.total ? Math.round((data.disetujui / data.total) * 100) : 0;

  return <section>
    <div className="portal-page-head"><div><p className="portal-breadcrumb">Dashboard / Laporan</p><h1>Laporan Ringkas</h1><p>Ringkasan seluruh pengajuan, berita, dan acara yang dihitung langsung dari database.</p></div><button className="portal-secondary" type="button" onClick={() => window.print()}><PortalIcon name="report" />Cetak Laporan</button></div>
    {error && <div className="portal-alert error">{error}</div>}
    <div className="report-grid report-grid-v8">
      <article><span>Total Pengajuan</span><strong>{data?.total ?? "—"}</strong><p>{data?.menunggu ?? 0} menunggu · {data?.disetujui ?? 0} disetujui · {data?.ditolak ?? 0} ditolak</p></article>
      <article><span>Tingkat Persetujuan</span><strong>{approval}%</strong><p>Dari seluruh pengajuan yang telah masuk.</p></article>
      <article><span>Pengajuan Pelaku Ekraf</span><strong>{data?.ekraf ?? "—"}</strong><p>Data dari tabel pengajuan_ekraf.</p></article>
      <article><span>Pengajuan SDM Pariwisata</span><strong>{data?.sdm ?? "—"}</strong><p>Data dari tabel pengajuan_sdm_pariwisata.</p></article>
      <article><span>Komunitas / Asosiasi / Lembaga</span><strong>{data?.komunitas ?? "—"}</strong><p>Data dari tabel pengajuan_komunitas_asosiasi.</p></article>
      <article><span>Berita</span><strong>{data?.berita ?? "—"}</strong><p>Konten berita yang dikelola pengguna.</p></article>
      <article><span>Acara</span><strong>{data?.acara ?? "—"}</strong><p>Agenda dan kegiatan pada tabel acara.</p></article>
    </div>
  </section>;
}
