import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicSiteFooter from "@/components/public/PublicSiteFooter";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import { getPublicNewsBySlug, getRelatedNews } from "@/lib/public-content";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


type Props = { params: Promise<{ slug: string }> };

function formatDate(value: string | null) {
  if (!value) return "Tanggal belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicNewsBySlug(slug);
  if (!item) return { title: "Berita tidak ditemukan | SI PARIK BANGKA" };
  return {
    title: `${item.judul} | SI PARIK BANGKA Kabupaten Bangka`,
    description: item.ringkasan || item.subjudul || "Berita SI PARIK BANGKA Kabupaten Bangka",
  };
}

export default async function DetailBeritaPage({ params }: Props) {
  const { slug } = await params;
  const item = await getPublicNewsBySlug(slug);
  if (!item) notFound();
  const related = await getRelatedNews(item.id, 3);
  const heroImage = item.foto_utama || "/hero-home-v15.jpg";

  return (
    <div className="public-page-shell">
      <PublicSiteHeader />
      <main>
        <article className="public-detail">
          <div className="public-container public-detail-breadcrumb">
            <Link href="/">Beranda</Link><span>/</span><Link href="/berita">Berita</Link><span>/</span><span>{item.nama_kategori || "Berita"}</span>
          </div>

          <header className="public-container public-detail-header">
            <span className="public-detail-category">{item.nama_kategori || "Berita"}</span>
            <h1>{item.judul}</h1>
            {item.subjudul && <p className="public-detail-subtitle">{item.subjudul}</p>}
            <div className="public-detail-meta">
              <span>{formatDate(item.tanggal_publikasi)}</span>
              {item.penulis_tampil && <span>Oleh {item.penulis_tampil}</span>}
            </div>
          </header>

          <div className="public-container public-detail-image-wrap">
            <div className="public-detail-image" style={{ backgroundImage: `url(${heroImage})` }} role="img" aria-label={item.foto_alt || item.judul} />
            {item.foto_keterangan && <small>{item.foto_keterangan}</small>}
          </div>

          <div className="public-container public-article-layout">
            <div className="public-article-content">
              {item.ringkasan && <p className="public-article-lead">{item.ringkasan}</p>}
              <div className="public-rich-text">{item.isi}</div>
              {item.sumber_url && (
                <p className="public-source-note">Sumber: <a href={item.sumber_url} target="_blank" rel="noreferrer">{item.sumber_nama || "Tautan sumber"}</a></p>
              )}
            </div>
            <aside className="public-detail-aside">
              <span>Bagikan informasi</span>
              <p>Gunakan tautan halaman ini untuk membagikan berita kepada masyarakat dan mitra.</p>
              <Link href="/berita" className="public-outline-button">← Kembali ke berita</Link>
            </aside>
          </div>
        </article>

        {related.length > 0 && (
          <section className="public-related-section">
            <div className="public-container">
              <div className="public-list-heading compact">
                <div><span className="public-section-label">Lainnya</span><h2>Berita terkait</h2></div>
                <Link href="/berita" className="public-read-link">Lihat semua →</Link>
              </div>
              <div className="public-related-grid">
                {related.map((news, index) => (
                  <Link href={`/berita/${news.slug}`} className="public-related-card" key={news.id}>
                    <div className="public-related-image" style={{ backgroundImage: `url(${news.foto_utama || ["/kriya-bangka.jpg", "/kuliner-bangka.png", "/hero-bangka.jpg"][index % 3]})` }} />
                    <div><span>{news.nama_kategori || "Berita"} · {formatDate(news.tanggal_publikasi)}</span><strong>{news.judul}</strong></div>
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
