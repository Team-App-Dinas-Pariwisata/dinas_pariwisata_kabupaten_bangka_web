import Link from "next/link";

export default function PublicSiteFooter() {
  return (
    <footer className="public-site-footer">
      <div className="public-container public-footer-inner">
        <div className="public-footer-brand-block">
          <Link href="/" className="public-footer-official-logo" aria-label="Dinas Pariwisata dan Kebudayaan Kabupaten Bangka">
            <img src="/branding/logo-bangka-header.png" alt="Kabupaten Bangka, Exotic Bangka, dan Wonderful Indonesia" />
          </Link>
          <p>Informasi ekonomi kreatif, berita, agenda, pelaku, dan katalog wisata Kabupaten Bangka.</p>
        </div>
        <div className="public-footer-links">
          <Link href="/">Beranda</Link>
          <Link href="/berita">Berita</Link>
          <Link href="/acara">Acara</Link>
          <Link href="/wisata">Wisata</Link>
        </div>
      </div>
    </footer>
  );
}
