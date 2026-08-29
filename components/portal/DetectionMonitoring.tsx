"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PortalIcon } from "./PortalIcon";
import { TablePagination } from "./DataTableControls";

type Row = Record<string, unknown> & { id: number | string };
type DetectionItem = { label: string; confidence: number; x?: number; y?: number; w?: number; h?: number };

function toDate(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const date = new Date(text.includes("T") ? text : text.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: unknown) {
  const date = toDate(value);
  return date ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date) : String(value ?? "—");
}

function normalizeDetections(value: unknown): DetectionItem[] {
  const list = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? Object.values(value as Record<string, unknown>)
      : [];
  return list.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const label = String(row.label ?? "").trim();
    if (!label) return [];
    const confidence = Number(row.confidence ?? 0);
    return [{
      label,
      confidence: Number.isFinite(confidence) ? confidence : 0,
      x: Number(row.x), y: Number(row.y), w: Number(row.w), h: Number(row.h),
    }];
  });
}

function detectionTags(row: Row) {
  const detections = normalizeDetections(row.detections);
  const grouped = new Map<string, { count: number; maxConfidence: number }>();
  for (const detection of detections) {
    const current = grouped.get(detection.label) ?? { count: 0, maxConfidence: 0 };
    current.count += 1;
    current.maxConfidence = Math.max(current.maxConfidence, detection.confidence);
    grouped.set(detection.label, current);
  }
  if (!grouped.size) {
    const label = String(row.deteksi_utama ?? "").trim();
    if (label) grouped.set(label, { count: Number(row.jumlah_objek ?? 1) || 1, maxConfidence: Number(row.confidence ?? 0) || 0 });
  }
  return [...grouped.entries()].sort((a, b) => b[1].count - a[1].count || b[1].maxConfidence - a[1].maxConfidence);
}

function countTop(rows: Row[], valueFor: (row: Row) => string[], limit = 6) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const raw of valueFor(row)) {
      const value = raw.trim();
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}

export function DetectionMonitoring() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/detections", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Laporan deteksi gagal dimuat.");
      setRows((payload.data ?? []) as Row[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Laporan deteksi gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const today = useMemo(() => {
    const now = new Date();
    return rows.filter((row) => {
      const d = toDate(row.created_at);
      return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).length;
  }, [rows]);

  const thisWeek = useMemo(() => {
    const threshold = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return rows.filter((row) => (toDate(row.created_at)?.getTime() ?? 0) >= threshold).length;
  }, [rows]);

  const trend = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index));
      const value = rows.filter((row) => {
        const d = toDate(row.created_at);
        return d && d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
      }).length;
      return { label: `${date.getDate()}/${date.getMonth() + 1}`, value };
    });
  }, [rows]);

  const locationTop = useMemo(() => countTop(rows, (row) => [String(row.lokasi_nama ?? "")]), [rows]);
  const reporterTop = useMemo(() => countTop(rows, (row) => [String(row.nama_pelapor ?? "")]), [rows]);
  const detectionTop = useMemo(() => countTop(rows, (row) => {
    const all = normalizeDetections(row.detections).map((d) => d.label);
    return all.length ? all : [String(row.deteksi_utama ?? "")];
  }), [rows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => {
      const detected = detectionTags(row).map(([label]) => label).join(" ");
      return `${row.nama_pelapor ?? ""} ${row.lokasi_nama ?? ""} ${row.lokasi_jenis ?? ""} ${row.catatan ?? ""} ${detected}`.toLowerCase().includes(needle);
    });
  }, [query, rows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [query]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  async function remove(row: Row) {
    if (!window.confirm("Hapus laporan deteksi ini? Foto hasil deteksi di Cloudflare R2 dan record Firebase akan dihapus permanen.")) return;
    setDeletingId(row.id);
    setError("");
    try {
      const response = await fetch("/api/detections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Laporan deteksi gagal dihapus.");
      if (selected?.id === row.id) setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Laporan deteksi gagal dihapus.");
    } finally {
      setDeletingId(null);
    }
  }

  const maxTrend = Math.max(1, ...trend.map((item) => item.value));
  const statCards = [
    { label: "Total laporan", value: rows.length, icon: "clipboard" as const },
    { label: "Hari ini", value: today, icon: "calendar" as const },
    { label: "7 hari terakhir", value: thisWeek, icon: "report" as const },
    { label: "Lokasi tercatat", value: new Set(rows.map((row) => String(row.lokasi_nama ?? "")).filter(Boolean)).size, icon: "database" as const },
  ];

  return (
    <section>
      <div className="portal-page-head"><div><p className="portal-breadcrumb">Dashboard / Monitoring Deteksi</p><h1>Monitoring Deteksi Sampah</h1><p>Memantau laporan deteksi dari Flutter, foto hasil deteksi, lokasi kejadian, pelapor, dan seluruh jenis sampah yang terdeteksi.</p></div></div>

      <div className="portal-stat-row">
        {statCards.map(({ label, value, icon }) => <div className="portal-stat-card" key={label}><span className="stat-icon"><PortalIcon name={icon} /></span><div><small>{label}</small><strong>{value}</strong><p>Data laporan deteksi</p></div></div>)}
      </div>

      <div className="detection-monitor-grid">
        <div className="detection-panel"><h2>Tren laporan 7 hari</h2><p>Jumlah laporan yang masuk per hari.</p><div className="detection-bars">{trend.map((item) => <div className="detection-bar-item" key={item.label}><span className="detection-bar-value">{item.value}</span><span className="detection-bar-track"><span className="detection-bar-fill" style={{ height: `${Math.max(2, item.value / maxTrend * 100)}%` }} /></span><span className="detection-bar-label">{item.label}</span></div>)}</div></div>
        <div className="detection-panel"><h2>Lokasi terbanyak</h2><p>Lokasi dengan jumlah laporan tertinggi.</p><div className="detection-ranking">{locationTop.length ? locationTop.map(([label, count], index) => <div className="detection-ranking-row" key={label}><span>{index + 1}</span><strong title={label}>{label}</strong><small>{count}</small></div>) : <p>Belum ada data.</p>}</div></div>
      </div>

      <div className="detection-monitor-grid">
        <div className="detection-panel"><h2>Pelapor paling aktif</h2><p>Jumlah laporan berdasarkan nama pelapor.</p><div className="detection-ranking">{reporterTop.length ? reporterTop.map(([label, count], index) => <div className="detection-ranking-row" key={label}><span>{index + 1}</span><strong title={label}>{label}</strong><small>{count}</small></div>) : <p>Belum ada data.</p>}</div></div>
        <div className="detection-panel"><h2>Jenis sampah terdeteksi</h2><p>Menghitung seluruh objek hasil deteksi, bukan hanya hasil utama.</p><div className="detection-ranking">{detectionTop.length ? detectionTop.map(([label, count], index) => <div className="detection-ranking-row" key={label}><span>{index + 1}</span><strong title={label}>{label}</strong><small>{count}</small></div>) : <p>Belum ada data.</p>}</div></div>
      </div>

      <div className="detection-toolbar"><label className="detection-search"><PortalIcon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari pelapor, lokasi, sampah, atau catatan…" /></label><button className="review-button" type="button" onClick={() => void load()}><PortalIcon name="refresh" />Muat ulang</button></div>
      {error && <div className="portal-alert error">{error}</div>}

      <div className="dm-table-wrap"><table className="dm-table"><thead><tr><th>Foto hasil deteksi</th><th>Pelapor</th><th>Lokasi</th><th>Semua hasil deteksi</th><th>Waktu</th><th>Aksi</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={6} className="dm-empty">Memuat laporan deteksi…</td></tr> : paged.length === 0 ? <tr><td colSpan={6} className="dm-empty">Belum ada laporan deteksi yang sesuai.</td></tr> : paged.map((row) => {
          const tags = detectionTags(row);
          const image = String(row.image_url ?? "").trim();
          return <tr key={String(row.id)}><td data-label="Foto">{image ? <img className="detection-image-thumb" src={image} alt="Hasil deteksi sampah" /> : "—"}</td><td data-label="Pelapor"><strong>{String(row.nama_pelapor ?? "—")}</strong></td><td data-label="Lokasi"><strong>{String(row.lokasi_nama ?? "—")}</strong><br /><small>{String(row.latitude ?? "—")}, {String(row.longitude ?? "—")}</small></td><td data-label="Hasil"><div className="detection-tags">{tags.length ? tags.map(([label, data]) => <span className="detection-tag" key={label}>{label} ×{data.count} · {(data.maxConfidence * 100).toFixed(0)}%</span>) : <span>—</span>}</div></td><td data-label="Waktu">{formatDate(row.created_at)}</td><td data-label="Aksi"><div className="submission-action-buttons"><button className="review-button" type="button" onClick={() => setSelected(row)}><PortalIcon name="eye" />Detail</button><button className="delete-button" type="button" disabled={deletingId === row.id} onClick={() => void remove(row)}><PortalIcon name="trash" />{deletingId === row.id ? "Menghapus…" : "Hapus"}</button></div></td></tr>;
        })}
      </tbody></table></div>
      {!loading && filtered.length > 0 && <TablePagination totalItems={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />}

      {selected && <div className="portal-modal-layer" role="dialog" aria-modal="true"><button className="portal-modal-backdrop" type="button" onClick={() => setSelected(null)} aria-label="Tutup" /><div className="portal-modal verification-modal"><div className="portal-modal-head"><div><p>Laporan deteksi #{String(selected.id)}</p><h2>{String(selected.lokasi_nama ?? "Deteksi Sampah")}</h2></div><button type="button" onClick={() => setSelected(null)}><PortalIcon name="x" /></button></div><div className="verification-section">{String(selected.image_url ?? "").trim() && <img className="detection-modal-image" src={String(selected.image_url)} alt="Foto hasil deteksi" />}<div className="detection-detail-list"><div><span>Pelapor</span><strong>{String(selected.nama_pelapor ?? "—")}</strong></div><div><span>Waktu</span><strong>{formatDate(selected.created_at)}</strong></div><div><span>Lokasi</span><strong>{String(selected.lokasi_nama ?? "—")}</strong></div><div><span>Koordinat</span><strong>{String(selected.latitude ?? "—")}, {String(selected.longitude ?? "—")}</strong></div><div><span>Catatan</span><strong>{String(selected.catatan ?? "—")}</strong></div><div><span>Jumlah objek</span><strong>{normalizeDetections(selected.detections).length || Number(selected.jumlah_objek ?? 0) || "—"}</strong></div></div><h3 style={{ marginTop: 18 }}>Seluruh hasil deteksi</h3><div className="detection-tags">{detectionTags(selected).map(([label, data]) => <span className="detection-tag" key={label}>{label} ×{data.count} · confidence tertinggi {(data.maxConfidence * 100).toFixed(1)}%</span>)}</div></div><div className="verification-actions"><button className="delete-button danger" type="button" disabled={deletingId === selected.id} onClick={() => void remove(selected)}><PortalIcon name="trash" />{deletingId === selected.id ? "Menghapus…" : "Hapus Laporan + Foto R2"}</button></div></div></div>}
    </section>
  );
}
