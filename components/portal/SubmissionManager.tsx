"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { submissionConfigs, type SubmissionField, type SubmissionType } from "@/lib/submission-config";
import { PortalIcon } from "./PortalIcon";
import { compareTableValues, SortableTableHeader, TablePagination, type SortDirection } from "./DataTableControls";

type Row = Record<string, unknown> & { id: number; status_label?: string; created_at?: string; no_registrasi?: string };

type Props = {
  type: SubmissionType;
};

function formatDate(value: unknown, withTime = false) {
  if (!value) return "—";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}

function statusClass(status: string) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function identityFor(type: SubmissionType, row: Row) {
  if (type === "ekraf") return { title: String(row.nama_lengkap ?? "—"), subtitle: String(row.nama_usaha ?? "—"), contact: String(row.email ?? row.no_hp ?? "—") };
  if (type === "sdm") return { title: String(row.nama_lengkap ?? "—"), subtitle: String(row.tempat_bertugas ?? row.jabatan ?? "—"), contact: String(row.email ?? row.no_hp ?? "—") };
  return { title: String(row.nama_organisasi ?? "—"), subtitle: String(row.kategori ?? "—"), contact: String(row.email ?? row.no_hp_ketua ?? "—") };
}

function fieldValue(row: Row, field: SubmissionField) {
  const aliases: Record<string, string> = {
    subsektor_id: "subsektor_label",
    kecamatan_id: "kecamatan_label",
    kelurahan_id: "kelurahan_label",
    komunitas_id: "komunitas_label",
    kecamatan_usaha_id: "kecamatan_usaha_label",
    kelurahan_usaha_id: "kelurahan_usaha_label",
  };
  const alias = aliases[field.key];
  const value = alias && row[alias] ? row[alias] : row[field.key];
  if (value === null || value === undefined || value === "") return "—";
  if (field.type === "checkbox") return Number(value) === 1 ? "Ya" : "Tidak";
  if (field.type === "date") return formatDate(value);
  if (field.key.includes("tanggal_") || field.key.endsWith("_at")) return formatDate(value, true);
  if (field.key === "omzet_per_tahun") return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
  return String(value);
}

export function SubmissionManager({ type }: Props) {
  const config = submissionConfigs[type];
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Semua");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const [detailStep, setDetailStep] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [featureSavingId, setFeatureSavingId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/submissions?type=${type}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Gagal mengambil pengajuan.");
      setRows(payload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil pengajuan.");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => ({
    total: rows.length,
    menunggu: rows.filter((row) => ["Menunggu", "Perlu Perbaikan"].includes(String(row.status_label ?? "Menunggu"))).length,
    disetujui: rows.filter((row) => row.status_label === "Disetujui").length,
    ditolak: rows.filter((row) => row.status_label === "Ditolak").length,
  }), [rows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      const identity = identityFor(type, row);
      const matchesQuery = !needle || `${row.no_registrasi ?? ""} ${identity.title} ${identity.subtitle} ${identity.contact}`.toLowerCase().includes(needle);
      const matchesStatus = status === "Semua" || String(row.status_label ?? "Menunggu") === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, rows, status, type]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((left, right) => {
      const leftIdentity = identityFor(type, left);
      const rightIdentity = identityFor(type, right);
      const valueFor = (row: Row, identity: ReturnType<typeof identityFor>) => {
        if (sortKey === "nama") return identity.title;
        if (sortKey === "detail") return identity.subtitle;
        if (sortKey === "kontak") return identity.contact;
        if (sortKey === "status") return row.status_label ?? "Menunggu";
        if (sortKey === "unggulan") return Number(row.unggulan ?? 0);
        if (sortKey === "tanggal") return row.created_at ?? "";
        return row[sortKey];
      };
      const result = compareTableValues(valueFor(left, leftIdentity), valueFor(right, rightIdentity));
      return sortDirection === "asc" ? result : -result;
    });
  }, [filtered, sortDirection, sortKey, type]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pagedRows = useMemo(() => sortedRows.slice((page - 1) * pageSize, page * pageSize), [page, pageSize, sortedRows]);

  useEffect(() => { setPage(1); }, [query, status, type]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  function handleSort(key: string) {
    if (sortKey === key) setSortDirection((current) => current === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setPage(1);
  }

  function handlePageSize(nextSize: number) {
    setPageSize(nextSize);
    setPage(1);
  }

  function openReview(row: Row) {
    setSelected(row);
    setDetailStep(0);
    setNote(String(row.catatan_verifikasi ?? row.alasan_penolakan ?? ""));
    setError("");
  }

  async function toggleFeatured(row: Row) {
    if (type !== "ekraf" || String(row.status_label ?? "") !== "Disetujui") return;
    const nextValue = Number(row.unggulan) === 1 ? 0 : 1;
    setFeatureSavingId(row.id);
    setError("");
    try {
      const response = await fetch("/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ekraf", id: row.id, action: "feature", unggulan: nextValue }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Status unggulan gagal disimpan.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status unggulan gagal disimpan.");
    } finally {
      setFeatureSavingId(null);
    }
  }

  async function verify(action: "approve" | "reject") {
    if (!selected) return;
    if (action === "reject" && !note.trim()) {
      setError("Alasan penolakan wajib diisi sebelum pengajuan ditolak.");
      return;
    }
    const confirmation = action === "approve" ? "Setujui pengajuan ini?" : "Tolak pengajuan ini?";
    if (!window.confirm(confirmation)) return;

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id: selected.id, action, note }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Verifikasi gagal disimpan.");
      setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verifikasi gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="portal-page-head">
        <div>
          <p className="portal-breadcrumb">Dashboard / Pengajuan / {config.title.replace("Pengajuan ", "")}</p>
          <h1>{config.title}</h1>
          <p>Petugas hanya meninjau data yang masuk dari formulir publik, kemudian memilih setujui atau tolak.</p>
        </div>
      </div>

      <div className="portal-stat-row">
        <div className="portal-stat-card"><span className="stat-icon"><PortalIcon name="clipboard" /></span><div><small>Total Pengajuan</small><strong>{stats.total}</strong><p>Semua data masuk</p></div></div>
        <div className="portal-stat-card"><span className="stat-icon"><PortalIcon name="clock" /></span><div><small>Menunggu</small><strong>{stats.menunggu}</strong><p>Perlu diverifikasi</p></div></div>
        <div className="portal-stat-card"><span className="stat-icon"><PortalIcon name="check" /></span><div><small>Disetujui</small><strong>{stats.disetujui}</strong><p>Sudah diverifikasi</p></div></div>
        <div className="portal-stat-card"><span className="stat-icon"><PortalIcon name="x" /></span><div><small>Ditolak</small><strong>{stats.ditolak}</strong><p>Tidak lolos verifikasi</p></div></div>
      </div>

      <div className="submission-admin-toolbar">
        <label className="submission-admin-search"><PortalIcon name="search" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, registrasi, email, atau usaha…" /></label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
          <option>Semua</option><option>Menunggu</option><option>Perlu Perbaikan</option><option>Disetujui</option><option>Ditolak</option>
        </select>
        <span>{filtered.length} data</span>
      </div>

      {error && !selected && <div className="portal-alert error">{error}</div>}

      <div className="dm-table-wrap">
        <table className="dm-table submission-table">
          <thead><tr><SortableTableHeader label="No. Registrasi" sortKey="no_registrasi" activeKey={sortKey} direction={sortDirection} onSort={handleSort} /><SortableTableHeader label="Nama / Organisasi" sortKey="nama" activeKey={sortKey} direction={sortDirection} onSort={handleSort} /><SortableTableHeader label="Usaha / Tempat / Kategori" sortKey="detail" activeKey={sortKey} direction={sortDirection} onSort={handleSort} /><SortableTableHeader label="Kontak" sortKey="kontak" activeKey={sortKey} direction={sortDirection} onSort={handleSort} /><SortableTableHeader label="Status" sortKey="status" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />{type === "ekraf" && <SortableTableHeader label="Unggulan" sortKey="unggulan" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />}<SortableTableHeader label="Tanggal" sortKey="tanggal" activeKey={sortKey} direction={sortDirection} onSort={handleSort} /><th>Aksi</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={type === "ekraf" ? 8 : 7} className="dm-empty">Memuat pengajuan…</td></tr> : sortedRows.length === 0 ? <tr><td colSpan={type === "ekraf" ? 8 : 7} className="dm-empty">Belum ada pengajuan yang sesuai filter.</td></tr> : pagedRows.map((row) => {
              const identity = identityFor(type, row);
              const currentStatus = String(row.status_label ?? "Menunggu");
              return <tr key={row.id}>
                <td data-label="No. Registrasi"><strong>{row.no_registrasi || "—"}</strong></td>
                <td data-label="Nama"><strong>{identity.title}</strong></td>
                <td data-label="Detail">{identity.subtitle}</td>
                <td data-label="Kontak">{identity.contact}</td>
                <td data-label="Status"><span className={`portal-status ${statusClass(currentStatus)}`}>{currentStatus}</span></td>
                {type === "ekraf" && <td data-label="Unggulan">{currentStatus === "Disetujui" ? <button className={`featured-toggle ${Number(row.unggulan) === 1 ? "active" : ""}`} type="button" disabled={featureSavingId === row.id} onClick={() => void toggleFeatured(row)} title={Number(row.unggulan) === 1 ? "Hapus dari Pelaku Unggulan" : "Jadikan Pelaku Unggulan"}><PortalIcon name="star" />{featureSavingId === row.id ? "Menyimpan" : Number(row.unggulan) === 1 ? "Unggulan" : "Jadikan unggulan"}</button> : <span className="featured-disabled">Setujui dulu</span>}</td>}
                <td data-label="Tanggal">{formatDate(row.created_at, true)}</td>
                <td data-label="Aksi"><button className="review-button" type="button" onClick={() => openReview(row)}><PortalIcon name="eye" />Tinjau</button></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {!loading && sortedRows.length > 0 && <TablePagination totalItems={sortedRows.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={handlePageSize} />}

      {selected && (
        <div className="portal-modal-layer" role="dialog" aria-modal="true">
          <button className="portal-modal-backdrop" type="button" onClick={() => setSelected(null)} aria-label="Tutup" />
          <div className="portal-modal verification-modal">
            <div className="portal-modal-head">
              <div><p>{selected.no_registrasi || "Pengajuan"}</p><h2>{identityFor(type, selected).title}</h2></div>
              <button type="button" onClick={() => setSelected(null)}><PortalIcon name="x" /></button>
            </div>

            <div className="verification-status-row">
              <span>Status saat ini</span>
              <span className={`portal-status ${statusClass(String(selected.status_label ?? "Menunggu"))}`}>{String(selected.status_label ?? "Menunggu")}</span>
              <small>Dikirim {formatDate(selected.created_at, true)}</small>
            </div>

            <div className="verification-steps" role="tablist" aria-label="Tahapan data pengajuan">
              {config.steps.map((step, index) => <button key={step.shortTitle} type="button" className={detailStep === index ? "active" : ""} onClick={() => setDetailStep(index)}><span>{index + 1}</span>{step.shortTitle}</button>)}
            </div>

            <div className="verification-section">
              <div className="verification-section-head"><p>Tahap {detailStep + 1}</p><h3>{config.steps[detailStep].title}</h3><span>{config.steps[detailStep].description}</span></div>
              <div className="verification-grid">
                {config.steps[detailStep].fields.filter((field) => field.key !== "konfirmasi_kebenaran").map((field) => {
                  const value = fieldValue(selected, field);
                  const isFile = field.type === "file" && value !== "—";
                  const fileLinkLabel = field.fileKind === "document" ? "Buka dokumen ↗" : "Buka gambar ↗";
                  return <div className={field.type === "textarea" || field.type === "file" || field.type === "checkbox" ? "wide" : ""} key={field.key}><span>{field.label}</span>{isFile ? <a href={value} target="_blank" rel="noreferrer">{fileLinkLabel}</a> : <strong>{value}</strong>}</div>;
                })}
              </div>
            </div>

            <div className="verification-decision">
              <label className="portal-field full"><span>Catatan Verifikasi / Alasan Penolakan</span><textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tambahkan catatan. Wajib diisi apabila pengajuan ditolak." /></label>
              {error && <div className="portal-alert error">{error}</div>}
              <div className="verification-actions">
                <button className="verify-reject" type="button" disabled={saving} onClick={() => void verify("reject")}><PortalIcon name="x" />Tolak Pengajuan</button>
                <button className="verify-approve" type="button" disabled={saving} onClick={() => void verify("approve")}><PortalIcon name="check" />{saving ? "Menyimpan…" : "Setujui Pengajuan"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
