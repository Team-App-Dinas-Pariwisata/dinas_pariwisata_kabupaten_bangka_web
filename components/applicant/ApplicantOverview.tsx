import Link from "next/link";
import { getAll, type DbRecord } from "@/lib/realtime-db";
import { PortalIcon } from "@/components/portal/PortalIcon";

type SubmissionItem = {
  id: number;
  type: "ekraf" | "sdm" | "komunitas";
  typeLabel: string;
  title: string;
  noRegistrasi: string;
  status: string;
  createdAt: string;
  canEdit: boolean;
};

type Row = DbRecord & {
  id: number;
  no_registrasi?: string | null;
  status?: string | null;
  status_pengajuan?: string | null;
  nama_usaha?: string | null;
  tempat_bertugas?: string | null;
  nama_lengkap?: string | null;
  nama_organisasi?: string | null;
  created_at?: string | null;
  created_by?: number | null;
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

function canEditStatus(status: string) {
  return ["Menunggu", "Perlu Perbaikan", "Ditolak"].includes(status);
}

function editHref(type: SubmissionItem["type"], id: number) {
  const segment = type === "ekraf" ? "pelaku-ekraf" : type === "sdm" ? "sdm-pariwisata" : "komunitas";
  return `/akun/pengajuan/${segment}/${id}/edit`;
}

export async function ApplicantOverview({ userId, userName }: { userId: number; userName: string }) {
  const [ekrafRows, sdmRows, komunitasRows] = await Promise.all([
    getAll<Row>("pengajuan_ekraf"),
    getAll<Row>("pengajuan_sdm_pariwisata"),
    getAll<Row>("pengajuan_komunitas_asosiasi"),
  ]);

  const mine = (rows: Row[]) => rows.filter((row) => Number(row.created_by) === userId);
  const items: SubmissionItem[] = [
    ...mine(ekrafRows).map((row) => { const status = row.status || "Menunggu"; return { id: Number(row.id), type: "ekraf" as const, typeLabel: "Pelaku Ekraf", title: row.nama_usaha || "Pengajuan Ekraf", noRegistrasi: row.no_registrasi || "—", status, createdAt: String(row.created_at ?? ""), canEdit: canEditStatus(status) }; }),
    ...mine(sdmRows).map((row) => { const status = row.status_pengajuan || "Menunggu"; return { id: Number(row.id), type: "sdm" as const, typeLabel: "SDM Pariwisata", title: row.tempat_bertugas || row.nama_lengkap || "Pengajuan SDM", noRegistrasi: row.no_registrasi || "—", status, createdAt: String(row.created_at ?? ""), canEdit: canEditStatus(status) }; }),
    ...mine(komunitasRows).map((row) => { const status = row.status_pengajuan || "Menunggu"; return { id: Number(row.id), type: "komunitas" as const, typeLabel: "Komunitas", title: row.nama_organisasi || "Pengajuan Komunitas", noRegistrasi: row.no_registrasi || "—", status, createdAt: String(row.created_at ?? ""), canEdit: canEditStatus(status) }; }),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const approved = items.filter((item) => item.status === "Disetujui").length;
  const pending = items.filter((item) => item.status === "Menunggu" || item.status === "Perlu Perbaikan").length;

  return (
    <section className="applicant-dashboard">
      <div className="applicant-page-head">
        <div>
          <p>Dashboard Pengaju</p>
          <h1>Halo, {userName.split(" ")[0]}.</h1>
          <span>Kelola pengajuan dan pantau proses verifikasi dari satu akun.</span>
        </div>
        <Link href="/akun/pengajuan/pelaku-ekraf" className="applicant-primary"><PortalIcon name="plus" /> Buat Pengajuan</Link>
      </div>

      <div className="applicant-stat-grid">
        <article><span>Total Pengajuan</span><strong>{items.length}</strong><small>Semua kategori</small></article>
        <article><span>Dalam Proses</span><strong>{pending}</strong><small>Menunggu / perlu perbaikan</small></article>
        <article><span>Disetujui</span><strong>{approved}</strong><small>Sudah diverifikasi</small></article>
      </div>

      <section className="applicant-new-submission">
        <div className="applicant-section-title"><div><p>BUAT PENGAJUAN BARU</p><h2>Pilih kategori data yang akan diajukan.</h2></div></div>
        <div className="applicant-service-grid">
          <Link href="/akun/pengajuan/pelaku-ekraf"><span className="service-icon"><PortalIcon name="clipboard" /></span><div><strong>Pelaku Ekraf</strong><small>Profil pelaku, usaha, subsektor, aktivitas, dan dokumen.</small></div><PortalIcon name="chevron" /></Link>
          <Link href="/akun/pengajuan/sdm-pariwisata"><span className="service-icon"><PortalIcon name="users" /></span><div><strong>SDM Pariwisata</strong><small>Identitas, pekerjaan, tempat bertugas, dan sertifikat.</small></div><PortalIcon name="chevron" /></Link>
          <Link href="/akun/pengajuan/komunitas"><span className="service-icon"><PortalIcon name="database" /></span><div><strong>Komunitas / Asosiasi / Lembaga</strong><small>Profil organisasi, kepengurusan, lokasi, dan legalitas.</small></div><PortalIcon name="chevron" /></Link>
        </div>
      </section>

      <section className="applicant-history-card">
        <div className="applicant-section-title"><div><p>RIWAYAT</p><h2>Pengajuan saya</h2></div><span>{items.length} data</span></div>
        {items.length ? (
          <div className="applicant-history-list">
            {items.map((item) => (
              <article key={`${item.type}-${item.id}`}>
                <div className="history-type"><span>{item.typeLabel}</span><strong>{item.title}</strong><small>{item.noRegistrasi} · {formatDate(item.createdAt)}</small></div>
                <div className="applicant-history-actions">
                  <span className={`applicant-status ${statusClass(item.status)}`}>{item.status}</span>
                  {item.status === "Disetujui" ? (
                    <Link href={editHref(item.type, item.id)} className="applicant-edit-button"><PortalIcon name="eye" /> Lihat Pengajuan</Link>
                  ) : item.status === "Ditolak" || item.status === "Perlu Perbaikan" ? (
                    <Link href={editHref(item.type, item.id)} className="applicant-edit-button"><PortalIcon name="edit" /> Revisi Pengajuan</Link>
                  ) : item.canEdit ? (
                    <Link href={editHref(item.type, item.id)} className="applicant-edit-button"><PortalIcon name="edit" /> Edit Pengajuan</Link>
                  ) : (
                    <Link href={editHref(item.type, item.id)} className="applicant-edit-button"><PortalIcon name="eye" /> Lihat Pengajuan</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="applicant-empty"><PortalIcon name="clipboard" /><strong>Belum ada pengajuan</strong><p>Pilih salah satu layanan di atas untuk mengirim data pertama Anda.</p></div>
        )}
      </section>
    </section>
  );
}
