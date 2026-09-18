"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { PortalIcon } from "@/components/portal/PortalIcon";
import { TablePagination } from "@/components/portal/DataTableControls";
import { startPortalLoading } from "@/components/portal/PortalPreloader";

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

export function ApplicantHistory({ items }: { items: SubmissionItem[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

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
    </section>
  );
}
