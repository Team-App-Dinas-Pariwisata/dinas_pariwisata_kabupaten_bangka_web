"use client";

import { useEffect, useState } from "react";
import { PortalIcon } from "./PortalIcon";

export function AdminFeatureSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [massDeleteEnabled, setMassDeleteEnabled] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/admin/settings", { cache: "no-store" })
      .then(async (res) => {
        const payload = await res.json();
        if (!isMounted) return;
        if (!res.ok) throw new Error(payload.message || "Gagal memuat pengaturan sistem.");
        setMassDeleteEnabled(Boolean(payload.data?.petugas_mass_delete_enabled));
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Gagal memuat pengaturan sistem.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleToggleMassDelete(nextState: boolean) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petugas_mass_delete_enabled: nextState }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Gagal menyimpan pengaturan.");
      setMassDeleteEnabled(Boolean(payload.data?.petugas_mass_delete_enabled));
      setSuccess(
        nextState
          ? "Fitur Hapus Massal pengajuan untuk akun petugas berhasil DIAKTIFKAN."
          : "Fitur Hapus Massal pengajuan untuk akun petugas berhasil DINONAKTIFKAN.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui pengaturan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="portal-page-head">
        <div>
          <p className="portal-breadcrumb">Admin / Pengaturan Fitur</p>
          <h1>Pengaturan Fitur &amp; Kebijakan Portal</h1>
          <p>
            Konfigurasi hak akses dan kapabilitas fitur operasional portal SI PARIK BANGKA untuk akun petugas.
          </p>
        </div>
      </div>

      {error && <div className="portal-alert error">{error}</div>}
      {success && <div className="portal-alert success">{success}</div>}

      <div className="settings-card feature-settings-card">
        <div className="feature-card-header">
          <div className="feature-card-icon">
            <PortalIcon name="trash" />
          </div>
          <div className="feature-card-title">
            <div className="feature-title-row">
              <h2>Fitur Hapus Massal Pengajuan (Petugas)</h2>
              <span className={`feature-status-badge ${massDeleteEnabled ? "active" : "inactive"}`}>
                {loading ? "Memuat…" : massDeleteEnabled ? "Aktif" : "Dinonaktifkan"}
              </span>
            </div>
            <p>
              Kontrol apakah akun berwenang Petugas diizinkan memilih banyak data pengajuan sekaligus dan menghapusnya secara permanen.
            </p>
          </div>
          <div className="feature-card-toggle">
            <label className="switch-toggle" aria-label="Toggle Fitur Hapus Massal Pengajuan">
              <input
                type="checkbox"
                checked={massDeleteEnabled}
                disabled={loading || saving}
                onChange={(e) => void handleToggleMassDelete(e.target.checked)}
              />
              <span className="slider-round" />
            </label>
          </div>
        </div>

        <div className="feature-card-divider" />

        <div className="feature-details-grid">
          <div className="feature-detail-box">
            <div className="detail-box-head">
              <span className="detail-icon"><PortalIcon name="check" /></span>
              <strong>Ketika Fitur Ini Aktif</strong>
            </div>
            <ul>
              <li>Akun petugas dapat memilih pengajuan lewat checkbox baris dan tombol <em>&quot;Pilih Semua&quot;</em>.</li>
              <li>Tersedia tombol aksi <em>&quot;Hapus Terpilih&quot;</em> yang memproses penghapusan banyak data sekaligus.</li>
              <li>Penghapusan membersihkan berkas di Cloudflare R2 sementara <strong>histori notifikasi tetap tersimpan</strong> sebagai arsip audit admin.</li>
              <li>Dilengkapi jendela konfirmasi dan preloader proses penghapusan.</li>
            </ul>
          </div>

          <div className="feature-detail-box">
            <div className="detail-box-head">
              <span className="detail-icon"><PortalIcon name="x" /></span>
              <strong>Ketika Fitur Ini Dinonaktifkan</strong>
            </div>
            <ul>
              <li>Pilihan seleksi massal dan tombol hapus disembunyikan dari dashboard petugas.</li>
              <li>Petugas hanya dapat meninjau, menyetujui, atau menolak pengajuan (mode proteksi data).</li>
              <li>Permintaan penghapusan melalui API akan langsung ditolak oleh server (HTTP 403).</li>
              <li>Mencegah risiko kehilangan data pengajuan publik akibat kesalahan operasional.</li>
            </ul>
          </div>
        </div>

        <div className="feature-card-footer">
          <div className="affected-modules">
            <span>Modul yang terpengaruh:</span>
            <span className="badge-tag">Pengajuan Pelaku Ekraf</span>
            <span className="badge-tag">Pengajuan SDM Pariwisata</span>
            <span className="badge-tag">Pengajuan Komunitas &amp; Asosiasi</span>
          </div>
          {saving && <span className="settings-saving-indicator"><PortalIcon name="clock" /> Menyimpan perubahan…</span>}
        </div>
      </div>
    </section>
  );
}
