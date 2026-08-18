import Link from "next/link";
import PublicContactSection from "@/components/public/PublicContactSection";

export default function PublicSiteFooter() {
  return (
    <>
      <PublicContactSection />
      <footer className="public-site-footer">
        <div className="public-container public-footer-inner">
          <div className="public-footer-brand-block">
            <Link href="/" className="public-footer-si-parik" aria-label="SI PARIK BANGKA">
              <img src="/logo-si-parik-preloader.png" alt="SI PARIK BANGKA" />
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
    </>
  );
}
