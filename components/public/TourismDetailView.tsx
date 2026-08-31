import Link from "next/link";
import PublicSiteFooter from "@/components/public/PublicSiteFooter";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import type { PublicFacility, PublicTourismItem, TourismKind } from "@/lib/public-tourism";
import { tourismMeta } from "@/lib/public-tourism";

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
}

function groupFacilities(facilities: PublicFacility[]) {
  const groups: Record<string, PublicFacility[]> = {};
  for (const facility of facilities) {
    (groups[facility.category] ??= []).push(facility);
  }
  return Object.entries(groups);
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
              {item.address && <span>⌖ {item.address}</span>}
              {item.badge && <span>{item.badge}</span>}
              {priceFrom && <span>{priceTo && priceTo !== priceFrom ? `${priceFrom} – ${priceTo}` : priceFrom}</span>}
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

              {item.facilities.length > 0 && (
                <section className="tourism-facilities-card">
                  <div className="tourism-facilities-heading">
                    <span>Fasilitas</span>
                    <h3>Fasilitas yang tersedia</h3>
                    <p>{item.facilities.length} fasilitas tercatat pada data ini.</p>
                  </div>
                  <div className="tourism-facilities-groups">
                    {groupFacilities(item.facilities).map(([group, facilities]) => (
                      <div className="tourism-facility-group" key={group}>
                        <strong>{group}</strong>
                        <div className="tourism-facility-tags">
                          {facilities.map((facility) => <span key={facility.id}>{facility.name}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

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
              <span>Informasi singkat</span>
              <div className="tourism-aside-facts">
                <div><small>Kategori</small><strong>{item.category || meta.menuLabel}</strong></div>
                {item.address && <div><small>Lokasi / wilayah</small><strong>{item.address}</strong></div>}
                {item.badge && <div><small>Keterangan</small><strong>{item.badge}</strong></div>}
                {priceFrom && <div><small>Kisaran harga</small><strong>{priceTo && priceTo !== priceFrom ? `${priceFrom} – ${priceTo}` : priceFrom}</strong></div>}
                {item.facilities.length > 0 && <div><small>Fasilitas</small><strong>{item.facilities.length} tersedia</strong></div>}
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
