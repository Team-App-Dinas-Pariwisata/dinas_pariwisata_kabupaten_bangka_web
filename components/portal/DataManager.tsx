"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { ResourceField } from "@/lib/resources";
import { PortalIcon } from "./PortalIcon";

type Row = Record<string, unknown> & { id: number };
type Props = {
  resource: string;
  title: string;
  description: string;
  label: string;
  fields: ResourceField[];
  columns: { key: string; label: string }[];
};

function formatValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (["aktif", "headline", "dipublikasikan", "unggulan", "sepanjang_hari", "memerlukan_pendaftaran", "gratis"].includes(key)) return Number(value) === 1 ? "Ya" : "Tidak";
  if (key === "harga") return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
  if (key.includes("tanggal") || key.endsWith("_at")) {
    const date = new Date(String(value).replace(" ", "T"));
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: key.includes("tanggal_") ? "short" : undefined }).format(date);
  }
  return String(value);
}

function inputValue(field: ResourceField, value: unknown) {
  if (field.type === "checkbox") return Boolean(Number(value));
  if (field.type === "datetime-local" && value) return String(value).replace(" ", "T").slice(0, 16);
  return value === null || value === undefined ? "" : String(value);
}

function isLegacyImgBBViewerUrl(value: string) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return host === "ibb.co" || host === "ibb.co.com" || host === "imgbb.com";
  } catch {
    return false;
  }
}

function previewableImageUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim() || isLegacyImgBBViewerUrl(value)) return "";
  const trimmed = value.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function ImageThumbnail({ value, alt }: { value: unknown; alt: string }) {
  const [failedSource, setFailedSource] = useState("");
  const source = previewableImageUrl(value);

  if (!source || failedSource === source) {
    return <span className="dm-image-placeholder">{typeof value === "string" && value ? "Tanpa preview" : "Belum ada"}</span>;
  }

  return (
    <a className="dm-image-thumb" href={source} target="_blank" rel="noreferrer" aria-label={`Buka gambar ${alt}`}>
      <img src={source} alt={alt} onError={() => setFailedSource(source)} />
    </a>
  );
}

function ImageField({ value, onChange, disabled }: { value: unknown; onChange: (value: File | string) => void; disabled?: boolean }) {
  const [localPreview, setLocalPreview] = useState("");
  const storedPreview = value instanceof File ? "" : previewableImageUrl(value);
  const legacyImgBB = typeof value === "string" && Boolean(value) && isLegacyImgBBViewerUrl(value);
  const preview = localPreview || storedPreview;

  useEffect(() => {
    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setLocalPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setLocalPreview("");
    return undefined;
  }, [value]);

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onChange(file);
    event.target.value = "";
  }

  return (
    <div className="portal-image-uploader">
      <label className="portal-image-drop">
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={choose} disabled={disabled} />
        {preview ? (
          <img src={preview} alt={value instanceof File ? "Pratinjau gambar baru" : "Pratinjau gambar tersimpan"} />
        ) : (
          <div className="portal-image-empty">
            <PortalIcon name="plus" />
            <strong>{value ? "Ganti gambar" : "Pilih gambar"}</strong>
            <span>JPG, PNG, WebP, GIF, atau AVIF. Gambar berita/acara disimpan di Cloudflare R2.</span>
          </div>
        )}
        {preview && <span className="portal-image-change">Klik untuk ganti gambar</span>}
      </label>
      {value instanceof File && <small className="portal-image-meta">File baru: {value.name}</small>}
      {typeof value === "string" && value && storedPreview && <a className="portal-image-link" href={storedPreview} target="_blank" rel="noreferrer">Buka gambar tersimpan ↗</a>}
      {legacyImgBB && <small className="portal-image-warning">Gambar ini masih memakai URL viewer ImgBB lama sehingga tidak dapat dipreview sebagai gambar. Pilih gambar baru untuk memindahkannya ke Cloudflare R2.</small>}
      {legacyImgBB && <a className="portal-image-link" href={String(value)} target="_blank" rel="noreferrer">Buka URL ImgBB lama ↗</a>}
      {Boolean(value) && <button className="portal-image-remove" type="button" onClick={() => onChange("")} disabled={disabled}>Hapus gambar dari data</button>}
    </div>
  );
}

async function deleteManagedR2Image(url: unknown) {
  if (typeof url !== "string" || !url.trim()) return;
  try {
    await fetch("/api/uploads/r2", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      cache: "no-store",
    });
  } catch {
    // Cleanup storage tidak boleh membatalkan perubahan database yang sudah berhasil.
  }
}

export function DataManager({ resource, title, description, label, fields, columns }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [lookups, setLookups] = useState<Record<string, { label: string; value: string | number }[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ resource });
      const response = await fetch(`/api/crud?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mengambil data.");
      setRows(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil data.");
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!fields.some((field) => field.lookup)) return;
    fetch("/api/lookups", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memuat pilihan data.");
        return result.data as Record<string, { label: string; value: string | number }[]>;
      })
      .then(setLookups)
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat pilihan data."));
  }, [fields]);

  const optionsFor = useCallback((field: ResourceField) => field.lookup ? (lookups[field.lookup] ?? []) : (field.options ?? []), [lookups]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) => columns.some((column) => String(row[column.key] ?? "").toLowerCase().includes(keyword)));
  }, [rows, query, columns]);

  function openCreate() {
    const initial: Record<string, unknown> = {};
    fields.forEach((field) => {
      if (field.type === "checkbox") initial[field.key] = ["aktif", "gratis"].includes(field.key);
      else if (field.type === "select" && optionsFor(field).length) initial[field.key] = optionsFor(field)[0].value;
      else initial[field.key] = "";
    });
    setEditing(null);
    setForm(initial);
    setError("");
    setModalOpen(true);
  }

  function openEdit(row: Row) {
    const data: Record<string, unknown> = {};
    fields.forEach((field) => { data[field.key] = inputValue(field, row[field.key]); });
    setEditing(row);
    setForm(data);
    setError("");
    setModalOpen(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const newlyUploadedUrls: string[] = [];

    try {
      const data: Record<string, unknown> = { ...form };
      for (const field of fields) {
        const value = data[field.key];
        if (field.type !== "image" || !(value instanceof File)) continue;

        const uploadBody = new FormData();
        uploadBody.append("image", value);
        uploadBody.append("resource", resource);
        const uploadResponse = await fetch("/api/uploads/r2", { method: "POST", body: uploadBody, cache: "no-store" });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadResult.message || "Gambar gagal diunggah ke Cloudflare R2.");

        const storageUrl = String(uploadResult?.data?.storageUrl || uploadResult?.data?.url || "");
        if (!previewableImageUrl(storageUrl)) {
          throw new Error("Cloudflare R2 tidak mengembalikan URL gambar yang valid. Data tidak disimpan.");
        }
        data[field.key] = storageUrl;
        newlyUploadedUrls.push(storageUrl);
      }

      const response = await fetch("/api/crud", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource, id: editing?.id, data }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Data gagal disimpan.");

      if (editing) {
        await Promise.allSettled(
          fields
            .filter((field) => field.type === "image")
            .map(async (field) => {
              const oldUrl = editing[field.key];
              const newUrl = data[field.key];
              if (typeof oldUrl === "string" && oldUrl && oldUrl !== newUrl) await deleteManagedR2Image(oldUrl);
            }),
        );
      }

      setModalOpen(false);
      await load();
    } catch (err) {
      await Promise.allSettled(newlyUploadedUrls.map((url) => deleteManagedR2Image(url)));
      setError(err instanceof Error ? err.message : "Data gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`Hapus ${label.toLowerCase()} ini? Tindakan ini tidak dapat dibatalkan.`)) return;
    setError("");
    try {
      const response = await fetch("/api/crud", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource, id: row.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Data gagal dihapus.");
      await deleteManagedR2Image(row.foto_utama);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Data gagal dihapus.");
    }
  }

  return (
    <section>
      <div className="portal-page-head"><div><p className="portal-breadcrumb">Dashboard / {label}</p><h1>{title}</h1><p>{description}</p></div><button className="portal-primary" type="button" onClick={openCreate}><PortalIcon name="plus" />Tambah {label}</button></div>
      <div className="dm-toolbar"><label><PortalIcon name="search" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Cari ${label.toLowerCase()}...`} /></label><span>{filtered.length} data</span></div>
      {error && !modalOpen && <div className="portal-alert error">{error}</div>}
      <div className="dm-table-wrap">
        <table className="dm-table"><thead><tr>{columns.map((col) => <th key={col.key}>{col.label}</th>)}<th>Aksi</th></tr></thead><tbody>
          {loading ? <tr><td colSpan={columns.length + 1} className="dm-empty">Memuat data...</td></tr> : filtered.length === 0 ? <tr><td colSpan={columns.length + 1} className="dm-empty">Belum ada data.</td></tr> : filtered.map((row) => <tr key={row.id}>{columns.map((col) => <td key={col.key} data-label={col.label}>{col.key === "foto_utama" ? <ImageThumbnail value={row[col.key]} alt={String(row.judul ?? row.nama_acara ?? label)} /> : col.key === "status" || col.key === "status_acara" ? <span className={`portal-status ${String(row[col.key] ?? "").toLowerCase().replaceAll(" ", "-")}`}>{formatValue(col.key, row[col.key])}</span> : formatValue(col.key, row[col.key])}</td>)}<td className="dm-actions" data-label="Aksi"><button type="button" onClick={() => openEdit(row)} aria-label="Edit"><PortalIcon name="edit" /></button><button className="danger" type="button" onClick={() => void remove(row)} aria-label="Hapus"><PortalIcon name="trash" /></button></td></tr>)}
        </tbody></table>
      </div>

      {modalOpen && <div className="portal-modal-layer" role="dialog" aria-modal="true"><button className="portal-modal-backdrop" type="button" onClick={() => setModalOpen(false)} aria-label="Tutup" /><form className="portal-modal" onSubmit={save}><div className="portal-modal-head"><div><p>{editing ? "Edit data" : "Data baru"}</p><h2>{editing ? `Ubah ${label}` : `Tambah ${label}`}</h2></div><button type="button" onClick={() => setModalOpen(false)}><PortalIcon name="x" /></button></div><div className="portal-form-grid">
        {fields.map((field) => <div className={`portal-field ${field.type === "textarea" || field.type === "image" ? "full" : ""}`} key={field.key}><span>{field.label}{field.required ? " *" : ""}</span>{field.type === "textarea" ? <textarea value={String(form[field.key] ?? "")} onChange={(e) => setForm((old) => ({ ...old, [field.key]: e.target.value }))} required={field.required} rows={4} /> : field.type === "select" ? <select value={String(form[field.key] ?? "")} onChange={(e) => setForm((old) => ({ ...old, [field.key]: e.target.value }))} required={field.required}><option value="" disabled>Pilih {field.label.toLowerCase()}</option>{optionsFor(field).map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}</select> : field.type === "checkbox" ? <input className="portal-checkbox" type="checkbox" checked={Boolean(form[field.key])} onChange={(e) => setForm((old) => ({ ...old, [field.key]: e.target.checked }))} /> : field.type === "image" ? <ImageField value={form[field.key]} onChange={(value) => setForm((old) => ({ ...old, [field.key]: value }))} disabled={saving} /> : <input type={field.type ?? "text"} value={String(form[field.key] ?? "")} onChange={(e) => setForm((old) => ({ ...old, [field.key]: e.target.value }))} required={field.required} placeholder={field.placeholder} />}</div>)}
      </div>{error && <div className="portal-alert error">{error}</div>}<div className="portal-modal-actions"><button type="button" className="portal-secondary" onClick={() => setModalOpen(false)}>Batal</button><button type="submit" className="portal-primary" disabled={saving}>{saving ? "Mengunggah & Menyimpan..." : "Simpan Data"}</button></div></form></div>}
    </section>
  );
}
