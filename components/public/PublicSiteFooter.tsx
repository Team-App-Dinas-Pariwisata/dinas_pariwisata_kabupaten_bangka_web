import PublicContactSection from "@/components/public/PublicContactSection";

export default function PublicSiteFooter() {
  return (
    <>
      <PublicContactSection />

      <footer className="footer">
        <div className="page-container footer-main">
          <div className="footer-brand">
            <a className="footer-si-parik-brand" href="/#beranda" aria-label="SI PARIK BANGKA">
              <img src="/logo-si-parik-preloader.png" alt="SI PARIK BANGKA" />
            </a>
            <p>
              Aplikasi Pendataan Pelaku Ekonomi Kreatif dan SDM Pariwisata Kabupaten Bangka.
            </p>
          </div>

          <div className="footer-column">
            <strong>Navigasi</strong>
            <a href="/#beranda">Beranda</a>
            <a href="/#subsektor">Subsektor</a>
            <a href="/#pelaku-ekraf">Pelaku Ekraf</a>
            <a href="/#dokumen">Pengajuan</a>
          </div>

          <div className="footer-column">
            <strong>Layanan</strong>
            <a href="/#dokumen">Dokumen Pengajuan</a>
            <a href="/#pelaku-ekraf">Komunitas &amp; Asosiasi</a>
            <a href="/berita">Berita</a>
            <a href="/acara">Acara</a>
            <a href="#kontak">Kontak Kami</a>
            <a href="/akun/masuk">Akun Pengaju</a>
            <a href="/petugas">Portal Admin &amp; Pengguna</a>
          </div>

          <div className="footer-column footer-contact">
            <strong>Dinas Pariwisata &amp; Kebudayaan</strong>
            <span>Kabupaten Bangka</span>
            <span>Provinsi Kepulauan Bangka Belitung</span>
            <a href="/#beranda">exotic.bangka.go.id</a>
          </div>
        </div>

        <div className="page-container footer-bottom">
          <span>© 2026 SI PARIK BANGKA Kabupaten Bangka</span>
          <span>Dirancang untuk layanan publik yang lebih sederhana.</span>
        </div>
      </footer>
    </>
  );
}
