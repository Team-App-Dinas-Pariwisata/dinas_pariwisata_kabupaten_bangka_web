"use client";

import { useCallback, useEffect, useState } from "react";
import type { WhatsAppServiceStatus } from "@/lib/whatsapp";
import { PortalIcon } from "./PortalIcon";

const stateLabels: Record<WhatsAppServiceStatus["state"], string> = {
  unconfigured: "Belum dikonfigurasi",
  ready: "Terhubung",
  disconnected: "Terputus",
  qr: "Menunggu QR",
  error: "Bermasalah",
  stopped: "Dihentikan",
};

function maskDeviceId(deviceId: string | null | undefined) {
  if (!deviceId) return "—";
  if (deviceId.length <= 12) return deviceId;
  return `${deviceId.slice(0, 8)}…${deviceId.slice(-4)}`;
}

export function WhatsAppManager() {
  const [status, setStatus] = useState<WhatsAppServiceStatus | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(
    "Tes notifikasi SI PARIK melalui FlazHost WhatsApp Gateway.",
  );

  const loadStatus = useCallback(async (showError = false) => {
    try {
      const response = await fetch("/api/admin/whatsapp", { cache: "no-store" });
      const data = await response.json() as {
        status?: WhatsAppServiceStatus;
        message?: string;
      };
      if (!response.ok || !data.status) {
        throw new Error(data.message || "Status WhatsApp gagal dimuat.");
      }
      setStatus(data.status);
      setError("");
    } catch (loadError) {
      if (showError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Status WhatsApp gagal dimuat.",
        );
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStatus(true), 0);
    return () => window.clearTimeout(timer);
  }, [loadStatus]);

  async function sendTestMessage() {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          phone: testPhone,
          message: testMessage,
        }),
      });

      const data = await response.json() as {
        message?: string;
        messageId?: string | null;
      };

      if (!response.ok) {
        throw new Error(data.message || "Pesan tes gagal dikirim.");
      }

      setNotice(
        data.messageId
          ? `${data.message || "Pesan tes berhasil dikirim."} ID: ${data.messageId}`
          : (data.message || "Pesan tes berhasil dikirim."),
      );
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Pesan tes gagal dikirim.",
      );
    } finally {
      setBusy(false);
    }
  }

  const state = status?.state || "disconnected";
  const isReady = status?.ready === true;
  const remoteStatus = status?.providerDetails?.remoteStatus || "—";

  return (
    <section className="wa-admin-page">
      <div className="portal-page-head">
        <div>
          <p className="portal-breadcrumb">Admin / Koneksi WhatsApp</p>
          <h1>FlazHost WhatsApp Gateway</h1>
          <p>
            Seluruh notifikasi WhatsApp SI PARIK dikirim melalui REST API FlazHost.
          </p>
        </div>
        <button
          className="portal-secondary"
          type="button"
          onClick={() => void loadStatus(true)}
          disabled={busy}
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
              <small>Provider aktif: {status?.providerLabel || "FlazHost WhatsApp Gateway"}</small>
            </div>
          </div>

          <p className="wa-state-message">
            {status?.message || "Memeriksa perangkat FlazHost."}
          </p>

          <div className={`wa-status-illustration ${isReady ? "ready" : "waiting"}`}>
            <span><PortalIcon name={isReady ? "check" : "whatsapp"} /></span>
            <div>
              <strong>{isReady ? "Gateway siap digunakan" : "Gateway belum siap"}</strong>
              <p>
                QR, koneksi nomor, dan pengelolaan device dilakukan dari dashboard FlazHost.
                Portal ini hanya membaca status device dan mengirim notifikasi melalui API.
              </p>
            </div>
          </div>

          <div className="wa-actions" style={{ alignItems: "stretch" }}>
            <div style={{ width: "100%", display: "grid", gap: 10 }}>
              <label>
                <span style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                  Nomor tujuan tes
                </span>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(event) => setTestPhone(event.target.value)}
                  placeholder="081234567890"
                  disabled={busy}
                  style={{ width: "100%" }}
                />
              </label>
              <label>
                <span style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                  Pesan tes
                </span>
                <textarea
                  value={testMessage}
                  onChange={(event) => setTestMessage(event.target.value)}
                  rows={3}
                  disabled={busy}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </label>
              <button
                className="portal-primary"
                type="button"
                disabled={busy || !status?.configured || !testPhone.trim() || !testMessage.trim()}
                onClick={() => void sendTestMessage()}
              >
                <PortalIcon name="whatsapp" />
                {busy ? "Mengirim…" : "Kirim Pesan Tes"}
              </button>
            </div>
          </div>
        </article>

        <aside className="wa-info-card">
          <div className="wa-info-title">
            <PortalIcon name="whatsapp" />
            <div>
              <small>Provider</small>
              <strong>{status?.providerLabel || "FlazHost WhatsApp Gateway"}</strong>
            </div>
          </div>
          <dl>
            <div><dt>Device ID</dt><dd>{maskDeviceId(status?.providerDetails?.deviceId)}</dd></div>
            <div><dt>Status FlazHost</dt><dd>{remoteStatus}</dd></div>
            <div><dt>Platform</dt><dd>{status?.account?.platform || "FlazHost"}</dd></div>
            <div><dt>API Base URL</dt><dd>{status?.providerDetails?.apiBaseUrl || "—"}</dd></div>
          </dl>
          {status?.lastError && (
            <div className="wa-last-error">
              <strong>Detail terakhir</strong>
              <p>{status.lastError}</p>
            </div>
          )}
          <div className="wa-security-note">
            <PortalIcon name="check" />
            <p>
              API key disimpan hanya di server melalui FLAZHOST_WA_KEY dan tidak dikirim ke browser.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
