import Link from "next/link";
import PublicPagination from "@/components/public/PublicPagination";
import PublicSiteFooter from "@/components/public/PublicSiteFooter";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import type { PublicTourismItem, TourismKind } from "@/lib/public-tourism";
import { tourismMeta } from "@/lib/public-tourism";

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
}

function cardMeta(kind: TourismKind, item: PublicTourismItem) {
  if (kind === "satwa-endemik") return item.subtitle || item.category || "Satwa Bangka";
  if (item.price_from !== null) return `Mulai ${formatCurrency(item.price_from)}`;
  return item.badge || item.category || tourismMeta[kind].menuLabel;
}

export default function TourismListView({
  kind,
  data,
}: {
  kind: TourismKind;
  data: { items: PublicTourismItem[]; total: number; page: number; totalPages: number };
}) {
  const meta = tourismMeta[kind];
  const basePath = `/wisata/${kind}`;

  return (
    <div className="public-page-shell">
      <PublicSiteHeader />
      <main>
        <section className={`public-page-hero tourism-page-hero tourism-page-hero-${kind}`}>
          <div className="public-container public-page-hero-inner">
            <span className="public-eyebrow">{meta.eyebrow}</span>
            <h1>{meta.title}</h1>
            <p>{meta.description}</p>
          </div>
        </section>

        <section className="public-content-section">
          <div className="public-container">
            <div className="public-list-heading">
              <div>
                <span className="public-section-label">Wisata / {meta.menuLabel}</span>
                <h2>Jelajahi {meta.menuLabel.toLowerCase()}</h2>
              </div>
              <p>{data.total} data dipublikasikan</p>
            </div>

            {data.items.length > 0 ? (
              <div className="tourism-grid">
                {data.items.map((item) => (
                  <article className="tourism-card" key={item.id}>
                    <Link
                      href={`${basePath}/${item.slug}`}
                      className="tourism-card-image"
                      style={{ backgroundImage: `url(${item.image || "/hero-home-v15.jpg"})` }}
                      aria-label={item.title}
                    >
                      <span className="tourism-card-category">{item.category || meta.menuLabel}</span>
                    </Link>
                    <div className="tourism-card-body">
                      <span className="tourism-card-meta">{cardMeta(kind, item)}</span>
                      <h3><Link href={`${basePath}/${item.slug}`}>{item.title}</Link></h3>
                      {item.address && <p className="tourism-card-location">⌖ {item.address}</p>}
                      <p className="tourism-card-summary">{item.summary || "Informasi wisata Kabupaten Bangka."}</p>
                      {item.facilities.length > 0 && (
                        <div className="tourism-card-facilities">
                          {item.facilities.slice(0, 3).map((facility) => <span key={facility.id}>{facility.name}</span>)}
                          {item.facilities.length > 3 && <span>+{item.facilities.length - 3}</span>}
                        </div>
                      )}
                      <Link href={`${basePath}/${item.slug}`} className="public-read-link">Lihat detail <span>→</span></Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="public-empty-state">Belum ada data {meta.menuLabel.toLowerCase()} yang dipublikasikan.</div>
            )}

            <PublicPagination page={data.page} totalPages={data.totalPages} basePath={basePath} />
          </div>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
