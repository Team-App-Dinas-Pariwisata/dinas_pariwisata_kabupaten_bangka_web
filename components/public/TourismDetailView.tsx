import Link from "next/link";
import PublicSiteFooter from "@/components/public/PublicSiteFooter";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import type { PublicTourismItem, TourismKind } from "@/lib/public-tourism";
import { tourismMeta } from "@/lib/public-tourism";

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
}

export default function TourismDetailView({
  kind,
  item,
  related,
}: {
  kind: TourismKind;
  item: PublicTourismItem;
  related: PublicTourismItem[];
}) {
  const meta = tourismMeta[kind];
  const basePath = `/wisata/${kind}`;
  const priceFrom = formatCurrency(item.price_from);
  const priceTo = formatCurrency(item.price_to);
  const latitude = item.latitude === null || item.latitude === undefined ? null : Number(item.latitude);
  const longitude = item.longitude === null || item.longitude === undefined ? null : Number(item.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const mapQuery = hasCoordinates ? `${latitude},${longitude}` : item.address || item.title;
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`;
  const mapExternalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <div className="public-page-shell">
      <PublicSiteHeader />
      <main>
        <article className="public-detail tourism-detail">
          <div className="public-container public-detail-breadcrumb">
            <Link href="/">Beranda</Link><span>/</span>
            <Link href="/wisata">Wisata</Link><span>/</span>
            <Link href={basePath}>{meta.menuLabel}</Link><span>/</span>
            <span>{item.title}</span>
          </div>

          <header className="public-container public-detail-header tourism-detail-header">
            <span className="public-detail-category">{item.category || meta.menuLabel}</span>
            <h1>{item.title}</h1>
            {item.subtitle && <p className={`public-detail-subtitle ${kind === "satwa-endemik" ? "is-scientific" : ""}`}>{item.subtitle}</p>}
            <div className="tourism-detail-meta-row">
              {item.address && (
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" /><circle cx="12" cy="10" r="3" /></svg>
                  {item.address}
                </span>
              )}
              {item.badge && (
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  {item.badge}
                </span>
              )}
              {priceFrom && (
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                  {priceTo && priceTo !== priceFrom ? `${priceFrom} – ${priceTo}` : priceFrom}
                </span>
              )}
            </div>
          </header>

          <div className="public-container tourism-detail-visual">
            <div className="public-detail-image" style={{ backgroundImage: `url(${item.image || "/hero-home-v15.jpg"})` }} role="img" aria-label={item.title} />
          </div>

          <div className="public-container public-article-layout tourism-article-layout">
            <div className="public-article-content">
              {item.summary && <p className="public-article-lead">{item.summary}</p>}
              {item.description && <div className="public-rich-text">{item.description}</div>}

              <div className="tourism-facts">
                {item.detail_primary && (
                  <section><span>{meta.detailPrimaryLabel}</span><p>{item.detail_primary}</p></section>
                )}
                {item.detail_secondary && (
                  <section><span>{meta.detailSecondaryLabel}</span><p>{item.detail_secondary}</p></section>
                )}
                {item.detail_tertiary && (
                  <section><span>{meta.detailTertiaryLabel}</span><p>{item.detail_tertiary}</p></section>
                )}
              </div>

              {(hasCoordinates || item.address) && (
                <section className="tourism-map-card">
                  <div className="tourism-map-heading">
                    <div>
                      <span>Peta lokasi</span>
                      <h3>{kind === "satwa-endemik" ? "Lokasi publik pada peta" : "Lokasi pada peta"}</h3>
                    </div>
                    <a
                      href={mapExternalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="public-outline-button tourism-map-button"
                    >
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

                  {kind === "satwa-endemik" && (
                    <p className="tourism-map-note">
                      Lokasi satwa menggunakan koordinat publik yang telah digeneralisasi untuk melindungi lokasi sensitif.
                    </p>
                  )}
                </section>
              )}
            </div>

            <aside className="public-detail-aside tourism-detail-aside">
              <span className="directory-aside-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                &nbsp; Informasi singkat
              </span>
              <div className="tourism-aside-facts">
                <div><small>Kategori</small><strong>{item.category || meta.menuLabel}</strong></div>
                {item.address && <div><small>Lokasi / wilayah</small><strong>{item.address}</strong></div>}
                {item.badge && <div><small>Keterangan</small><strong>{item.badge}</strong></div>}
                {priceFrom && <div><small>Kisaran harga</small><strong>{priceTo && priceTo !== priceFrom ? `${priceFrom} – ${priceTo}` : priceFrom}</strong></div>}
              </div>
              <Link href={basePath} className="public-outline-button">← Kembali ke daftar</Link>
            </aside>
          </div>
        </article>

        {related.length > 0 && (
          <section className="public-related-section">
            <div className="public-container">
              <div className="public-list-heading compact">
                <div><span className="public-section-label">Rekomendasi lainnya</span><h2>{meta.menuLabel} lainnya</h2></div>
                <Link href={basePath} className="public-read-link">Lihat semua →</Link>
              </div>
              <div className="public-related-grid">
                {related.map((relatedItem) => (
                  <Link href={`${basePath}/${relatedItem.slug}`} className="public-related-card" key={relatedItem.id}>
                    <div className="public-related-image" style={{ backgroundImage: `url(${relatedItem.image || "/hero-home-v15.jpg"})` }} />
                    <div><span>{relatedItem.category || meta.menuLabel}</span><strong>{relatedItem.title}</strong></div>
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
