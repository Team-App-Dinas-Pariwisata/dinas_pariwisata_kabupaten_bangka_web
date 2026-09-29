import Link from "next/link";
import PublicSiteFooter from "@/components/public/PublicSiteFooter";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import type { PublicDirectoryDetail } from "@/lib/public-directory";
import { publicDirectoryMeta } from "@/lib/public-directory";

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim());
}

function externalUrl(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

function startedLabel(item: PublicDirectoryDetail) {
  if (item.type === "sdm" && item.start_year) {
    const month = item.start_month && item.start_month >= 1 && item.start_month <= 12
      ? monthNames[item.start_month - 1]
      : null;
    return month ? `${month} ${item.start_year}` : String(item.start_year);
  }
  return item.year_started ? String(item.year_started) : null;
}

function detailSections(item: PublicDirectoryDetail) {
  if (item.type === "ekraf") {
    return [
      { label: "Produk / jasa", value: item.products_services },
      { label: "Visi usaha", value: item.vision },
      { label: "Misi usaha", value: item.mission },
      { label: "Prestasi", value: item.achievements },
      { label: "Pelatihan yang pernah diikuti", value: item.trainings },
      { label: "Pameran yang pernah diikuti", value: item.exhibitions },
    ].filter((section) => hasText(section.value));
  }

  if (item.type === "sdm") {
    return [
      { label: "Tempat bertugas", value: item.workplace },
      { label: "Alamat tempat bertugas", value: item.workplace_address },
    ].filter((section) => hasText(section.value));
  }

  return [
    { label: "Tentang organisasi", value: item.description },
    { label: "Visi dan misi", value: item.vision_mission },
  ].filter((section) => hasText(section.value));
}

export default function DirectoryDetailView({
  item,
  related,
}: {
  item: PublicDirectoryDetail;
  related: PublicDirectoryDetail[];
}) {
  const meta = publicDirectoryMeta[item.type];
  const websiteUrl = externalUrl(item.website);
  const socialUrl = externalUrl(item.social_media);
  const start = startedLabel(item);
  const sections = detailSections(item);
  const hasCoordinates = Number.isFinite(item.latitude) && Number.isFinite(item.longitude);
  const mapQuery = hasCoordinates ? `${item.latitude},${item.longitude}` : item.address || item.location || item.title;
  const mapEmbedUrl = mapQuery ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed` : null;
  const mapExternalUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : null;

  return (
    <div className="public-page-shell">
      <PublicSiteHeader />
      <main>
        <article className="public-detail directory-detail-page">
          <div className="public-container public-detail-breadcrumb">
            <Link href="/">Beranda</Link><span>/</span>
            <Link href={`/direktori/${item.type}`}>{meta.label}</Link><span>/</span>
            <span>{item.title}</span>
          </div>

          <header className="public-container public-detail-header directory-detail-header">
            <div className="directory-detail-eyebrow-row">
              <span className="public-detail-category">{meta.eyebrow}</span>
              <span className="directory-detail-verified">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                Disetujui &amp; Terverifikasi
              </span>
              {item.unggulan ? (
                <span className="directory-detail-featured">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  Unggulan
                </span>
              ) : null}
            </div>
            <h1>{item.title}</h1>
            {item.subtitle ? <p className="public-detail-subtitle">{item.subtitle}</p> : null}
            <div className="tourism-detail-meta-row directory-detail-meta-row">
              {item.category ? (
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12 12 20l-8-8V4h8z" /><circle cx="8.5" cy="8.5" r="1.5" /></svg>
                  {item.category}
                </span>
              ) : null}
              {item.location ? (
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" /><circle cx="12" cy="10" r="3" /></svg>
                  {item.location}
                </span>
              ) : null}
              {start ? (
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  {item.type === "sdm" ? "Aktif sejak" : "Berdiri sejak"} {start}
                </span>
              ) : null}
              {item.employee_count !== null ? (
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  {item.employee_count} tenaga kerja
                </span>
              ) : null}
            </div>
          </header>

          <div className="public-container directory-detail-hero-grid">
            <div className={`directory-detail-visual ${item.image ? "has-image" : "no-image"}`}>
              {item.image ? (
                <div className="public-detail-image" style={{ backgroundImage: `url(${item.image})` }} role="img" aria-label={item.title} />
              ) : (
                <div className="directory-detail-placeholder" aria-label={`Belum ada foto ${item.title}`}>
                  <span>{item.title.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SP"}</span>
                  <small>Profil terverifikasi SI PARIK BANGKA</small>
                </div>
              )}
            </div>
            <div className="directory-detail-intro-card">
              <span className="directory-intro-badge">{meta.label}</span>
              <h2>Profil terverifikasi</h2>
              <p>{item.description || meta.description}</p>
              <div className="directory-detail-intro-facts">
                {item.registration_number ? <div><small>No. registrasi</small><strong>{item.registration_number}</strong></div> : null}
                {item.category ? <div><small>Kategori</small><strong>{item.category}</strong></div> : null}
                {item.location ? <div><small>Wilayah</small><strong>{item.location}</strong></div> : null}
              </div>
            </div>
          </div>

          <div className="public-container public-article-layout tourism-article-layout directory-article-layout">
            <div className="public-article-content">
              {item.type !== "komunitas" && item.description ? <p className="public-article-lead">{item.description}</p> : null}

              {sections.length > 0 ? (
                <div className="tourism-facts directory-detail-sections">
                  {sections.map((section) => (
                    <section key={section.label}>
                      <span>{section.label}</span>
                      <p>{section.value}</p>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="directory-detail-empty-copy">Informasi profil telah diverifikasi oleh Dinas Pariwisata dan Kebudayaan. Detail tambahan belum tersedia untuk publik.</div>
              )}

              {mapEmbedUrl && mapExternalUrl && (hasCoordinates || item.address) ? (
                <section className="tourism-map-card directory-map-card">
                  <div className="tourism-map-heading">
                    <div>
                      <span>Lokasi publik</span>
                      <h3>{item.type === "sdm" ? "Tempat bertugas" : "Lokasi profil"}</h3>
                    </div>
                    <a href={mapExternalUrl} target="_blank" rel="noreferrer" className="public-outline-button tourism-map-button">
                      Buka di Google Maps ↗
                    </a>
                  </div>
                  <div className="tourism-map-embed">
                    <iframe
                      src={mapEmbedUrl}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Peta ${item.title}`}
                    />
                  </div>
                  {item.address ? <p className="directory-map-address">{item.address}</p> : null}
                </section>
              ) : null}
            </div>

            <aside className="public-detail-aside tourism-detail-aside directory-detail-aside">
              <span className="directory-aside-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                &nbsp; Informasi singkat
              </span>
              <div className="tourism-aside-facts">
                {item.type === "sdm" && item.role ? <div><small>Jabatan</small><strong>{item.role}</strong></div> : null}
                {item.type === "sdm" && item.workplace ? <div><small>Tempat bertugas</small><strong>{item.workplace}</strong></div> : null}
                {item.type === "komunitas" && item.organization_kind ? <div><small>Jenis organisasi</small><strong>{item.organization_kind}</strong></div> : null}
                {item.type === "komunitas" && item.chairman ? <div><small>Ketua</small><strong>{item.chairman}</strong></div> : null}
                {item.type === "komunitas" && item.legal_status ? <div><small>Status badan hukum</small><strong>{item.legal_status}</strong></div> : null}
                {item.type === "komunitas" && item.legal_number ? <div><small>Nomor akta</small><strong>{item.legal_number}</strong></div> : null}
                {item.type === "ekraf" && item.employee_count !== null ? <div><small>Tenaga kerja</small><strong>{item.employee_count} orang</strong></div> : null}
                {start ? <div><small>{item.type === "sdm" ? "Mulai bertugas" : "Tahun mulai"}</small><strong>{start}</strong></div> : null}
              </div>

              {(websiteUrl || item.shopee || socialUrl || item.social_media) ? (
                <div className="directory-detail-links">
                  {websiteUrl ? <a href={websiteUrl} target="_blank" rel="noreferrer" className="public-primary-button">Kunjungi website ↗</a> : null}
                  {item.shopee ? <a href={item.shopee} target="_blank" rel="noreferrer" className="public-outline-button">Kunjungi Shopee ↗</a> : null}
                  {socialUrl ? <a href={socialUrl} target="_blank" rel="noreferrer" className="public-outline-button">Media sosial ↗</a> : null}
                  {!socialUrl && item.social_media ? <p><small>Media sosial</small><strong>{item.social_media}</strong></p> : null}
                </div>
              ) : null}

              <Link href={`/direktori/${item.type}`} className="public-outline-button directory-back-button">← Kembali ke direktori</Link>
            </aside>
          </div>
        </article>

        {related.length > 0 ? (
          <section className="public-related-section directory-related-section">
            <div className="public-container">
              <div className="public-list-heading compact">
                <div><span className="public-section-label">Profil lainnya</span><h2>{meta.label} lainnya</h2></div>
                <Link href={`/direktori/${item.type}`} className="public-read-link">Lihat direktori →</Link>
              </div>
              <div className="public-related-grid">
                {related.map((relatedItem) => (
                  <Link href={`/direktori/${relatedItem.type}/${relatedItem.id}`} className="public-related-card directory-related-card" key={`${relatedItem.type}-${relatedItem.id}`}>
                    {relatedItem.image ? (
                      <div className="public-related-image" style={{ backgroundImage: `url(${relatedItem.image})` }} />
                    ) : (
                      <div className="public-related-image directory-related-placeholder"><span>{relatedItem.title.slice(0, 2).toUpperCase()}</span></div>
                    )}
                    <div><span>{relatedItem.category || meta.label}</span><strong>{relatedItem.title}</strong></div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <PublicSiteFooter />
    </div>
  );
}
