"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { WhatsAppServiceStatus } from "@/lib/whatsapp";
import { PortalIcon } from "./PortalIcon";

const stateLabels: Record<WhatsAppServiceStatus["state"], string> = {
  unconfigured: "Belum dikonfigurasi",
  idle: "Siap dimulai",
  starting: "Menghubungkan",
  qr: "Menunggu pemindaian QR",
  authenticated: "QR diterima",
  ready: "Terhubung",
  disconnected: "Terputus",
  auth_failure: "Sesi ditolak",
  error: "Bermasalah",
  stopped: "Dihentikan",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

function maskPhone(phone: string | null | undefined) {
  if (!phone) return "—";
  return phone.startsWith("+") ? phone : `+${phone}`;
}

export function WhatsAppManager() {
  const [status, setStatus] = useState<WhatsAppServiceStatus | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyAction, setBusyAction] = useState<"restart" | "reset" | null>(null);

  const loadStatus = useCallback(async (showError = false) => {
    try {
      const response = await fetch("/api/admin/whatsapp", { cache: "no-store" });
      const data = await response.json() as { status?: WhatsAppServiceStatus; message?: string };
      if (!response.ok || !data.status) throw new Error(data.message || "Status WhatsApp gagal dimuat.");
      setStatus(data.status);
      setError("");
    } catch (loadError) {
      if (showError) {
        setError(loadError instanceof Error ? loadError.message : "Status WhatsApp gagal dimuat.");
      }
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void loadStatus(true), 0);
    return () => window.clearTimeout(initialTimer);
  }, [loadStatus]);

  useEffect(() => {
    // Status whatsapp-web.js berubah cepat saat membuat QR, sehingga perlu polling.
    // Status Fonnte cukup dimuat sekali agar API profil perangkat tidak terkena limit.
    if (status?.provider !== "webjs") return;
    const timer = window.setInterval(() => void loadStatus(false), 3_000);
    return () => window.clearInterval(timer);
  }, [loadStatus, status?.provider]);

  async function runAction(action: "restart" | "reset") {
    if (action === "reset") {
      const confirmed = window.confirm(
        "Hapus sesi WhatsApp saat ini? Nomor akan terputus dan Anda wajib memindai QR baru.",
      );
      if (!confirmed) return;
    }

    setBusyAction(action);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "reset" ? { confirmation: "RESET" } : {}),
        }),
      });
      const data = await response.json() as {
        status?: WhatsAppServiceStatus;
        message?: string;
      };
      if (!response.ok) throw new Error(data.message || "Aksi gagal diproses.");
      if (data.status) setStatus(data.status);
      setNotice(data.message || "Perintah berhasil dikirim.");
      window.setTimeout(() => void loadStatus(false), 1_500);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Aksi gagal diproses.");
    } finally {
      setBusyAction(null);
    }
  }

  const state = status?.state || "starting";
  const isReady = status?.ready === true;
  const isFonnte = status?.provider === "fonnte";
  const showQr = status?.provider === "webjs"
    && status.state === "qr"
    && Boolean(status.qrDataUrl);

  return (
    <section className="wa-admin-page">
      <div className="portal-page-head">
        <div>
          <p className="portal-breadcrumb">Admin / Koneksi WhatsApp</p>
          <h1>Koneksi WhatsApp</h1>
          <p>
            {isFonnte
              ? "Notifikasi saat ini dikirim melalui provider Fonnte."
              : "Pindai QR satu kali untuk mengaktifkan service WhatsApp Node.js."}
          </p>
        </div>
        <button
          className="portal-secondary"
          type="button"
          onClick={() => void loadStatus(true)}
          disabled={Boolean(busyAction)}
        >
          <PortalIcon name="refresh" />
          Perbarui Status
        </button>
      </div>

      {error && <div className="portal-alert error wa-admin-alert">{error}</div>}
      {notice && <div className="portal-alert success wa-admin-alert">{notice}</div>}

      <div className="wa-admin-grid">
        <article className="wa-connection-card">
          <div className="wa-card-heading">
            <span className={`wa-state-dot ${isReady ? "ready" : state}`} />
            <div>
              <small>Status koneksi</small>
              <h2>{status ? stateLabels[status.state] : "Memuat status…"}</h2>
              {status && <small>Provider aktif: {status.providerLabel}</small>}
            </div>
          </div>

          <p className="wa-state-message">
            {status?.message || "Menghubungi service WhatsApp di Railway."}
          </p>

          {showQr ? (
            <div className="wa-qr-area">
              <div className="wa-qr-frame">
                <Image
                  src={status?.qrDataUrl || ""}
                  alt="QR untuk menautkan WhatsApp"
                  width={360}
                  height={360}
                  unoptimized
                />
              </div>
              <div className="wa-qr-guide">
                <strong>Cara memindai</strong>
                <ol>
                  <li>Buka WhatsApp di ponsel.</li>
                  <li>Pilih <b>Perangkat tertaut</b>.</li>
                  <li>Tekan <b>Tautkan perangkat</b>, lalu pindai QR.</li>
                </ol>
                <small>QR diperbarui otomatis jika kedaluwarsa.</small>
              </div>
            </div>
          ) : (
            <div className={`wa-status-illustration ${isReady ? "ready" : "waiting"}`}>
              <span><PortalIcon name={isReady ? "check" : "whatsapp"} /></span>
              <div>
                <strong>
                  {isFonnte
                    ? (isReady ? "Fonnte siap digunakan" : "Fonnte belum terhubung")
                    : (isReady ? "Notifikasi aktif" : "Menunggu service")}
                </strong>
                <p>
                  {isFonnte
                    ? "Koneksi nomor, QR, paket, dan perangkat dikelola melalui dashboard Fonnte."
                    : isReady
                      ? "Sesi tersimpan permanen; deploy atau restart berikutnya tidak memerlukan QR baru."
                      : "QR akan muncul di sini saat WhatsApp Web selesai dimuat."}
                </p>
              </div>
            </div>
          )}

          {status?.supportsSessionControl !== false && (
            <div className="wa-actions">
              <button
                className="portal-primary"
                type="button"
                disabled={Boolean(busyAction) || status?.configured === false}
                onClick={() => void runAction("restart")}
              >
                <PortalIcon name="refresh" />
                {busyAction === "restart" ? "Memulai ulang…" : "Mulai Ulang Koneksi"}
              </button>
              <button
                className="wa-danger-button"
                type="button"
                disabled={Boolean(busyAction) || status?.configured === false}
                onClick={() => void runAction("reset")}
              >
                {busyAction === "reset" ? "Menghapus sesi…" : "Hapus Sesi & Buat QR Baru"}
              </button>
            </div>
          )}
        </article>

        <aside className="wa-info-card">
          <div className="wa-info-title">
            <PortalIcon name="whatsapp" />
            <div><small>Perangkat aktif</small><strong>{status?.account?.name || "Belum ada akun"}</strong></div>
          </div>
          <dl>
            <div><dt>Provider</dt><dd>{status?.providerLabel || "—"}</dd></div>
            <div><dt>Nomor WhatsApp</dt><dd>{maskPhone(status?.account?.phone)}</dd></div>
            <div><dt>Platform</dt><dd>{status?.account?.platform || "—"}</dd></div>
            {isFonnte ? (
              <>
                <div><dt>Paket</dt><dd>{status?.providerDetails?.packageName || "—"}</dd></div>
                <div><dt>Sisa kuota</dt><dd>{status?.providerDetails?.quota || "—"}</dd></div>
                <div><dt>Masa aktif</dt><dd>{status?.providerDetails?.expired || "—"}</dd></div>
              </>
            ) : (
              <>
                <div><dt>Terhubung sejak</dt><dd>{formatDate(status?.lastReadyAt || null)}</dd></div>
                <div><dt>Aktivitas terakhir</dt><dd>{formatDate(status?.lastEventAt || null)}</dd></div>
              </>
            )}
          </dl>
          {status?.lastError && (
            <div className="wa-last-error">
              <strong>Detail terakhir</strong>
              <p>{status.lastError}</p>
            </div>
          )}
          <div className="wa-security-note">
            <PortalIcon name="check" />
            <p>QR dan kendali koneksi hanya tersedia untuk akun dengan role admin.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
