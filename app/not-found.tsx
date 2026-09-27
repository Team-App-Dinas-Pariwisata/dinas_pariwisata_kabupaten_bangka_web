import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import PublicSiteFooter from "@/components/public/PublicSiteFooter";

export const metadata: Metadata = {
  title: "404 - Halaman Tidak Ditemukan | SI PARIK BANGKA",
  description:
    "Halaman yang Anda tuju tidak ditemukan di portal Dinas Pariwisata dan Kebudayaan Kabupaten Bangka. Temukan destinasi wisata, kuliner, dan acara lainnya.",
};

export default function NotFound() {
  const quickLinks = [
    {
      title: "Destinasi Wisata",
      desc: "Pantai berpasir putih, gugusan batu granit eksotis, dan wisata alam.",
      href: "/wisata/tempat-wisata",
      badge: "Populer",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
          <circle cx="17.5" cy="6.5" r="2.5" />
        </svg>
      ),
    },
    {
      title: "Kuliner Khas Bangka",
      desc: "Cicipi kelezatan Lempah Kuning, Otak-otak, Pantiaw, dan kopi legendaris.",
      href: "/wisata/kuliner",
      badge: "Kuliner",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      ),
    },
    {
      title: "Kalender Acara & Event",
      desc: "Jadwal festival budaya, pertunjukan seni, pameran kriya, dan perayaan daerah.",
      href: "/acara",
      badge: "Agenda",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      title: "Direktori Pelaku Ekraf",
      desc: "Dukung karya produk UMKM, pengrajin kriya, fesyen, dan talenta kreatif Bangka.",
      href: "/direktori/ekraf",
      badge: "17 Subsektor",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="public-page-shell not-found-page-shell">
      <PublicSiteHeader />

      <main className="not-found-main" id="main-content">
        <section className="not-found-hero">
          <div className="public-container not-found-container">
            {/* Visual Island Compass Illustration */}
            <div className="not-found-visual-wrapper">
              <div className="not-found-glow" aria-hidden="true" />
              <div className="not-found-badge-top">
                <span className="not-found-pulse-dot" />
                <span>Kode Status 404 • Halaman Belum Tersedia</span>
              </div>

              <div className="not-found-illustration" aria-hidden="true">
                <svg
                  className="not-found-svg"
                  viewBox="0 0 460 220"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="nf-sky" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d8eff5" />
                      <stop offset="50%" stopColor="#eef8f8" />
                      <stop offset="100%" stopColor="#fff9ef" />
                    </linearGradient>
                    <linearGradient id="nf-sea" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2c94a4" />
                      <stop offset="50%" stopColor="#3ca8b8" />
                      <stop offset="100%" stopColor="#1f7181" />
                    </linearGradient>
                    <linearGradient id="nf-sand" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ebd7af" />
                      <stop offset="100%" stopColor="#d9be8a" />
                    </linearGradient>
                    <linearGradient id="nf-granite-1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7a929d" />
                      <stop offset="100%" stopColor="#435e6c" />
                    </linearGradient>
                    <linearGradient id="nf-granite-2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#5d7683" />
                      <stop offset="100%" stopColor="#2b4350" />
                    </linearGradient>
                    <linearGradient id="nf-sun" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffd875" />
                      <stop offset="100%" stopColor="#ffb347" />
                    </linearGradient>
                  </defs>

                  {/* Backdrop Island Aura */}
                  <rect width="460" height="220" rx="28" fill="url(#nf-sky)" />

                  {/* Sun / Sunset */}
                  <circle cx="230" cy="95" r="42" fill="url(#nf-sun)" opacity="0.85" />

                  {/* Horizon Clouds */}
                  <path
                    d="M60 110 Q75 95 95 98 Q115 90 135 105 Q145 110 160 110 Z"
                    fill="#ffffff"
                    opacity="0.75"
                  />
                  <path
                    d="M310 102 Q325 88 345 92 Q365 85 385 100 Q395 105 410 105 Z"
                    fill="#ffffff"
                    opacity="0.65"
                  />

                  {/* Sea Waves */}
                  <path
                    d="M0 145 C60 140 120 152 180 146 C240 140 300 152 360 146 C410 141 440 144 460 145 L460 220 L0 220 Z"
                    fill="url(#nf-sea)"
                    opacity="0.9"
                  />
                  <path
                    d="M0 160 C80 156 160 168 240 162 C320 156 400 166 460 160 L460 220 L0 220 Z"
                    fill="#1f7181"
                    opacity="0.5"
                  />

                  {/* Beach Coastline Sand */}
                  <path
                    d="M40 220 Q120 175 220 178 Q320 181 420 220 Z"
                    fill="url(#nf-sand)"
                  />

                  {/* Iconic Bangka Granite Boulders (Batu Granit Pantai) */}
                  <path
                    d="M80 190 Q95 140 135 145 Q165 148 175 190 Q155 195 80 190 Z"
                    fill="url(#nf-granite-1)"
                  />
                  <path
                    d="M140 192 Q155 152 185 155 Q210 158 215 192 Q185 196 140 192 Z"
                    fill="url(#nf-granite-2)"
                  />
                  <path
                    d="M280 192 Q295 148 325 150 Q350 154 360 192 Q320 196 280 192 Z"
                    fill="url(#nf-granite-1)"
                  />

                  {/* Lighthouse on Coast */}
                  <polygon points="224,115 236,115 240,175 220,175" fill="#f8fdfd" />
                  <polygon points="225,130 235,130 237,145 223,145" fill="#e0534c" />
                  <polygon points="222,160 238,160 240,175 220,175" fill="#e0534c" />
                  <circle cx="230" cy="112" r="6" fill="#ffd875" />
                  <line x1="230" y1="106" x2="230" y2="102" stroke="#1f7181" strokeWidth="2" />

                  {/* Lighthouse Light Beam */}
                  <polygon points="230,112 110,65 110,85" fill="#ffd875" opacity="0.35" />
                  <polygon points="230,112 350,65 350,85" fill="#ffd875" opacity="0.35" />

                  {/* Palm Tree */}
                  <path d="M105 185 Q115 155 105 130" stroke="#684729" strokeWidth="4" strokeLinecap="round" />
                  <path d="M105 130 Q90 120 75 125" stroke="#257a4d" strokeWidth="3" strokeLinecap="round" />
                  <path d="M105 130 Q105 115 95 110" stroke="#2c8f5b" strokeWidth="3" strokeLinecap="round" />
                  <path d="M105 130 Q120 115 130 122" stroke="#257a4d" strokeWidth="3" strokeLinecap="round" />
                  <path d="M105 130 Q125 135 132 142" stroke="#2c8f5b" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>

              {/* Big 404 Typography */}
              <div className="not-found-number-banner">
                <span className="not-found-digit">4</span>
                <span className="not-found-compass-wrap" title="Kompas Pariwisata Bangka">
                  <svg
                    className="not-found-compass-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="#2c94a4" />
                  </svg>
                </span>
                <span className="not-found-digit">4</span>
              </div>
            </div>

            {/* Content Messaging */}
            <div className="not-found-copy">
              <span className="not-found-kicker">DINAS PARIWISATA &amp; KEBUDAYAAN KABUPATEN BANGKA</span>
              <h1 className="not-found-title">Oops! Halaman Tidak Ditemukan</h1>
              <p className="not-found-lead">
                Sepertinya rute atau tautan yang Anda tuju sedang berada di luar jangkauan radar kami. Halaman ini mungkin telah dipindahkan, berganti alamat, atau sedang dalam pembaharuan sistem.
              </p>

              {/* Quick Search Form */}
              <div className="not-found-search-box">
                <form
                  id="form-404-search"
                  action="/pencarian"
                  method="GET"
                  role="search"
                  className="not-found-search-form"
                >
                  <span className="not-found-search-icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    id="input-404-search"
                    type="search"
                    name="q"
                    placeholder="Cari pantai, kuliner, event, atau produk ekraf Bangka..."
                    aria-label="Cari destinasi atau informasi pariwisata Bangka"
                    className="not-found-search-input"
                  />
                  <button
                    id="btn-404-search-submit"
                    type="submit"
                    className="not-found-search-btn"
                  >
                    Cari
                  </button>
                </form>
              </div>

              {/* Action Buttons */}
              <div className="not-found-actions">
                <Link
                  id="btn-404-back-home"
                  href="/"
                  className="not-found-btn not-found-btn-primary"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Kembali ke Beranda</span>
                </Link>

                <Link
                  id="btn-404-explore-tourism"
                  href="/wisata/tempat-wisata"
                  className="not-found-btn not-found-btn-secondary"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                  </svg>
                  <span>Jelajahi Tempat Wisata</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Discovery Cards */}
        <section className="not-found-explore-section">
          <div className="public-container">
            <div className="not-found-section-header">
              <span className="not-found-section-badge">Jelajahi Informasi</span>
              <h2>Destinasi Pilihan yang Mungkin Anda Cari</h2>
              <p>Temukan ragam potensi pariwisata unggulan dan denyut ekonomi kreatif di Kabupaten Bangka.</p>
            </div>

            <div className="not-found-grid">
              {quickLinks.map((item, idx) => (
                <Link
                  key={item.href}
                  id={`card-404-item-${idx + 1}`}
                  href={item.href}
                  className="not-found-card"
                >
                  <div className="not-found-card-top">
                    <span className="not-found-card-icon">{item.icon}</span>
                    <span className="not-found-card-badge">{item.badge}</span>
                  </div>
                  <h3 className="not-found-card-title">{item.title}</h3>
                  <p className="not-found-card-desc">{item.desc}</p>
                  <span className="not-found-card-arrow">
                    <span>Lihat Selengkapnya</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicSiteFooter />

      {/* Scoped Dynamic Styles for 404 Page */}
      <style>{`
        .not-found-page-shell {
          background: #f7faf9;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .not-found-main {
          flex: 1 0 auto;
        }

        .not-found-hero {
          position: relative;
          padding: 56px 0 68px;
          background: radial-gradient(circle at 50% 18%, rgba(119, 194, 198, 0.22) 0%, rgba(247, 250, 249, 0.85) 60%, #f7faf9 100%);
          overflow: hidden;
        }

        .not-found-container {
          max-width: 820px;
          margin-inline: auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .not-found-visual-wrapper {
          position: relative;
          width: 100%;
          max-width: 480px;
          margin-bottom: 24px;
        }

        .not-found-glow {
          position: absolute;
          inset: 10% 15%;
          background: radial-gradient(circle, rgba(44, 148, 164, 0.35) 0%, rgba(230, 201, 155, 0.15) 70%, transparent 100%);
          filter: blur(36px);
          z-index: 0;
          pointer-events: none;
        }

        .not-found-badge-top {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(44, 148, 164, 0.25);
          color: #1f7181;
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 18px rgba(16, 41, 60, 0.06);
          margin-bottom: 16px;
          position: relative;
          z-index: 2;
        }

        .not-found-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e0534c;
          box-shadow: 0 0 0 0 rgba(224, 83, 76, 0.7);
          animation: notFoundPulse 2s infinite;
        }

        @keyframes notFoundPulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(224, 83, 76, 0.7);
          }
          70% {
            transform: scale(1.1);
            box-shadow: 0 0 0 8px rgba(224, 83, 76, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(224, 83, 76, 0);
          }
        }

        .not-found-illustration {
          position: relative;
          z-index: 1;
          border-radius: 28px;
          box-shadow: 0 16px 48px -12px rgba(16, 41, 60, 0.14);
          overflow: hidden;
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }

        .not-found-illustration:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 52px -10px rgba(16, 41, 60, 0.18);
        }

        .not-found-svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .not-found-number-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: -28px;
          position: relative;
          z-index: 3;
        }

        .not-found-digit {
          font-family: var(--font-montserrat), Montserrat, sans-serif;
          font-size: 82px;
          font-weight: 900;
          line-height: 1;
          color: #10293c;
          text-shadow: 0 4px 16px rgba(16, 41, 60, 0.12);
        }

        .not-found-compass-wrap {
          display: grid;
          place-items: center;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 8px 24px rgba(44, 148, 164, 0.28);
          border: 3px solid #2c94a4;
          animation: notFoundRotate 14s linear infinite;
        }

        @keyframes notFoundRotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .not-found-compass-icon {
          width: 38px;
          height: 38px;
          color: #10293c;
        }

        .not-found-copy {
          max-width: 660px;
          margin-top: 10px;
        }

        .not-found-kicker {
          display: inline-block;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #2c94a4;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .not-found-title {
          font-family: var(--font-montserrat), Montserrat, sans-serif;
          font-size: clamp(26px, 4vw, 36px);
          font-weight: 850;
          color: #10293c;
          letter-spacing: -0.02em;
          line-height: 1.25;
          margin: 0 0 14px;
        }

        .not-found-lead {
          font-size: clamp(14.5px, 1.8vw, 16px);
          line-height: 1.65;
          color: #426072;
          margin: 0 0 28px;
        }

        .not-found-search-box {
          margin-bottom: 28px;
          width: 100%;
        }

        .not-found-search-form {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1.5px solid rgba(44, 148, 164, 0.35);
          border-radius: 999px;
          padding: 6px 8px 6px 18px;
          box-shadow: 0 8px 30px rgba(16, 41, 60, 0.08);
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .not-found-search-form:focus-within {
          border-color: #2c94a4;
          box-shadow: 0 10px 36px rgba(44, 148, 164, 0.2);
        }

        .not-found-search-icon {
          display: flex;
          align-items: center;
          color: #77c2c6;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .not-found-search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 15px;
          font-family: inherit;
          color: #10293c;
          outline: none;
        }

        .not-found-search-input::placeholder {
          color: #8fa5b0;
        }

        .not-found-search-btn {
          border: none;
          background: linear-gradient(135deg, #1f7181, #2c94a4);
          color: #ffffff;
          font-size: 14.5px;
          font-weight: 700;
          padding: 10px 22px;
          border-radius: 999px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 14px rgba(44, 148, 164, 0.35);
        }

        .not-found-search-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 18px rgba(44, 148, 164, 0.45);
        }

        .not-found-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .not-found-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 13px 26px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
        }

        .not-found-btn-primary {
          background: linear-gradient(135deg, #1f7181, #2c94a4);
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(31, 113, 129, 0.3);
        }

        .not-found-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(31, 113, 129, 0.4);
        }

        .not-found-btn-secondary {
          background: #ffffff;
          color: #1f7181;
          border: 1.5px solid rgba(44, 148, 164, 0.35);
          box-shadow: 0 4px 14px rgba(16, 41, 60, 0.05);
        }

        .not-found-btn-secondary:hover {
          transform: translateY(-2px);
          border-color: #2c94a4;
          background: #f1f9fa;
          box-shadow: 0 8px 20px rgba(44, 148, 164, 0.15);
        }

        /* Explore Section */
        .not-found-explore-section {
          padding: 56px 0 80px;
          background: #ffffff;
          border-top: 1px solid rgba(16, 41, 60, 0.07);
        }

        .not-found-section-header {
          text-align: center;
          max-width: 580px;
          margin: 0 auto 36px;
        }

        .not-found-section-badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #1f7181;
          background: #eef6f7;
          padding: 5px 14px;
          border-radius: 999px;
          margin-bottom: 10px;
          text-transform: uppercase;
        }

        .not-found-section-header h2 {
          font-family: var(--font-montserrat), Montserrat, sans-serif;
          font-size: clamp(22px, 3vw, 28px);
          font-weight: 800;
          color: #10293c;
          margin: 0 0 10px;
        }

        .not-found-section-header p {
          font-size: 15px;
          color: #557284;
          line-height: 1.55;
          margin: 0;
        }

        .not-found-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 22px;
        }

        .not-found-card {
          display: flex;
          flex-direction: column;
          background: #f7faf9;
          border: 1px solid rgba(16, 41, 60, 0.08);
          border-radius: 20px;
          padding: 24px;
          text-decoration: none;
          color: inherit;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease;
        }

        .not-found-card:hover {
          transform: translateY(-4px);
          background: #ffffff;
          border-color: rgba(44, 148, 164, 0.4);
          box-shadow: 0 14px 34px rgba(16, 41, 60, 0.09);
        }

        .not-found-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .not-found-card-icon {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: rgba(44, 148, 164, 0.12);
          color: #1f7181;
          transition: transform 0.3s ease, background 0.3s ease;
        }

        .not-found-card:hover .not-found-card-icon {
          transform: scale(1.08);
          background: #2c94a4;
          color: #ffffff;
        }

        .not-found-card-badge {
          font-size: 11.5px;
          font-weight: 750;
          color: #2c94a4;
          background: #ffffff;
          border: 1px solid rgba(44, 148, 164, 0.2);
          padding: 3px 10px;
          border-radius: 999px;
        }

        .not-found-card-title {
          font-family: var(--font-montserrat), Montserrat, sans-serif;
          font-size: 17.5px;
          font-weight: 800;
          color: #10293c;
          margin: 0 0 8px;
        }

        .not-found-card-desc {
          font-size: 13.8px;
          line-height: 1.55;
          color: #557284;
          margin: 0 0 20px;
          flex-grow: 1;
        }

        .not-found-card-arrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13.5px;
          font-weight: 750;
          color: #1f7181;
          transition: gap 0.25s ease;
        }

        .not-found-card:hover .not-found-card-arrow {
          gap: 10px;
          color: #2c94a4;
        }

        @media (max-width: 640px) {
          .not-found-hero {
            padding: 40px 0 52px;
          }
          .not-found-digit {
            font-size: 64px;
          }
          .not-found-compass-wrap {
            width: 50px;
            height: 50px;
          }
          .not-found-compass-icon {
            width: 28px;
            height: 28px;
          }
          .not-found-actions {
            flex-direction: column;
            width: 100%;
          }
          .not-found-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
