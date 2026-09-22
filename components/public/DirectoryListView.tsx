import Link from "next/link";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import PublicSiteFooter from "@/components/public/PublicSiteFooter";
import PublicPagination from "@/components/public/PublicPagination";
import type { PublicDirectoryListResult, PublicDirectoryType } from "@/lib/public-directory";
import { publicDirectoryMeta } from "@/lib/public-directory";

const directoryTabs: { id: PublicDirectoryType; label: string; href: string }[] = [
  { id: "ekraf", label: "Pelaku Ekraf", href: "/direktori/ekraf" },
  { id: "sdm", label: "SDM Pariwisata", href: "/direktori/sdm" },
  { id: "komunitas", label: "Komunitas / Asosiasi", href: "/direktori/komunitas" },
];

function initials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SP"
  );
}

export default function DirectoryListView({
  type,
  data,
  query = "",
}: {
  type: PublicDirectoryType;
  data: PublicDirectoryListResult;
  query?: string;
}) {
  const meta = publicDirectoryMeta[type];
  const paginationBasePath = query
    ? `/direktori/${type}?q=${encodeURIComponent(query)}`
    : `/direktori/${type}`;

  return (
    <main className="public-page subsector-directory-page">
      <PublicSiteHeader />

      <section className="subsector-list-hero">
        <div className="public-container subsector-list-hero-inner">
          <Link href="/" className="subsector-back-link">
            ← Kembali ke beranda
          </Link>
          <span className="subsector-list-kicker">{meta.eyebrow}</span>
          <h1>{meta.label}</h1>
          <p>{meta.description}</p>
          <div className="subsector-list-stat">
            <strong>{data.total}</strong>
            <span>profil terverifikasi</span>
          </div>
        </div>
      </section>

      <section className="subsector-directory-section">
        <div className="public-container">
          <div className="directory-toolbar directory-list-toolbar-wrap">
            <div className="directory-filters" role="tablist" aria-label="Kategori direktori">
              {directoryTabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={type === tab.id ? "active" : ""}
                  role="tab"
                  aria-selected={type === tab.id}
                >
                  {tab.label}
                </Link>
              ))}
            </div>

            <form className="directory-search directory-list-search-form" method="GET" action={`/direktori/${type}`} role="search">
              <label>
                <span className="directory-search-icon" aria-hidden="true">⌕</span>
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder={`Cari ${meta.label.toLowerCase()}...`}
                  aria-label={`Cari ${meta.label.toLowerCase()}`}
                />
              </label>
              <button type="submit">Cari</button>
            </form>
          </div>

          <div className="subsector-directory-heading">
            <div>
              <span>Direktori Terverifikasi Kabupaten Bangka</span>
              <h2>{query ? `Hasil pencarian: "${query}"` : `Daftar ${meta.label}`}</h2>
            </div>
            <p>
              {data.total > 0
                ? `Halaman ${data.page} dari ${data.totalPages} (Total ${data.total} data). Klik kartu untuk membuka profil lengkap.`
                : "Belum ada data yang cocok dengan pencarian."}
            </p>
          </div>

          {data.items.length === 0 ? (
            <div className="subsector-directory-empty">
              <strong>Belum ada profil yang dapat ditampilkan.</strong>
              <span>
                {query
                  ? `Tidak ditemukan hasil pencarian untuk "${query}". Silakan coba kata kunci lain.`
                  : `Data profil akan otomatis muncul setelah pengajuan diverifikasi dan disetujui petugas.`}
              </span>
              {query ? (
                <div style={{ marginTop: "14px" }}>
                  <Link href={`/direktori/${type}`} className="directory-card-link-label" style={{ fontWeight: 600 }}>
                    ← Lihat semua {meta.label.toLowerCase()}
                  </Link>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="subsector-directory-grid">
              {data.items.map((item) => (
                <Link
                  href={`/direktori/${item.type}/${item.id}`}
                  className={`directory-card subsector-directory-card ${item.unggulan ? "is-featured" : ""}`}
                  key={`${item.type}-${item.id}`}
                  aria-label={`Lihat detail ${item.title}`}
                >
                  <div className="directory-card-media">
                    {item.image ? (
                      <img src={item.image} alt={item.title} loading="lazy" />
                    ) : (
                      <span className="directory-initials" aria-hidden="true">
                        {initials(item.title)}
                      </span>
                    )}
                    <div className="directory-card-badges">
                      <span>{item.category || meta.label}</span>
                      {item.unggulan ? <strong>Unggulan</strong> : null}
                    </div>
                  </div>
                  <div className="directory-card-copy">
                    <span className="directory-verified">✓ Disetujui dan terverifikasi</span>
                    <h3>{item.title}</h3>
                    {item.subtitle ? <p className="directory-subtitle">{item.subtitle}</p> : null}
                    <div className="directory-card-meta">
                      {item.location ? <span>⌖ {item.location}</span> : null}
                    </div>
                    <p className="directory-description">
                      {item.description || "Profil telah diverifikasi dan tercatat dalam direktori SI PARIK BANGKA."}
                    </p>
                    <span className="directory-card-link-label">
                      Lihat profil <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <PublicPagination
            page={data.page}
            totalPages={data.totalPages}
            basePath={paginationBasePath}
            alwaysShow={true}
          />
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
