"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useCallback } from "react";
import { PortalIcon } from "@/components/portal/PortalIcon";
import { TablePagination } from "@/components/portal/DataTableControls";
import { startPortalLoading, stopPortalLoading } from "@/components/portal/PortalPreloader";
import { submissionConfigs, type SubmissionField, type SubmissionType } from "@/lib/submission-config";

export type SubmissionItem = {
  id: number;
  type: "ekraf" | "sdm" | "komunitas";
  typeLabel: string;
  title: string;
  noRegistrasi: string;
  status: string;
  createdAt: string;
  canEdit: boolean;
};

type ApplicantFullRow = Record<string, unknown> & {
  id: number;
  no_registrasi?: string | null;
  status_label?: string | null;
  catatan_verifikasi?: string | null;
  can_edit?: boolean;
  created_at?: string;
  nama_lengkap?: string | null;
  nama_usaha?: string | null;
  nama_organisasi?: string | null;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("disetujui")) return "approved";
  if (normalized.includes("ditolak")) return "rejected";
  if (normalized.includes("perbaikan")) return "revision";
  return "pending";
}

function editHref(type: SubmissionItem["type"], id: number) {
  const segment = type === "ekraf" ? "pelaku-ekraf" : type === "sdm" ? "sdm-pariwisata" : "komunitas";
  return `/akun/pengajuan/${segment}/${id}/edit`;
}

function fieldDisplayValue(row: Record<string, unknown>, field: SubmissionField) {
  const value = row[field.key];
  if (value === null || value === undefined || value === "") return "—";
  if (field.type === "checkbox") return Number(value) === 1 || value === true ? "Ya" : "Tidak";
  if (field.type === "date") return formatDate(String(value));
  if (field.key.includes("tanggal_") || field.key.endsWith("_at")) return formatDate(String(value));
  if (field.key === "omzet_per_tahun") {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
  }
  return String(value);
}

function submissionTitle(type: SubmissionType, data: Record<string, unknown>) {
  if (type === "komunitas") return String(data.nama_organisasi ?? "Pengajuan Komunitas");
  if (type === "sdm") return String(data.nama_lengkap ?? data.tempat_bertugas ?? "Pengajuan SDM");
  return String(data.nama_usaha ?? data.nama_lengkap ?? "Pengajuan Pelaku Ekraf");
}

export function ApplicantHistory({ items }: { items: SubmissionItem[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [selectedSubmission, setSelectedSubmission] = useState<ApplicantFullRow | null>(null);
  const [selectedJenis, setSelectedJenis] = useState<SubmissionType>("ekraf");
  const [detailStep, setDetailStep] = useState(0);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorDetail, setErrorDetail] = useState("");

  const openSubmissionDialog = useCallback(async (jenis: SubmissionType, id: number) => {
    setLoadingDetail(true);
    setErrorDetail("");
    startPortalLoading("Memuat detail pengajuan…");
    try {
      const res = await fetch(`/api/akun/submissions?type=${jenis}&id=${id}`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Gagal memuat detail pengajuan.");
      setSelectedSubmission(payload.data);
      setSelectedJenis(jenis);
      setDetailStep(0);
    } catch (err) {
      setErrorDetail(err instanceof Error ? err.message : "Gagal memuat pengajuan.");
    } finally {
      setLoadingDetail(false);
      stopPortalLoading();
    }
  }, []);

  // Listen to openApplicantSubmissionReview custom event or check search params
  useEffect(() => {
    function handleOpen(e: Event) {
      const detail = (e as CustomEvent).detail as { jenis: SubmissionType; id: number } | undefined;
      if (detail?.jenis && detail?.id) {
        void openSubmissionDialog(detail.jenis, detail.id);
      }
    }

    window.addEventListener("openApplicantSubmissionReview", handleOpen);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const reviewType = params.get("reviewType") as SubmissionType | null;
      const reviewId = Number(params.get("reviewId"));
      if (reviewType && ["ekraf", "sdm", "komunitas"].includes(reviewType) && Number.isInteger(reviewId) && reviewId > 0) {
        void openSubmissionDialog(reviewType, reviewId);
        window.history.replaceState({}, "", "/akun");
      }
    }

    return () => window.removeEventListener("openApplicantSubmissionReview", handleOpen);
  }, [openSubmissionDialog]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return (
    <section className="applicant-history-card">
      <div className="applicant-section-title">
        <div>
          <p>RIWAYAT</p>
          <h2>Pengajuan saya</h2>
        </div>
        <span>{items.length} data</span>
      </div>

      {errorDetail && (
        <div className="portal-alert error" style={{ marginBottom: "16px" }}>
          {errorDetail}
        </div>
      )}

      {items.length > 0 ? (
        <>
          <div className="applicant-history-list">
            {pagedItems.map((item) => (
              <article key={`${item.type}-${item.id}`}>
                <div className="history-type">
                  <span>{item.typeLabel}</span>
                  <strong>{item.title}</strong>
                  <small>{item.noRegistrasi} · {formatDate(item.createdAt)}</small>
                </div>
                <div className="applicant-history-actions">
                  <span className={`applicant-status ${statusClass(item.status)}`}>{item.status}</span>
                  <button
                    type="button"
                    className="applicant-edit-button"
                    onClick={() => void openSubmissionDialog(item.type, item.id)}
                    disabled={loadingDetail}
                  >
                    <PortalIcon name="clipboard" /> Buka Kotak Dialog
                  </button>
                  {item.status === "Disetujui" ? (
                    <Link
                      href={editHref(item.type, item.id)}
                      className="applicant-edit-button"
                      onClick={() => startPortalLoading("Memuat detail pengajuan…")}
                    >
                      <PortalIcon name="eye" /> Lihat Pengajuan
                    </Link>
                  ) : item.status === "Ditolak" || item.status === "Perlu Perbaikan" ? (
                    <Link
                      href={editHref(item.type, item.id)}
                      className="applicant-edit-button"
                      onClick={() => startPortalLoading("Menyiapkan revisi pengajuan…")}
                    >
                      <PortalIcon name="edit" /> Revisi Pengajuan
                    </Link>
                  ) : item.canEdit ? (
                    <Link
                      href={editHref(item.type, item.id)}
                      className="applicant-edit-button"
                      onClick={() => startPortalLoading("Menyiapkan formulir edit…")}
                    >
                      <PortalIcon name="edit" /> Edit Pengajuan
                    </Link>
                  ) : (
                    <Link
                      href={editHref(item.type, item.id)}
                      className="applicant-edit-button"
                      onClick={() => startPortalLoading("Memuat detail pengajuan…")}
                    >
                      <PortalIcon name="eye" /> Lihat Pengajuan
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>

          <TablePagination
            totalItems={items.length}
            page={safePage}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={[5, 10, 20]}
            itemLabel="pengajuan"
          />
        </>
      ) : (
        <div className="applicant-empty">
          <PortalIcon name="clipboard" />
          <strong>Belum ada pengajuan</strong>
          <p>Pilih salah satu layanan di atas untuk mengirim data pertama Anda.</p>
        </div>
      )}

      {/* Kotak Dialog Detail Pengajuan & Aksi Langsung */}
      {selectedSubmission && (
        <div className="portal-modal-layer" role="dialog" aria-modal="true">
          <button
            className="portal-modal-backdrop"
            type="button"
            onClick={() => setSelectedSubmission(null)}
            aria-label="Tutup"
          />
          <div className="portal-modal verification-modal">
            <div className="portal-modal-head">
              <div>
                <p>{selectedSubmission.no_registrasi || "Pengajuan"}</p>
                <h2>{submissionTitle(selectedJenis, selectedSubmission)}</h2>
              </div>
              <button type="button" onClick={() => setSelectedSubmission(null)} aria-label="Tutup">
                <PortalIcon name="x" />
              </button>
            </div>

            <div className="verification-status-row">
              <span>Status saat ini</span>
              <span className={`portal-status ${statusClass(String(selectedSubmission.status_label ?? "Menunggu"))}`}>
                {String(selectedSubmission.status_label ?? "Menunggu")}
              </span>
              {selectedSubmission.created_at && (
                <small>Diajukan {formatDate(String(selectedSubmission.created_at))}</small>
              )}
            </div>

            {selectedSubmission.catatan_verifikasi ? (
              <div
                style={{
                  margin: "14px 0",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  color: "#92400e",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, marginBottom: "4px" }}>
                  <PortalIcon
                    name="info"
                    width={25}
                    height={25}
                    className="info-note-icon"
                    style={{ width: "25px", height: "25px", minWidth: "25px", minHeight: "25px", flexShrink: 0 }}
                  />
                  <span>Catatan dari Petugas / Verifikator:</span>
                </div>
                <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5 }}>
                  {String(selectedSubmission.catatan_verifikasi)}
                </p>
              </div>
            ) : null}

            <div className="verification-steps" role="tablist" aria-label="Tahapan data pengajuan">
              {submissionConfigs[selectedJenis].steps.map((step, index) => (
                <button
                  key={step.shortTitle}
                  type="button"
                  className={detailStep === index ? "active" : ""}
                  onClick={() => setDetailStep(index)}
                >
                  <span>{index + 1}</span>{step.shortTitle}
                </button>
              ))}
            </div>

            <div className="verification-section">
              <div className="verification-section-head">
                <p>Tahap {detailStep + 1}</p>
                <h3>{submissionConfigs[selectedJenis].steps[detailStep]?.title || "Detail Pengajuan"}</h3>
                <span>{submissionConfigs[selectedJenis].steps[detailStep]?.description || "Data yang tercatat."}</span>
              </div>
              <div className="verification-grid">
                {(submissionConfigs[selectedJenis].steps[detailStep]?.fields || [])
                  .filter((field) => field.key !== "konfirmasi_kebenaran")
                  .map((field) => {
                    const value = fieldDisplayValue(selectedSubmission, field);
                    const isFile = field.type === "file" && value !== "—";
                    const fileLinkLabel = field.fileKind === "document" ? "Buka dokumen ↗" : "Buka gambar ↗";
                    return (
                      <div
                        key={field.key}
                        className={field.type === "textarea" || field.type === "file" || field.type === "checkbox" ? "wide" : ""}
                      >
                        <span>{field.label}</span>
                        {isFile ? (
                          <a href={value} target="_blank" rel="noreferrer">
                            {fileLinkLabel}
                          </a>
                        ) : (
                          <strong>{value}</strong>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            <div
              className="portal-modal-actions"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
                paddingTop: "14px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <button
                type="button"
                className="portal-secondary"
                onClick={() => setSelectedSubmission(null)}
              >
                Tutup
              </button>
              <Link
                href={editHref(selectedJenis, selectedSubmission.id)}
                className="portal-primary"
                onClick={() => startPortalLoading("Membuka formulir pengajuan…")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                <PortalIcon name={selectedSubmission.can_edit ? "edit" : "eye"} />
                {selectedSubmission.can_edit
                  ? selectedSubmission.status_label === "Perlu Perbaikan" || selectedSubmission.status_label === "Ditolak"
                    ? "Revisi / Perbaiki Pengajuan Sekarang"
                    : "Edit Pengajuan Sekarang"
                  : "Buka Formulir Lengkap"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

