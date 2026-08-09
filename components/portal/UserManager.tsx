"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { PortalIcon } from "./PortalIcon";

type User = { id: number; name: string; email: string; phone: string | null; status: "active" | "inactive"; last_login_at: string | null; created_at: string };

export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", status: "active" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mengambil pengguna.");
      setUsers(result.data);
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal mengambil pengguna."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? users.filter((u) => `${u.name} ${u.email} ${u.phone ?? ""}`.toLowerCase().includes(q)) : users;
  }, [users, query]);

  function create() { setEditing(null); setForm({ name: "", email: "", phone: "", password: "", status: "active" }); setError(""); setOpen(true); }
  function edit(user: User) { setEditing(user); setForm({ name: user.name, email: user.email, phone: user.phone ?? "", password: "", status: user.status }); setError(""); setOpen(true); }

  async function save(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/admin/users", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing?.id, ...form }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.message || "Gagal menyimpan pengguna.");
      setOpen(false); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan pengguna."); }
    finally { setSaving(false); }
  }

  async function remove(user: User) {
    if (!window.confirm(`Hapus pengguna ${user.name}?`)) return;
    const response = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id }) });
    const result = await response.json(); if (!response.ok) { setError(result.message || "Gagal menghapus pengguna."); return; }
    await load();
  }

  return <section><div className="portal-page-head"><div><p className="portal-breadcrumb">Admin / Pengguna</p><h1>Kelola Pengguna</h1><p>Administrator hanya dapat membuat, melihat, mengubah, dan menghapus akun pengguna.</p></div><button className="portal-primary" type="button" onClick={create}><PortalIcon name="plus"/>Tambah Pengguna</button></div>
    <div className="portal-stat-row compact"><div className="portal-stat-card"><span className="stat-icon"><PortalIcon name="users"/></span><div><small>Total Pengguna</small><strong>{users.length}</strong><p>Akun role pengguna</p></div></div><div className="portal-stat-card"><span className="stat-icon"><PortalIcon name="users"/></span><div><small>Aktif</small><strong>{users.filter((u) => u.status === "active").length}</strong><p>Dapat masuk dashboard</p></div></div></div>
    <div className="dm-toolbar"><label><PortalIcon name="search"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, email, atau telepon..." /></label><span>{filtered.length} pengguna</span></div>
    {error && !open && <div className="portal-alert error">{error}</div>}
    <div className="dm-table-wrap"><table className="dm-table"><thead><tr><th>Nama</th><th>Email</th><th>Telepon</th><th>Status</th><th>Login Terakhir</th><th>Aksi</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="dm-empty">Memuat pengguna...</td></tr> : filtered.length === 0 ? <tr><td colSpan={6} className="dm-empty">Belum ada akun pengguna.</td></tr> : filtered.map((u) => <tr key={u.id}><td data-label="Nama"><strong>{u.name}</strong></td><td data-label="Email">{u.email}</td><td data-label="Telepon">{u.phone || "—"}</td><td data-label="Status"><span className={`portal-status ${u.status}`}>{u.status === "active" ? "Aktif" : "Nonaktif"}</span></td><td data-label="Login Terakhir">{u.last_login_at || "Belum pernah"}</td><td className="dm-actions" data-label="Aksi"><button type="button" onClick={() => edit(u)}><PortalIcon name="edit"/></button><button type="button" className="danger" onClick={() => void remove(u)}><PortalIcon name="trash"/></button></td></tr>)}</tbody></table></div>
    {open && <div className="portal-modal-layer"><button className="portal-modal-backdrop" type="button" onClick={() => setOpen(false)} aria-label="Tutup"/><form className="portal-modal small" onSubmit={save}><div className="portal-modal-head"><div><p>Akun pengguna</p><h2>{editing ? "Edit Pengguna" : "Tambah Pengguna"}</h2></div><button type="button" onClick={() => setOpen(false)}><PortalIcon name="x"/></button></div><div className="portal-form-grid"><label className="portal-field"><span>Nama *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label><label className="portal-field"><span>Email *</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label><label className="portal-field"><span>No. Telepon</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label className="portal-field"><span>{editing ? "Kata Sandi Baru" : "Kata Sandi *"}</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} minLength={8} placeholder={editing ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"}/></label><label className="portal-field"><span>Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select></label></div>{error && <div className="portal-alert error">{error}</div>}<div className="portal-modal-actions"><button type="button" className="portal-secondary" onClick={() => setOpen(false)}>Batal</button><button className="portal-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Pengguna"}</button></div></form></div>}
  </section>;
}
