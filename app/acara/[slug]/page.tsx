import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicSiteFooter from "@/components/public/PublicSiteFooter";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import ShareLinkButton from "@/components/public/ShareLinkButton";
import { getPublicEventBySlug, getRelatedEvents } from "@/lib/public-content";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


type Props = { params: Promise<{ slug: string }> };

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatPrice(gratis: number, start: number | null, end: number | null) {
  if (gratis) return "Gratis";
  const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
  if (start != null && end != null && start !== end) return `${rupiah.format(start)} – ${rupiah.format(end)}`;
  if (start != null) return `Mulai ${rupiah.format(start)}`;
  return "Informasi harga menyusul";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicEventBySlug(slug);
  if (!item) return { title: "Acara tidak ditemukan | SI PARIK BANGKA" };
  return {
    title: `${item.nama_acara} | SI PARIK BANGKA Kabupaten Bangka`,
    description: item.ringkasan || "Agenda SI PARIK BANGKA Kabupaten Bangka",
  };
}

export default async function DetailAcaraPage({ params }: Props) {
  const { slug } = await params;
  const item = await getPublicEventBySlug(slug);
  if (!item) notFound();
  const related = await getRelatedEvents(item.id, 3);
  const heroImage = item.foto_utama || "/hero-bangka.jpg";
  const actionHref = item.tautan_pendaftaran || item.tautan_daring;

  return (
    <div className="public-page-shell">
      <PublicSiteHeader />
      <main>
        <article className="public-detail public-event-detail">
          <div className="public-container public-detail-breadcrumb">
            <Link href="/">Beranda</Link><span>/</span><Link href="/acara">Acara</Link><span>/</span><span>{item.nama_kategori || "Acara"}</span>
          </div>

          <header className="public-container public-detail-header event-header">
            <span className="public-detail-category">{item.nama_kategori || "Acara"}</span>
            <h1>{item.nama_acara}</h1>
            {item.ringkasan && <p className="public-detail-subtitle">{item.ringkasan}</p>}
          </header>

          <div className="public-container public-event-detail-hero">
            <div className="public-detail-image" style={{ backgroundImage: `url(${heroImage})` }} role="img" aria-label={item.foto_alt || item.nama_acara} />
            <aside className="public-event-info-card">
              <div><small>Tanggal mulai</small><strong>{formatDateTime(item.tanggal_mulai)}</strong></div>
              <div><small>Tanggal selesai</small><strong>{formatDateTime(item.tanggal_selesai)}</strong></div>
              <div><small>Lokasi</small><strong>{item.nama_lokasi || item.alamat || item.jenis_pelaksanaan}</strong></div>
              <div><small>Penyelenggara</small><strong>{item.penyelenggara || "SI PARIK BANGKA Kabupaten Bangka"}</strong></div>
              <div><small>Biaya</small><strong>{formatPrice(item.gratis, item.harga_mulai, item.harga_sampai)}</strong></div>
              {actionHref && <a href={actionHref} target="_blank" rel="noreferrer" className="public-primary-button">{item.memerlukan_pendaftaran ? "Daftar acara" : "Buka informasi"} →</a>}
            </aside>
          </div>

          <div className="public-container public-article-layout event-copy-layout">
            <div className="public-article-content">
              <span className="public-section-label">Tentang acara</span>
              <div className="public-rich-text">{item.deskripsi}</div>
              {item.syarat_ketentuan && (
                <div className="public-terms-box"><strong>Syarat & ketentuan</strong><p>{item.syarat_ketentuan}</p></div>
              )}
            </div>
            <aside className="public-detail-aside">
              <span>Informasi kontak</span>
              <p>{item.narahubung_nama || "Panitia kegiatan"}</p>
              {item.narahubung_telepon && <a href={`tel:${item.narahubung_telepon}`}>{item.narahubung_telepon}</a>}
              {item.narahubung_email && <a href={`mailto:${item.narahubung_email}`}>{item.narahubung_email}</a>}
              <div className="public-detail-actions">
                <Link href="/acara" className="public-outline-button">← Kembali ke acara</Link>
                <ShareLinkButton
                  title={item.nama_acara}
                  text={item.ringkasan || "Agenda SI PARIK BANGKA Kabupaten Bangka"}
                  label="Bagikan link acara"
                />
              </div>
            </aside>
          </div>
        </article>

        {related.length > 0 && (
          <section className="public-related-section">
            <div className="public-container">
              <div className="public-list-heading compact">
                <div><span className="public-section-label">Agenda lain</span><h2>Acara lainnya</h2></div>
                <Link href="/acara" className="public-read-link">Lihat semua →</Link>
              </div>
              <div className="public-related-grid">
                {related.map((event, index) => (
                  <Link href={`/acara/${event.slug}`} className="public-related-card" key={event.id}>
                    <div className="public-related-image" style={{ backgroundImage: `url(${event.foto_utama || ["/hero-bangka.jpg", "/kriya-bangka.jpg", "/hero-home-v15.jpg"][index % 3]})` }} />
                    <div><span>{event.nama_kategori || "Acara"} · {formatDateTime(event.tanggal_mulai)}</span><strong>{event.nama_acara}</strong></div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <PublicSiteFooter />
    </div>
  );
}
