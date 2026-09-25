"use client";

import { type FormEvent, useEffect, useState } from "react";
import { PortalIcon } from "./PortalIcon";

function computeWaLink(phone: string, text: string) {
  const digits = phone.replace(/\D+/g, "");
  if (!digits) return "";
  let norm = digits;
  if (norm.startsWith("620")) norm = `62${norm.slice(3)}`;
  else if (norm.startsWith("0")) norm = `62${norm.slice(1)}`;
  else if (norm.startsWith("8")) norm = `62${norm}`;
  const base = `https://wa.me/${norm}`;
  return text.trim() ? `${base}?text=${encodeURIComponent(text.trim())}` : base;
}

export function AdminFeatureSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [massDeleteEnabled, setMassDeleteEnabled] = useState(true);

  // WhatsApp Chat Settings state
  const [waNumber, setWaNumber] = useState("");
  const [waMessage, setWaMessage] = useState("");
  const [waEnabled, setWaEnabled] = useState(true);
  const [waSaving, setWaSaving] = useState(false);
  const [waSuccess, setWaSuccess] = useState("");
  const [waError, setWaError] = useState("");

  useEffect(() => {
    let isMounted = true;
    fetch("/api/admin/settings", { cache: "no-store" })
      .then(async (res) => {
        const payload = await res.json();
        if (!isMounted) return;
        if (!res.ok) throw new Error(payload.message || "Gagal memuat pengaturan sistem.");
        setMassDeleteEnabled(Boolean(payload.data?.petugas_mass_delete_enabled));
        setWaNumber(String(payload.data?.chat_whatsapp_number ?? "081200002026"));
        setWaMessage(String(payload.data?.chat_whatsapp_message ?? ""));
        setWaEnabled(Boolean(payload.data?.chat_whatsapp_enabled ?? true));
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

  async function handleSaveWhatsApp(e: FormEvent) {
    e.preventDefault();
    setWaSaving(true);
    setWaError("");
    setWaSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_whatsapp_number: waNumber,
          chat_whatsapp_message: waMessage,
          chat_whatsapp_enabled: waEnabled,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Gagal menyimpan pengaturan WhatsApp.");
      setWaNumber(String(payload.data?.chat_whatsapp_number ?? waNumber));
      setWaMessage(String(payload.data?.chat_whatsapp_message ?? waMessage));
      setWaEnabled(Boolean(payload.data?.chat_whatsapp_enabled ?? waEnabled));
      setWaSuccess("Pengaturan nomor WhatsApp chat berhasil disimpan di database!");
    } catch (err) {
      setWaError(err instanceof Error ? err.message : "Gagal menyimpan pengaturan WhatsApp.");
    } finally {
      setWaSaving(false);
    }
  }

  async function handleToggleWa(nextState: boolean) {
    setWaEnabled(nextState);
    setWaSaving(true);
    setWaError("");
    setWaSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_whatsapp_enabled: nextState }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Gagal memperbarui status tombol WhatsApp.");
      setWaEnabled(Boolean(payload.data?.chat_whatsapp_enabled));
      setWaSuccess(
        nextState
          ? "Tautan WhatsApp di kotak chat pengunjung berhasil DIAKTIFKAN."
          : "Tautan WhatsApp di kotak chat pengunjung berhasil DINONAKTIFKAN.",
      );
    } catch (err) {
      setWaError(err instanceof Error ? err.message : "Gagal memperbarui status.");
      setWaEnabled(!nextState);
    } finally {
      setWaSaving(false);
    }
  }

  const liveWaUrl = computeWaLink(waNumber, waMessage);

  return (
    <section>
      <div className="portal-page-head">
        <div>
          <p className="portal-breadcrumb">Admin / Pengaturan Fitur</p>
          <h1>Pengaturan Fitur &amp; Kebijakan Portal</h1>
          <p>
            Konfigurasi hak akses, kontak WhatsApp layanan, dan kapabilitas fitur operasional portal SI PARIK BANGKA.
          </p>
        </div>
      </div>

      {error && <div className="portal-alert error">{error}</div>}
      {success && <div className="portal-alert success">{success}</div>}

      {/* CARD 1: PENGATURAN WHATSAPP CHAT PETUGAS */}
      <div className="settings-card feature-settings-card" style={{ marginBottom: "24px" }}>
        <div className="feature-card-header">
          <div className="feature-card-icon wa-feature-icon">
            <PortalIcon name="whatsapp" />
          </div>
          <div className="feature-card-title">
            <div className="feature-title-row">
              <h2>Kontak WhatsApp Kotak Chat Pengunjung</h2>
              <span className={`feature-status-badge ${waEnabled ? "active" : "inactive"}`}>
                {loading ? "Memuat…" : waEnabled ? "Aktif" : "Dinonaktifkan"}
              </span>
            </div>
            <p>
              Atur nomor WhatsApp resmi petugas dan template pesan pembuka yang muncul di bagian atas kotak chat pengunjung (Pojok Bincang).
            </p>
          </div>
          <div className="feature-card-toggle">
            <label className="switch-toggle" aria-label="Toggle Tautan WhatsApp di Kotak Chat">
              <input
                type="checkbox"
                checked={waEnabled}
                disabled={loading || waSaving}
                onChange={(e) => void handleToggleWa(e.target.checked)}
              />
              <span className="slider-round" />
            </label>
          </div>
        </div>

        <div className="feature-card-divider" />

        {waError && <div className="portal-alert error" style={{ marginBottom: "16px" }}>{waError}</div>}
        {waSuccess && <div className="portal-alert success" style={{ marginBottom: "16px" }}>{waSuccess}</div>}

        <form onSubmit={handleSaveWhatsApp} className="wa-settings-form">
          <div className="portal-form-grid">
            <label className="portal-field">
              <span>Nomor WhatsApp Petugas / Dinas *</span>
              <input
                type="text"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                placeholder="Contoh: 081234567890 atau 6281234567890"
                required
                disabled={loading || waSaving}
              />
              <small className="field-hint">
                Mendukung awalan 08 atau 62. Sistem otomatis mengonversinya menjadi format tautan WhatsApp resmi (wa.me).
              </small>
            </label>

            <label className="portal-field full">
              <span>Pesan Pembuka Otomatis (Template)</span>
              <textarea
                rows={3}
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                placeholder="Contoh: Halo Petugas SI PARIK Dinas Pariwisata Kabupaten Bangka, saya ingin bertanya..."
                disabled={loading || waSaving}
              />
              <small className="field-hint">
                Pesan ini akan otomatis terisi di kolom chat WhatsApp pengunjung saat mereka menekan tombol WhatsApp.
              </small>
            </label>
          </div>

          {/* PREVIEW BOX */}
          <div className="wa-preview-card">
            <div className="wa-preview-head">
              <span className="wa-preview-badge">
                <PortalIcon name="eye" /> Pratinjau Tautan Pengunjung
              </span>
              {liveWaUrl && (
                <a
                  href={liveWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wa-preview-test-link"
                >
                  <PortalIcon name="whatsapp" />
                  <span>Uji Coba Tautan WhatsApp</span>
                </a>
              )}
            </div>
            <div className="wa-preview-body">
              <div className="wa-preview-field">
                <span className="wa-preview-label">URL wa.me yang dihasilkan:</span>
                <code className="wa-preview-code">{liveWaUrl || "(Nomor WhatsApp belum valid)"}</code>
              </div>
              <div className="wa-preview-field">
                <span className="wa-preview-label">Status Tampilan Publik:</span>
                <span className="wa-preview-text">
                  {waEnabled
                    ? "Tautan dan ikon WhatsApp TAMPIL di bagian atas kotak chat pengunjung (Pojok Bincang)."
                    : "Tautan dan ikon WhatsApp DISEMBUNYIKAN dari pengunjung."}
                </span>
              </div>
            </div>
          </div>

          <div className="portal-modal-actions" style={{ marginTop: "20px" }}>
            <button
              type="submit"
              className="portal-primary"
              disabled={loading || waSaving || !waNumber.trim()}
            >
              {waSaving ? "Menyimpan Pengaturan..." : "Simpan Pengaturan WhatsApp"}
            </button>
          </div>
        </form>

        <div className="feature-card-footer" style={{ marginTop: "20px" }}>
          <div className="affected-modules">
            <span>Komponen terhubung:</span>
            <span className="badge-tag">Kotak Chat Pojok Bincang (Header)</span>
            <span className="badge-tag">Banner Cepat Chat Petugas</span>
            <span className="badge-tag">Tabel Database: pengaturan_sistem</span>
          </div>
          {waSaving && (
            <span className="settings-saving-indicator">
              <PortalIcon name="clock" /> Menyimpan perubahan ke database…
            </span>
          )}
        </div>
      </div>

      {/* CARD 2: FITUR HAPUS MASSAL PENGAJUAN */}
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

