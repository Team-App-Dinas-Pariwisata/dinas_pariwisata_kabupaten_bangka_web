"use client";

import { useEffect, useRef, useState } from "react";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import VerifiedDirectory from "@/components/public/VerifiedDirectory";
import EkrafStatistics from "@/components/public/EkrafStatistics";

type PublicBerita = {
  id: number;
  slug: string;
  judul: string;
  subjudul: string | null;
  ringkasan: string | null;
  penulis_tampil: string | null;
  sumber_url: string | null;
  foto_utama: string | null;
  foto_alt: string | null;
  headline: number;
  urutan_tampil: number;
  tanggal_publikasi: string | null;
  nama_kategori: string | null;
};

type PublicAcara = {
  id: number;
  slug: string;
  nama_acara: string;
  ringkasan: string | null;
  deskripsi: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status_acara: string;
  jenis_pelaksanaan: string;
  nama_lokasi: string | null;
  alamat: string | null;
  tautan_daring: string | null;
  penyelenggara: string | null;
  memerlukan_pendaftaran: number;
  tautan_pendaftaran: string | null;
  foto_utama: string | null;
  foto_alt: string | null;
  unggulan: number;
  urutan_tampil: number;
  tanggal_publikasi: string | null;
  nama_kategori: string | null;
};


type IconName =
  | "arrow"
  | "calendar"
  | "pin"
  | "users"
  | "file"
  | "spark"
  | "briefcase"
  | "camera"
  | "palette"
  | "music"
  | "food"
  | "fashion"
  | "game"
  | "film"
  | "architecture"
  | "interior"
  | "product"
  | "publishing"
  | "advertising"
  | "performance"
  | "art"
  | "broadcast"
  | "menu"
  | "close"
  | "chevron"
  | "clock"
  | "mail"
  | "phone";

type PublicSubsector = {
  id: number;
  kode: string;
  nama_subsektor: string;
  deskripsi: string | null;
  pelaku_count: number;
};

const fallbackSubsectors: PublicSubsector[] = [
  { id: 1, kode: "APL", nama_subsektor: "Aplikasi", deskripsi: null, pelaku_count: 0 },
  { id: 2, kode: "ARS", nama_subsektor: "Arsitektur", deskripsi: null, pelaku_count: 0 },
  { id: 3, kode: "DIN", nama_subsektor: "Desain Interior", deskripsi: null, pelaku_count: 0 },
  { id: 4, kode: "DKV", nama_subsektor: "Desain Komunikasi Visual", deskripsi: null, pelaku_count: 0 },
  { id: 5, kode: "DPR", nama_subsektor: "Desain Produk", deskripsi: null, pelaku_count: 0 },
  { id: 6, kode: "FSH", nama_subsektor: "Fashion", deskripsi: null, pelaku_count: 0 },
  { id: 7, kode: "FAV", nama_subsektor: "Film, Animasi dan Video", deskripsi: null, pelaku_count: 0 },
  { id: 8, kode: "FOT", nama_subsektor: "Fotografi", deskripsi: null, pelaku_count: 0 },
  { id: 9, kode: "KRY", nama_subsektor: "Kriya", deskripsi: null, pelaku_count: 0 },
  { id: 10, kode: "KUL", nama_subsektor: "Kuliner", deskripsi: null, pelaku_count: 0 },
  { id: 11, kode: "MUS", nama_subsektor: "Musik", deskripsi: null, pelaku_count: 0 },
  { id: 12, kode: "PEN", nama_subsektor: "Penerbitan", deskripsi: null, pelaku_count: 0 },
  { id: 13, kode: "IKL", nama_subsektor: "Periklanan", deskripsi: null, pelaku_count: 0 },
  { id: 14, kode: "SPT", nama_subsektor: "Seni Pertunjukan", deskripsi: null, pelaku_count: 0 },
  { id: 15, kode: "SRP", nama_subsektor: "Seni Rupa", deskripsi: null, pelaku_count: 0 },
  { id: 16, kode: "TVR", nama_subsektor: "Televisi dan Radio", deskripsi: null, pelaku_count: 0 },
  { id: 17, kode: "GME", nama_subsektor: "Pengembangan Permainan", deskripsi: null, pelaku_count: 0 },
];

const subsectorDisplayOrder = ["KUL", "KRY", "FSH", "FOT", "MUS", "FAV", "GME", "ARS", "APL", "DIN", "DKV", "DPR", "PEN", "IKL", "SPT", "SRP", "TVR"];

function sortSubsectors(items: PublicSubsector[]) {
  return [...items].sort((a, b) => {
    const ai = subsectorDisplayOrder.indexOf(a.kode);
    const bi = subsectorDisplayOrder.indexOf(b.kode);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
  });
}

function subsectorIcon(kode: string): IconName {
  const icons: Record<string, IconName> = {
    APL: "briefcase", ARS: "architecture", DIN: "interior", DKV: "palette", DPR: "product",
    FSH: "fashion", FAV: "film", FOT: "camera", KRY: "palette", KUL: "food", MUS: "music",
    PEN: "publishing", IKL: "advertising", SPT: "performance", SRP: "art", TVR: "broadcast", GME: "game",
  };
  return icons[kode] || "spark";
}


const newsFallbackImages = ["/kriya-bangka.jpg", "/kuliner-bangka.png", "/hero-home-v15.jpg"];

function formatNewsDate(value: string | null) {
  if (!value) return "Berita terbaru";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Berita terbaru";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatEventRange(startValue: string, endValue: string) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime())) return "Jadwal akan diumumkan";

  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  if (Number.isNaN(end.getTime()) || start.toDateString() === end.toDateString()) {
    return dateFormatter.format(start);
  }

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${String(start.getDate()).padStart(2, "0")}–${String(end.getDate()).padStart(2, "0")} ${new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(start)}`;
  }
  return `${dateFormatter.format(start)} – ${dateFormatter.format(end)}`;
}

function eventDateParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "--", month: "---" };
  return {
    day: new Intl.DateTimeFormat("id-ID", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date).replace(".", "").toUpperCase(),
  };
}

function embeddableImage(url: string | null, fallback: string) {
  if (!url) return fallback;
  if (url.startsWith("/")) return url;
  // URL viewer ImgBB (ibb.co / ibb.co.com) adalah halaman HTML, bukan file gambar.
  // Gunakan hanya URL yang benar-benar menunjuk ke file gambar sebagai background.
  if (/^https?:\/\/.+\.(?:jpe?g|png|webp|gif)(?:[?#].*)?$/i.test(url)) return url;
  return fallback;
}

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const [beritaItems, setBeritaItems] = useState<PublicBerita[]>([]);
  const [acaraItems, setAcaraItems] = useState<PublicAcara[]>([]);
  const [subsectorItems, setSubsectorItems] = useState<PublicSubsector[]>(sortSubsectors(fallbackSubsectors));
  const [contentLoading, setContentLoading] = useState(true);


  useEffect(() => {
    let cancelled = false;

    const loadHomepageContent = async () => {
      try {
        const [beritaResponse, acaraResponse, subsectorResponse] = await Promise.all([
          fetch("/api/public/berita", { cache: "no-store" }),
          fetch("/api/public/acara", { cache: "no-store" }),
          fetch("/api/public/subsektor", { cache: "no-store" }),
        ]);

        const beritaPayload = (await beritaResponse.json()) as { data?: PublicBerita[] };
        const acaraPayload = (await acaraResponse.json()) as { data?: PublicAcara[] };
        const subsectorPayload = (await subsectorResponse.json()) as { data?: PublicSubsector[] };

        if (!cancelled && beritaResponse.ok && Array.isArray(beritaPayload.data)) {
          setBeritaItems(beritaPayload.data);
        }

        if (!cancelled && acaraResponse.ok && Array.isArray(acaraPayload.data)) {
          setAcaraItems(acaraPayload.data);
        }

        if (!cancelled && subsectorResponse.ok && Array.isArray(subsectorPayload.data) && subsectorPayload.data.length > 0) {
          setSubsectorItems(sortSubsectors(subsectorPayload.data));
        }
      } catch (error) {
        console.error("Gagal memuat berita dan acara homepage:", error);
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    };

    loadHomepageContent();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    let frame = 0;
    const update = () => {
      const y = Math.min(window.scrollY, 900);
      hero.style.setProperty("--parallax-y", `${y * 0.22}px`);
      hero.style.setProperty("--parallax-fade", `${Math.max(0.28, 1 - y / 900)}`);
      frame = 0;
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const featuredNews = beritaItems[0];
  const secondaryNews = beritaItems.slice(1, 3);
  const visibleEvents = acaraItems.slice(0, 4);

  return (
    <main className="site-shell">
      <PublicSiteHeader overlay />
      <section ref={heroRef} className="hero" id="beranda">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-orb hero-orb-one" aria-hidden="true" />
        <div className="hero-orb hero-orb-two" aria-hidden="true" />

        <div className="hero-content page-container">
          <div className="hero-copy">
            <h1>
              SI PARIK BANGKA
            </h1>
            <p className="hero-lead">
              Platform pendataan pelaku ekonomi kreatif, SDM pariwisata, komunitas,
              lembaga, dan asosiasi dalam satu pengalaman digital yang ringkas,
              transparan, dan mudah diakses.
            </p>

            <div className="hero-actions" id="pengajuan">
              <a className="button button-primary" href="/akun/masuk">
                Ajukan Data Sekarang <Icon name="arrow" size={18} />
              </a>
            </div>

            <div className="hero-metrics" aria-label="Ringkasan data">
              <div>
                <strong>17</strong>
                <span>Subsektor Ekraf</span>
              </div>
              <div>
                <strong>08</strong>
                <span>Kecamatan</span>
              </div>
              <div>
                <strong>1</strong>
                <span>Portal Terintegrasi</span>
              </div>
            </div>
          </div>


          <aside className="hero-spotlight" aria-label="Tentang SI PARIK BANGKA">
            <div className="spotlight-head">
              <div>
                <span className="spotlight-kicker">Portal Digital</span>
                <h2>Ekraf Bangka</h2>
              </div>
              <span className="spotlight-icon"><Icon name="spark" size={19} /></span>
            </div>
            <div className="spotlight-visual">
              <span className="visual-ring ring-one" />
              <span className="visual-ring ring-two" />
              <span className="visual-center">17</span>
              <span className="visual-label">subsektor</span>
            </div>
            <p>
              Data yang lebih rapi membantu promosi, kolaborasi, pembinaan, dan
              pengembangan ekosistem kreatif di Kabupaten Bangka.
            </p>
            <a href="#subsektor" className="text-link">
              Jelajahi ekosistem <Icon name="arrow" size={16} />
            </a>
          </aside>
        </div>

      </section>

      <section className="section section-subsector" id="subsektor">
        <div className="page-container">
          <div className="section-heading split-heading">
            <div>
              <span className="section-kicker">17 Subsektor Ekonomi Kreatif</span>
              <h2>Temukan ruang kreatifmu.</h2>
            </div>
            <p>
              Jelajahi kategori ekonomi kreatif, temukan pelaku di sekitar Anda,
              dan buka peluang kolaborasi lintas subsektor.
            </p>
          </div>

          <div className="subsector-grid">
            {subsectorItems.map((item, index) => (
              <a href={`/subsektor/${item.id}`} className="subsector-card" key={item.id}>
                <span className="subsector-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="subsector-icon"><Icon name={subsectorIcon(item.kode)} size={42} /></span>
                <div>
                  <strong>{item.nama_subsektor}</strong>
                  <span>{item.pelaku_count} pelaku</span>
                </div>
                <span className="subsector-arrow"><Icon name="arrow" size={17} /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <VerifiedDirectory />

      <EkrafStatistics />

      <section className="section editorial-section" id="berita-acara">
        <div className="page-container">
          <div className="section-heading split-heading editorial-heading">
            <div>
              <span className="section-kicker">Berita & Acara</span>
              <h2>Cerita terbaru dan agenda pilihan dari Bangka.</h2>
            </div>
            <p>Konten pada bagian ini ditampilkan langsung dari berita dan acara yang telah dipublikasikan melalui dashboard.</p>
          </div>

          {contentLoading ? (
            <div className="editorial-loading" aria-live="polite">Memuat berita dan acara terbaru...</div>
          ) : (
            <div className="editorial-grid">
              <div className="news-column">
                <div className="editorial-column-head">
                  <div>
                    <span>Berita terbaru</span>
                    <strong>Informasi & cerita</strong>
                    <a href="/berita" className="editorial-all-link">Lihat semua berita →</a>
                  </div>
                  <span className="editorial-count">{beritaItems.length.toString().padStart(2, "0")}</span>
                </div>

                {featuredNews ? (
                  <>
                    <article className="news-featured">
                      <div
                        className="news-featured-image"
                        style={{ backgroundImage: `url(${embeddableImage(featuredNews.foto_utama, newsFallbackImages[0])})` }}
                        role="img"
                        aria-label={featuredNews.foto_alt || featuredNews.judul}
                      >
                        <span className="content-chip">{featuredNews.nama_kategori || "Berita"}</span>
                      </div>
                      <div className="news-featured-copy">
                        <span className="content-meta">{formatNewsDate(featuredNews.tanggal_publikasi)}</span>
                        <h3>{featuredNews.judul}</h3>
                        <p>{featuredNews.ringkasan || featuredNews.subjudul || "Informasi terbaru dari SI PARIK BANGKA Kabupaten Bangka."}</p>
                        <a href={`/berita/${featuredNews.slug}`} className="content-link">
                          Baca selengkapnya <Icon name="arrow" size={16} />
                        </a>
                      </div>
                    </article>

                    {secondaryNews.length > 0 && (
                      <div className="news-secondary-list">
                        {secondaryNews.map((news, index) => (
                          <article className="news-secondary" key={news.id}>
                            <div
                              className="news-secondary-image"
                              style={{ backgroundImage: `url(${embeddableImage(news.foto_utama, newsFallbackImages[(index + 1) % newsFallbackImages.length])})` }}
                              role="img"
                              aria-label={news.foto_alt || news.judul}
                            />
                            <div>
                              <span className="content-meta">{news.nama_kategori || "Berita"} · {formatNewsDate(news.tanggal_publikasi)}</span>
                              <h3>{news.judul}</h3>
                              <p>{news.ringkasan || news.subjudul || "Informasi terbaru SI PARIK BANGKA Kabupaten Bangka."}</p>
                            </div>
                            <a href={`/berita/${news.slug}`} className="round-link" aria-label={`Baca ${news.judul}`}>
                              <Icon name="arrow" size={17} />
                            </a>
                          </article>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="content-empty">Belum ada berita yang dipublikasikan.</div>
                )}
              </div>

              <aside className="events-column" aria-label="Agenda acara">
                <div className="editorial-column-head">
                  <div>
                    <span>Agenda pilihan</span>
                    <strong>Acara & aktivitas</strong>
                    <a href="/acara" className="editorial-all-link">Lihat semua acara →</a>
                  </div>
                  <span className="editorial-count">{acaraItems.length.toString().padStart(2, "0")}</span>
                </div>

                {visibleEvents.length > 0 ? (
                  <div className="event-modern-list">
                    {visibleEvents.map((event, index) => {
                      const date = eventDateParts(event.tanggal_mulai);
                      return (
                        <article className={`event-modern-card ${index === 0 ? "is-featured" : ""}`} key={event.id}>
                          <div
                            className="event-modern-image"
                            style={{ backgroundImage: `url(${embeddableImage(event.foto_utama, newsFallbackImages[index % newsFallbackImages.length])})` }}
                            role="img"
                            aria-label={event.foto_alt || event.nama_acara}
                          >
                            <span className="event-modern-date"><strong>{date.day}</strong><small>{date.month}</small></span>
                            <span className="content-chip">{event.nama_kategori || event.jenis_pelaksanaan || "Acara"}</span>
                          </div>
                          <div className="event-modern-copy">
                            <span className="content-meta">{formatEventRange(event.tanggal_mulai, event.tanggal_selesai)}</span>
                            <h3>{event.nama_acara}</h3>
                            <p><Icon name="pin" size={14} /> {event.nama_lokasi || event.alamat || event.jenis_pelaksanaan}</p>
                            {event.ringkasan && <span className="event-summary">{event.ringkasan}</span>}
                            <a href={`/acara/${event.slug}`} className="content-link">
                              Detail acara <Icon name="arrow" size={15} />
                            </a>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="content-empty">Belum ada acara yang dipublikasikan.</div>
                )}
              </aside>
            </div>
          )}
        </div>
      </section>

      <section className="section documents" id="dokumen">
        <div className="page-container documents-card">
          <div className="documents-copy">
            <span className="section-kicker light-kicker">Pengajuan & Dokumen</span>
            <h2>Mulai pendataan tanpa proses yang terasa rumit.</h2>
            <p>
              Siapkan identitas dasar, foto dokumentasi atau logo, dan dokumen pendukung
              bila tersedia. Alur pengajuan dirancang singkat dan mudah dipahami.
            </p>
          </div>

          <div className="document-steps">
            <div className="document-step">
              <span>01</span>
              <div><strong>Isi profil</strong><small>Lengkapi data pelaku / komunitas.</small></div>
              <Icon name="chevron" size={18} />
            </div>
            <div className="document-step">
              <span>02</span>
              <div><strong>Unggah pendukung</strong><small>Dokumentasi, logo, atau sertifikat.</small></div>
              <Icon name="chevron" size={18} />
            </div>
            <div className="document-step">
              <span>03</span>
              <div><strong>Verifikasi data</strong><small>Data ditinjau sebelum ditampilkan.</small></div>
              <Icon name="chevron" size={18} />
            </div>
          </div>
        </div>
      </section>

      <section className="home-contact-section" id="kontak" aria-labelledby="home-contact-title">
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
              <h2 id="home-contact-title">Kontak Kami</h2>
              <p>Kami menyediakan berbagai media yang dapat Anda hubungi untuk informasi layanan pariwisata dan ekonomi kreatif Kabupaten Bangka.</p>

              <div className="home-contact-list">
                <div className="home-contact-item">
                  <span className="home-contact-icon"><Icon name="clock" size={22} /></span>
                  <div><small>Jadwal Kerja</small><strong>Senin–Jumat, 08.00–16.00 WIB</strong></div>
                </div>
                <div className="home-contact-item">
                  <span className="home-contact-icon"><Icon name="pin" size={22} /></span>
                  <div><small>Alamat</small><strong>Jl. A. Yani (Jalur Dua), Sungailiat, Bangka 33215</strong></div>
                </div>
                <a className="home-contact-item" href="mailto:parbudaya2021@bangka.go.id">
                  <span className="home-contact-icon"><Icon name="mail" size={22} /></span>
                  <div><small>Email</small><strong>parbudaya2021@bangka.go.id</strong></div>
                </a>
                <a className="home-contact-item" href="tel:+6271792496">
                  <span className="home-contact-icon"><Icon name="phone" size={22} /></span>
                  <div><small>Telepon</small><strong>(0717) 92496</strong></div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="page-container footer-main">
          <div className="footer-brand">
            <a className="footer-si-parik-brand" href="#beranda" aria-label="SI PARIK BANGKA">
              <img src="/logo-si-parik-preloader.png" alt="SI PARIK BANGKA" />
            </a>
            <p>
              Aplikasi Pendataan Pelaku Ekonomi Kreatif dan SDM Pariwisata Kabupaten Bangka.
            </p>
          </div>

          <div className="footer-column">
            <strong>Navigasi</strong>
            <a href="#beranda">Beranda</a>
            <a href="#subsektor">Subsektor</a>
            <a href="#pelaku-ekraf">Pelaku Ekraf</a>
            <a href="#dokumen">Pengajuan</a>
          </div>

          <div className="footer-column">
            <strong>Layanan</strong>
            <a href="#dokumen">Dokumen Pengajuan</a>
            <a href="#pelaku-ekraf">Komunitas & Asosiasi</a>
            <a href="/berita">Berita</a>
            <a href="/acara">Acara</a>
            <a href="#tentang">Tentang Kami</a>
            <a href="/akun/masuk">Akun Pengaju</a>
            <a href="/petugas">Portal Admin & Pengguna</a>
          </div>

          <div className="footer-column footer-contact">
            <strong>Dinas Pariwisata & Kebudayaan</strong>
            <span>Kabupaten Bangka</span>
            <span>Provinsi Kepulauan Bangka Belitung</span>
            <a href="#beranda">exotic.bangka.go.id</a>
          </div>
        </div>

        <div className="page-container footer-bottom">
          <span>© 2026 SI PARIK BANGKA Kabupaten Bangka</span>
          <span>Dirancang untuk layanan publik yang lebih sederhana.</span>
        </div>
      </footer>

    </main>
  );
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
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
    case "arrow":
      return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case "calendar":
      return <svg {...common}><path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z" /></svg>;
    case "pin":
      return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.4" /></svg>;
    case "users":
      return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case "file":
      return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></svg>;
    case "spark":
      return <svg {...common}><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3ZM18.5 14l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3ZM5.5 13l.8 2.7 2.7.8-2.7.8L5.5 20l-.8-2.7-2.7-.8 2.7-.8.8-2.7Z" /></svg>;
    case "briefcase":
      return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></svg>;
    case "camera":
      return <svg {...common}><path d="M4 7h3l1.5-2h7L17 7h3v12H4Z" /><circle cx="12" cy="13" r="3.5" /></svg>;
    case "palette":
      return <svg {...common}><path d="M12 3a9 9 0 1 0 0 18h1.2a1.8 1.8 0 0 0 1.2-3.1l-.4-.4a1.8 1.8 0 0 1 1.2-3.1H18a3 3 0 0 0 3-3C21 6.8 17 3 12 3Z" /><circle cx="7.5" cy="10" r=".8" fill="currentColor" stroke="none" /><circle cx="10" cy="6.8" r=".8" fill="currentColor" stroke="none" /><circle cx="14" cy="6.8" r=".8" fill="currentColor" stroke="none" /></svg>;
    case "music":
      return <svg {...common}><path d="M9 18V5l10-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></svg>;
    case "food":
      return <svg {...common}><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M16 3v18M16 3c3 2 4 5 4 8h-4" /></svg>;
    case "fashion":
      return <svg {...common}><path d="m8 4 4-2 4 2 5 3-3 5-2-1v10H8V11l-2 1-3-5 5-3Z" /><path d="M9 3.5c.5 2 5.5 2 6 0" /></svg>;
    case "game":
      return <svg {...common}><path d="M8 8h8a6 6 0 0 1 5.6 8.1l-1 2.6a2.5 2.5 0 0 1-4.1.9L14 17h-4l-2.5 2.6a2.5 2.5 0 0 1-4.1-.9l-1-2.6A6 6 0 0 1 8 8Z" /><path d="M7 12v4M5 14h4M16.5 12.8h.01M18.5 15.2h.01" /></svg>;
    case "film":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 5v14M17 5v14M3 10h4M17 10h4M3 14h4M17 14h4" /></svg>;
    case "architecture":
      return <svg {...common}><path d="M4 21V10l8-7 8 7v11M8 21v-7h8v7M3 21h18" /></svg>;
    case "interior":
      return <svg {...common}><path d="M4 20V9l8-5 8 5v11" /><path d="M7 20v-6h10v6M9 10h6M12 10v4" /></svg>;
    case "product":
      return <svg {...common}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12.1V21" /></svg>;
    case "publishing":
      return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" /></svg>;
    case "advertising":
      return <svg {...common}><path d="M4 13V9l12-4v12L4 13Z" /><path d="M16 9.5h2.5a2.5 2.5 0 0 1 0 5H16M6 13l1.5 6h3L9 12.5" /></svg>;
    case "performance":
      return <svg {...common}><path d="M5 4h14v5c0 6-3 10-7 12-4-2-7-6-7-12V4Z" /><path d="M8 9c.7-.8 1.5-1.2 2.5-1.2S12.3 8.2 13 9M8.5 14c1 .8 2.2 1.2 3.5 1.2s2.5-.4 3.5-1.2" /></svg>;
    case "art":
      return <svg {...common}><path d="M4 18c3-6 7-11 14-14l2 2c-3 7-8 11-14 14H4v-2Z" /><path d="m14 7 3 3M6 16l2 2" /></svg>;
    case "broadcast":
      return <svg {...common}><rect x="4" y="6" width="16" height="12" rx="2" /><path d="m9 3 3 3 3-3M8 11h5v3H8zM16 11h.01M16 14h.01" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>;
    case "mail":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
    case "phone":
      return <svg {...common}><path d="M7.2 3.5 10 7.2 8.3 9.6a15.2 15.2 0 0 0 6.1 6.1l2.4-1.7 3.7 2.8-.9 3.2c-.3 1-1.3 1.6-2.3 1.4C9.8 20.1 3.9 14.2 2.6 6.7c-.2-1 .4-2 1.4-2.3l3.2-.9Z" /></svg>;
    case "menu":
      return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case "close":
      return <svg {...common}><path d="M6 6l12 12M18 6 6 18" /></svg>;
    case "chevron":
      return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
  }
}
