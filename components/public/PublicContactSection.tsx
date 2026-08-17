type ContactIconName = "clock" | "pin" | "mail" | "phone";

function ContactIcon({ name, size = 22 }: { name: ContactIconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "pin":
      return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.4" /></svg>;
    case "mail":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
    case "phone":
      return <svg {...common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" /></svg>;
  }
}

export default function PublicContactSection() {
  return (
    <section className="home-contact-section" id="kontak" aria-labelledby="public-contact-title">
      <div className="page-container">
        <div className="home-contact-card">
          <div className="home-contact-map">
            <iframe
              title="Peta Dinas Pariwisata dan Kebudayaan Kabupaten Bangka"
              src="https://www.google.com/maps?q=Dinas+Pariwisata+dan+Kebudayaan+Kabupaten+Bangka,+Jl.+A.+Yani,+Sungailiat,+Bangka&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div className="home-contact-copy">
            <span className="section-kicker">Hubungi Kami</span>
            <h2 id="public-contact-title">Kontak Kami</h2>
            <p>Kami menyediakan berbagai media yang dapat Anda hubungi untuk informasi layanan pariwisata dan ekonomi kreatif Kabupaten Bangka.</p>

            <div className="home-contact-list">
              <div className="home-contact-item">
                <span className="home-contact-icon"><ContactIcon name="clock" /></span>
                <div><small>Jadwal Kerja</small><strong>Senin–Jumat, 08.00–16.00 WIB</strong></div>
              </div>
              <div className="home-contact-item">
                <span className="home-contact-icon"><ContactIcon name="pin" /></span>
                <div><small>Alamat</small><strong>Jl. A. Yani (Jalur Dua), Sungailiat, Bangka 33215</strong></div>
              </div>
              <a className="home-contact-item" href="mailto:parbudaya2021@bangka.go.id">
                <span className="home-contact-icon"><ContactIcon name="mail" /></span>
                <div><small>Email</small><strong>parbudaya2021@bangka.go.id</strong></div>
              </a>
              <a className="home-contact-item" href="tel:+6271792496">
                <span className="home-contact-icon"><ContactIcon name="phone" /></span>
                <div><small>Telepon</small><strong>(0717) 92496</strong></div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
