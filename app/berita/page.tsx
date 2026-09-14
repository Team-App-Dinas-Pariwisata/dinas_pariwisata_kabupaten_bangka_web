import type { Metadata } from "next";
import Link from "next/link";
import PublicPagination from "@/components/public/PublicPagination";
import PublicSiteFooter from "@/components/public/PublicSiteFooter";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import { getPublicNewsList } from "@/lib/public-content";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


export const metadata: Metadata = {
  title: "Berita | SI PARIK BANGKA Kabupaten Bangka",
  description: "Berita terbaru ekonomi kreatif dan pariwisata Kabupaten Bangka.",
};

function formatDate(value: string | null) {
  if (!value) return "Tanggal belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export default async function BeritaPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const params = await searchParams;
  const requestedPage = Number(params.page ?? "1");
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const data = await getPublicNewsList(requestedPage, 9, query);
  const fallbackImages = ["/hero-home-v15.jpg", "/kriya-bangka.jpg", "/kuliner-bangka.png", "/hero-bangka.jpg"];
  const paginationBasePath = query ? `/berita?q=${encodeURIComponent(query)}` : "/berita";

  return (
    <div className="public-page-shell">
      <PublicSiteHeader />
      <main>
        <section className="public-page-hero public-page-hero-news">
          <div className="public-container public-page-hero-inner">
            <span className="public-eyebrow">Informasi & Cerita</span>
            <h1>Berita terbaru dari ekosistem kreatif Bangka.</h1>
            <p>Ikuti kabar, program, kolaborasi, dan cerita pelaku ekonomi kreatif serta pariwisata Kabupaten Bangka.</p>
          </div>
        </section>

        <section className="public-content-section">
          <div className="public-container">
            <div className="directory-toolbar directory-list-toolbar-wrap" style={{ marginBottom: "28px" }}>
              <form className="directory-search directory-list-search-form" method="GET" action="/berita" role="search" style={{ maxWidth: "480px" }}>
                <label>
                  <span className="directory-search-icon" aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Cari judul berita, topik, atau kategori..."
                    aria-label="Cari berita"
                  />
                </label>
                <button type="submit">Cari</button>
              </form>
            </div>

            <div className="public-list-heading">
              <div>
                <span className="public-section-label">Berita</span>
                <h2>{query ? `Hasil pencarian: "${query}"` : "Semua berita"}</h2>
              </div>
              <p>
                {data.total > 0
                  ? `Halaman ${data.page} dari ${data.totalPages} (Total ${data.total} berita dipublikasikan).`
                  : "Tidak ada berita yang ditemukan."}
              </p>
            </div>

            {data.items.length > 0 ? (
              <div className="public-news-grid">
                {data.items.map((item, index) => (
                  <article className="public-news-card" key={item.id}>
                    <Link href={`/berita/${item.slug}`} className="public-card-image-link" aria-label={item.judul}>
                      <div
                        className="public-news-card-image"
                        style={{ backgroundImage: `url(${item.foto_utama || fallbackImages[index % fallbackImages.length]})` }}
                        role="img"
                        aria-label={item.foto_alt || item.judul}
                      >
                        <span>{item.nama_kategori || "Berita"}</span>
                      </div>
                    </Link>
                    <div className="public-news-card-body">
                      <time>{formatDate(item.tanggal_publikasi)}</time>
                      <h3><Link href={`/berita/${item.slug}`}>{item.judul}</Link></h3>
                      <p>{item.ringkasan || item.subjudul || "Informasi terbaru dari SI PARIK BANGKA Kabupaten Bangka."}</p>
                      <Link href={`/berita/${item.slug}`} className="public-read-link">Baca berita <span>→</span></Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="public-empty-state">
                {query ? (
                  <>
                    <p>Tidak ditemukan berita dengan kata kunci &ldquo;{query}&rdquo;.</p>
                    <div style={{ marginTop: "14px" }}>
                      <Link href="/berita" className="public-read-link">
                        ← Lihat semua berita
                      </Link>
                    </div>
                  </>
                ) : (
                  "Belum ada berita yang dipublikasikan."
                )}
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
      </main>
      <PublicSiteFooter />
    </div>
  );
}
