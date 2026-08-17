export default function PublicAboutSection() {
  return (
    <section className="public-about-section" id="tentang" aria-labelledby="public-about-title">
      <div className="public-container">
        <div className="public-about-card">
          <div className="public-about-copy">
            <span className="public-about-kicker">Tentang Kami</span>
            <h2 id="public-about-title">SI PARIK BANGKA</h2>
            <p>
              SI PARIK BANGKA merupakan layanan informasi dan pendataan yang mendukung ekosistem
              ekonomi kreatif serta pariwisata Kabupaten Bangka. Platform ini memudahkan masyarakat
              mengakses berita, agenda, data pelaku, informasi wisata, dan layanan pengajuan dalam
              satu portal.
            </p>
          </div>

          <div className="public-about-info" aria-label="Informasi Dinas Pariwisata dan Kebudayaan Kabupaten Bangka">
            <div className="public-about-info-item">
              <span>Instansi</span>
              <strong>Dinas Pariwisata dan Kebudayaan Kabupaten Bangka</strong>
            </div>
            <div className="public-about-info-item">
              <span>Alamat</span>
              <strong>Jl. A. Yani (Jalur Dua), Sungailiat, Bangka 33215</strong>
            </div>
            <div className="public-about-info-item">
              <span>Kontak</span>
              <div className="public-about-contact-links">
                <a href="mailto:parbudaya2021@bangka.go.id">parbudaya2021@bangka.go.id</a>
                <a href="tel:+6271792496">(0717) 92496</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
