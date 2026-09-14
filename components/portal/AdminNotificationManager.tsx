"use client";

import { useEffect, useState } from "react";
import { PortalIcon } from "./PortalIcon";
import { TablePagination } from "./DataTableControls";

type NotificationItem = {
  id: number;
  target_role: "admin" | "petugas" | "pengaju";
  target_user_id: number | null;
  judul: string;
  pesan: string;
  jenis: "pengajuan_baru" | "pengajuan_diperbaiki" | "verifikasi";
  referensi_tipe: "ekraf" | "sdm" | "komunitas" | null;
  referensi_id: number | null;
  pengirim_nama: string | null;
  is_read: number;
  created_at: string;
};

type Stats = {
  total: number;
  pengajuanBaru: number;
  pengajuanDiperbaiki: number;
  verifikasi: number;
};

function formatNotifDateTime(value: string) {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function jenisBadgeClass(jenis: string) {
  if (jenis === "pengajuan_baru") return "badge-new";
  if (jenis === "pengajuan_diperbaiki") return "badge-revised";
  if (jenis === "verifikasi") return "badge-verify";
  return "badge-default";
}

function jenisLabel(jenis: string) {
  if (jenis === "pengajuan_baru") return "Pengajuan Baru";
  if (jenis === "pengajuan_diperbaiki") return "Pengajuan Diperbaiki";
  if (jenis === "verifikasi") return "Verifikasi";
  return jenis;
}

function roleBadgeClass(role: string) {
  if (role === "admin") return "role-admin";
  if (role === "petugas") return "role-petugas";
  if (role === "pengaju") return "role-pengaju";
  return "role-default";
}

function tipeLabel(tipe: string | null) {
  if (tipe === "ekraf") return "Pelaku Ekraf";
  if (tipe === "sdm") return "SDM Pariwisata";
  if (tipe === "komunitas") return "Komunitas/Asosiasi";
  return "—";
}

export function AdminNotificationManager() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [jenis, setJenis] = useState("all");
  const [tipe, setTipe] = useState("all");

  const [stats, setStats] = useState<Stats>({
    total: 0,
    pengajuanBaru: 0,
    pengajuanDiperbaiki: 0,
    verifikasi: 0,
  });

  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    if (role !== "all") params.set("role", role);
    if (jenis !== "all") params.set("jenis", jenis);
    if (tipe !== "all") params.set("tipe", tipe);

    fetch(`/api/admin/notifications?${params.toString()}`, { cache: "no-store" })
      .then(async (res) => {
        const payload = await res.json();
        if (!isMounted) return;
        if (!res.ok) throw new Error(payload.message || "Gagal memuat notifikasi.");

        setNotifications(payload.data ?? []);
        setTotalItems(payload.total ?? 0);
        if (payload.stats) setStats(payload.stats);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Gagal memuat notifikasi.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, pageSize, search, role, jenis, tipe]);

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleRoleChange(val: string) {
    setRole(val);
    setPage(1);
  }

  function handleJenisChange(val: string) {
    setJenis(val);
    setPage(1);
  }

  function handleTipeChange(val: string) {
    setTipe(val);
    setPage(1);
  }

  function handleResetFilters() {
    setSearch("");
    setRole("all");
    setJenis("all");
    setTipe("all");
    setPage(1);
  }

  return (
    <section>
      <div className="portal-page-head">
        <div>
          <p className="portal-breadcrumb">Admin / Semua Notifikasi</p>
          <h1>Semua Notifikasi Sistem</h1>
          <p>
            Pantau seluruh rekaman dan arsip notifikasi pengajuan baru, perbaikan berkas, dan verifikasi petugas secara lengkap.
          </p>
        </div>
      </div>

      {/* Ringkasan Statistik */}
      <div className="portal-stat-row">
        <div className="portal-stat-card">
          <span className="stat-icon"><PortalIcon name="bell" /></span>
          <div>
            <small>Total Notifikasi</small>
            <strong>{stats.total}</strong>
            <p>Seluruh riwayat sistem</p>
          </div>
        </div>
        <div className="portal-stat-card">
          <span className="stat-icon"><PortalIcon name="clipboard" /></span>
          <div>
            <small>Pengajuan Baru</small>
            <strong>{stats.pengajuanBaru}</strong>
            <p>Notifikasi awal pengaju</p>
          </div>
        </div>
        <div className="portal-stat-card">
          <span className="stat-icon"><PortalIcon name="refresh" /></span>
          <div>
            <small>Pengajuan Diperbaiki</small>
            <strong>{stats.pengajuanDiperbaiki}</strong>
            <p>Perbaikan data pengaju</p>
          </div>
        </div>
        <div className="portal-stat-card">
          <span className="stat-icon"><PortalIcon name="check" /></span>
          <div>
            <small>Verifikasi Petugas</small>
            <strong>{stats.verifikasi}</strong>
            <p>Disetujui atau ditolak</p>
          </div>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="submission-admin-toolbar notif-admin-toolbar">
        <label className="submission-admin-search">
          <PortalIcon name="search" />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari judul, isi pesan, pengirim…"
          />
        </label>

        <select value={role} onChange={(e) => handleRoleChange(e.target.value)} aria-label="Filter target role">
          <option value="all">Semua Target Role</option>
          <option value="admin">Target: Admin</option>
          <option value="petugas">Target: Petugas</option>
          <option value="pengaju">Target: Pengaju</option>
        </select>

        <select value={jenis} onChange={(e) => handleJenisChange(e.target.value)} aria-label="Filter jenis notifikasi">
          <option value="all">Semua Jenis Notifikasi</option>
          <option value="pengajuan_baru">Pengajuan Baru</option>
          <option value="pengajuan_diperbaiki">Pengajuan Diperbaiki</option>
          <option value="verifikasi">Verifikasi</option>
        </select>

        <select value={tipe} onChange={(e) => handleTipeChange(e.target.value)} aria-label="Filter kategori pengajuan">
          <option value="all">Semua Kategori</option>
          <option value="ekraf">Pelaku Ekraf</option>
          <option value="sdm">SDM Pariwisata</option>
          <option value="komunitas">Komunitas/Asosiasi</option>
        </select>

        {(search || role !== "all" || jenis !== "all" || tipe !== "all") && (
          <button type="button" className="bulk-cancel-btn notif-reset-btn" onClick={handleResetFilters}>
            Reset Filter
          </button>
        )}

        <span>{totalItems} riwayat</span>
      </div>

      {error && <div className="portal-alert error">{error}</div>}

      {/* Tabel Notifikasi */}
      <div className="dm-table-wrap">
        <table className="dm-table notif-table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Jenis</th>
              <th>Judul &amp; Pesan</th>
              <th>Pengirim</th>
              <th>Target Penerima</th>
              <th>Kategori &amp; Ref ID</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="dm-empty">Memuat daftar notifikasi…</td>
              </tr>
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan={8} className="dm-empty">Belum ada riwayat notifikasi yang sesuai filter.</td>
              </tr>
            ) : (
              notifications.map((item) => (
                <tr key={item.id}>
                  <td data-label="Waktu" className="notif-cell-date">
                    <small>{formatNotifDateTime(item.created_at)}</small>
                  </td>
                  <td data-label="Jenis">
                    <span className={`notif-kind-badge ${jenisBadgeClass(item.jenis)}`}>
                      {jenisLabel(item.jenis)}
                    </span>
                  </td>
                  <td data-label="Judul & Pesan" className="notif-cell-content">
                    <strong>{item.judul}</strong>
                    <p>{item.pesan}</p>
                  </td>
                  <td data-label="Pengirim">
                    <span>{item.pengirim_nama || "Sistem / Anonim"}</span>
                  </td>
                  <td data-label="Target">
                    <span className={`notif-role-badge ${roleBadgeClass(item.target_role)}`}>
                      {item.target_role.toUpperCase()}
                      {item.target_user_id ? ` #${item.target_user_id}` : ""}
                    </span>
                  </td>
                  <td data-label="Referensi">
                    {item.referensi_tipe ? (
                      <span className="notif-ref-badge">
                        {tipeLabel(item.referensi_tipe)} {item.referensi_id ? `#${item.referensi_id}` : ""}
                      </span>
                    ) : (
                      <span className="notif-ref-none">—</span>
                    )}
                  </td>
                  <td data-label="Status">
                    <span className={`notif-read-status ${item.is_read ? "read" : "unread"}`}>
                      {item.is_read ? "Dibaca" : "Belum Dibaca"}
                    </span>
                  </td>
                  <td data-label="Aksi">
                    <button
                      type="button"
                      className="review-button notif-detail-btn"
                      onClick={() => setSelectedNotif(item)}
                      title="Lihat Detail Notifikasi"
                    >
                      <PortalIcon name="eye" />
                      Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalItems > 0 && (
        <TablePagination
          totalItems={totalItems}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          itemLabel="notifikasi"
        />
      )}

      {/* Detail Modal */}
      {selectedNotif && (
        <div className="portal-modal-layer" role="dialog" aria-modal="true" aria-labelledby="notif-modal-title">
          <button className="portal-modal-backdrop" type="button" onClick={() => setSelectedNotif(null)} aria-label="Tutup" />
          <div className="portal-modal notif-detail-modal">
            <div className="portal-modal-head">
              <div>
                <p>Notifikasi #{selectedNotif.id}</p>
                <h2 id="notif-modal-title">{selectedNotif.judul}</h2>
              </div>
              <button type="button" onClick={() => setSelectedNotif(null)}><PortalIcon name="x" /></button>
            </div>

            <div className="notif-detail-body">
              <div className="notif-detail-meta-grid">
                <div>
                  <small>Waktu Dibuat</small>
                  <strong>{formatNotifDateTime(selectedNotif.created_at)}</strong>
                </div>
                <div>
                  <small>Jenis Notifikasi</small>
                  <span className={`notif-kind-badge ${jenisBadgeClass(selectedNotif.jenis)}`}>
                    {jenisLabel(selectedNotif.jenis)}
                  </span>
                </div>
                <div>
                  <small>Target Penerima</small>
                  <span className={`notif-role-badge ${roleBadgeClass(selectedNotif.target_role)}`}>
                    {selectedNotif.target_role.toUpperCase()}
                    {selectedNotif.target_user_id ? ` (User ID: ${selectedNotif.target_user_id})` : " (Semua Akun)"}
                  </span>
                </div>
                <div>
                  <small>Pengirim</small>
                  <strong>{selectedNotif.pengirim_nama || "Sistem"}</strong>
                </div>
                <div>
                  <small>Referensi Pengajuan</small>
                  <strong>{tipeLabel(selectedNotif.referensi_tipe)} {selectedNotif.referensi_id ? `(ID: ${selectedNotif.referensi_id})` : ""}</strong>
                </div>
                <div>
                  <small>Status Dibaca</small>
                  <span className={`notif-read-status ${selectedNotif.is_read ? "read" : "unread"}`}>
                    {selectedNotif.is_read ? "Sudah Dibaca" : "Belum Dibaca"}
                  </span>
                </div>
              </div>

              <div className="notif-detail-message-box">
                <small>Isi Pesan Notifikasi Lengkap</small>
                <p>{selectedNotif.pesan}</p>
              </div>

              <div className="notif-audit-note">
                <PortalIcon name="check" />
                <span>
                  Rekaman ini dipertahankan secara permanen di database sebagai riwayat audit aktivitas portal SI PARIK BANGKA, sekalipun berkas fisik pengajuan telah dibersihkan oleh petugas.
                </span>
              </div>
            </div>

            <div className="portal-modal-actions">
              <button type="button" className="portal-secondary" onClick={() => setSelectedNotif(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
