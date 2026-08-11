"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";

type FeatureTab = "event" | "berita" | "unggulan";

type HeroPanelItem = {
  title: string;
  meta: string;
  sub: string;
  image: string;
};

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

type AiChatMessage = {
  role: "assistant" | "user";
  text: string;
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
  | "menu"
  | "close"
  | "chevron"
  | "clock"
  | "mail"
  | "phone";

const subsectors = [
  { name: "Kuliner", icon: "food" as IconName, count: "128 pelaku" },
  { name: "Kriya", icon: "palette" as IconName, count: "76 pelaku" },
  { name: "Fesyen", icon: "fashion" as IconName, count: "54 pelaku" },
  { name: "Fotografi", icon: "camera" as IconName, count: "38 pelaku" },
  { name: "Musik", icon: "music" as IconName, count: "32 pelaku" },
  { name: "Film & Animasi", icon: "film" as IconName, count: "21 pelaku" },
  { name: "Aplikasi & Gim", icon: "game" as IconName, count: "19 pelaku" },
  { name: "Arsitektur", icon: "architecture" as IconName, count: "16 pelaku" },
];

const heroPanels: Record<FeatureTab, HeroPanelItem[]> = {
  event: [
    {
      title: "Festival Semarak Ekraf Bangka",
      meta: "12–14 September 2026",
      sub: "Taman Sari, Sungailiat",
      image:
        "/hero-bangka.jpg",
    },
    {
      title: "Bangka Creative Market",
      meta: "05 Oktober 2026",
      sub: "Kawasan Kota Sungailiat",
      image:
        "/kriya-bangka.jpg",
    },
  ],
  berita: [
    {
      title: "Kolaborasi Ekraf & Pariwisata Bahari",
      meta: "Sorotan Minggu Ini",
      sub: "Cerita pelaku kreatif pesisir Bangka",
      image:
        "/hero-bangka.jpg",
    },
    {
      title: "Produk Kriya Lokal Naik Kelas",
      meta: "Berita Ekraf",
      sub: "Dari bahan alam menjadi produk bernilai",
      image:
        "/kriya-bangka.jpg",
    },
  ],
  unggulan: [
    {
      title: "Kriya Lidi Nipah Bangka",
      meta: "Kriya",
      sub: "Produk lokal dengan identitas pesisir",
      image:
        "/kriya-bangka.jpg",
    },
    {
      title: "Kuliner Laut & Olahan Lokal",
      meta: "Kuliner",
      sub: "Cita rasa Bangka dalam kemasan modern",
      image:
        "/kuliner-bangka.png",
    },
  ],
};

const featureTabs: { id: FeatureTab; label: string }[] = [
  { id: "event", label: "Event" },
  { id: "berita", label: "Berita" },
  { id: "unggulan", label: "Pelaku Unggulan" },
];

const submissionOptions = [
  {
    title: "Pelaku Ekraf",
    description: "Pendataan usaha dan pelaku ekonomi kreatif.",
    icon: "briefcase" as IconName,
    href: "/akun/pengajuan/pelaku-ekraf",
  },
  {
    title: "SDM Pariwisata",
    description: "Pendataan SDM dan tenaga pendukung pariwisata.",
    icon: "spark" as IconName,
    href: "/akun/pengajuan/sdm-pariwisata",
  },
  {
    title: "Komunitas",
    description: "Pendataan komunitas, asosiasi, dan lembaga.",
    icon: "users" as IconName,
    href: "/akun/pengajuan/komunitas",
  },
];

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
  const [activeTab, setActiveTab] = useState<FeatureTab>("event");
  const [panelOffset, setPanelOffset] = useState(0);
  const [beritaPanels, setBeritaPanels] = useState<HeroPanelItem[]>(heroPanels.berita);
  const [eventPanels, setEventPanels] = useState<HeroPanelItem[]>(heroPanels.event);
  const [beritaItems, setBeritaItems] = useState<PublicBerita[]>([]);
  const [acaraItems, setAcaraItems] = useState<PublicAcara[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  const panelItems = useMemo(() => {
    const items = activeTab === "berita"
      ? beritaPanels
      : activeTab === "event"
        ? eventPanels
        : heroPanels.unggulan;
    if (items.length === 0) return [];
    const visibleCount = Math.min(2, items.length);
    return Array.from({ length: visibleCount }, (_, index) =>
      items[(index + panelOffset) % items.length],
    );
  }, [activeTab, beritaPanels, eventPanels, panelOffset]);

  useEffect(() => {
    let cancelled = false;

    const loadHomepageContent = async () => {
      try {
        const [beritaResponse, acaraResponse] = await Promise.all([
          fetch("/api/public/berita", { cache: "no-store" }),
          fetch("/api/public/acara", { cache: "no-store" }),
        ]);

        const beritaPayload = (await beritaResponse.json()) as { data?: PublicBerita[] };
        const acaraPayload = (await acaraResponse.json()) as { data?: PublicAcara[] };

        if (!cancelled && beritaResponse.ok && Array.isArray(beritaPayload.data)) {
          setBeritaItems(beritaPayload.data);
          if (beritaPayload.data.length > 0) {
            setBeritaPanels(beritaPayload.data.map((item, index): HeroPanelItem => ({
              title: item.judul,
              meta: `${item.nama_kategori || "Berita"} · ${formatNewsDate(item.tanggal_publikasi)}`,
              sub: item.ringkasan || item.subjudul || item.penulis_tampil || "Informasi terbaru SI PARIK BANGKA Kabupaten Bangka",
              image: embeddableImage(item.foto_utama, newsFallbackImages[index % newsFallbackImages.length]),
            })));
          }
        }

        if (!cancelled && acaraResponse.ok && Array.isArray(acaraPayload.data)) {
          setAcaraItems(acaraPayload.data);
          if (acaraPayload.data.length > 0) {
            setEventPanels(acaraPayload.data.map((item, index): HeroPanelItem => ({
              title: item.nama_acara,
              meta: `${item.nama_kategori || "Acara"} · ${formatEventRange(item.tanggal_mulai, item.tanggal_selesai)}`,
              sub: item.nama_lokasi || item.ringkasan || item.penyelenggara || "Agenda SI PARIK BANGKA Kabupaten Bangka",
              image: embeddableImage(item.foto_utama, newsFallbackImages[index % newsFallbackImages.length]),
            })));
          }
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

  const selectTab = (tab: FeatureTab) => {
    setActiveTab(tab);
    setPanelOffset(0);
  };

  const handleTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, currentTab: FeatureTab) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    const currentIndex = featureTabs.findIndex((tab) => tab.id === currentTab);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % featureTabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + featureTabs.length) % featureTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = featureTabs.length - 1;

    const nextTab = featureTabs[nextIndex].id;
    selectTab(nextTab);
    window.requestAnimationFrame(() => document.getElementById(`feature-tab-${nextTab}`)?.focus());
  };

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
              <SubmissionDropdown />
              <a className="button button-glass" href="#pelaku-ekraf">
                Komunitas / Asosiasi / Lembaga
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

        <div className="hero-feature-wrap page-container">
          <section className="hero-feature-card" aria-label="Sorotan SI PARIK BANGKA">
            <div className="feature-tabs" role="tablist" aria-label="Kategori sorotan">
              {featureTabs.map((tab) => (
                <button
                  key={tab.id}
                  id={`feature-tab-${tab.id}`}
                  type="button"
                  className={activeTab === tab.id ? "active" : ""}
                  onClick={() => selectTab(tab.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`feature-panel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              key={activeTab}
              id={`feature-panel-${activeTab}`}
              className="feature-list"
              role="tabpanel"
              aria-labelledby={`feature-tab-${activeTab}`}
            >
              {panelItems.map((item) => (
                <article className="mini-feature" key={`${activeTab}-${item.title}`}>
                  <div
                    className="mini-feature-image"
                    style={{ backgroundImage: `url(${item.image})` }}
                    aria-hidden="true"
                  />
                  <div className="mini-feature-copy">
                    <strong>{item.title}</strong>
                    <span className="mini-feature-meta"><Icon name="calendar" size={14} /> {item.meta}</span>
                    <p className="mini-feature-summary">{item.sub}</p>
                  </div>
                </article>
              ))}
              <button
                type="button"
                className="feature-next"
                aria-label="Tampilkan sorotan berikutnya"
                onClick={() => setPanelOffset((value) => value + 1)}
              >
                <Icon name="arrow" size={24} />
              </button>
            </div>
          </section>
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
            {subsectors.map((item, index) => (
              <a href="#pelaku-ekraf" className="subsector-card" key={item.name}>
                <span className="subsector-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="subsector-icon"><Icon name={item.icon} size={42} /></span>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.count}</span>
                </div>
                <span className="subsector-arrow"><Icon name="arrow" size={17} /></span>
              </a>
            ))}
          </div>

          <div className="section-bottom-link">
            <a href="#pelaku-ekraf" className="text-link dark-link">
              Lihat seluruh 17 subsektor <Icon name="arrow" size={16} />
            </a>
          </div>
        </div>
      </section>

      <section className="section ecosystem" id="pelaku-ekraf">
        <div className="page-container ecosystem-grid">
          <div className="ecosystem-visual">
            <div className="ecosystem-photo ecosystem-photo-main" aria-hidden="true" />
            <div className="ecosystem-photo ecosystem-photo-small" aria-hidden="true" />
            <div className="ecosystem-badge">
              <span><Icon name="users" size={20} /></span>
              <div>
                <strong>Ekosistem lokal</strong>
                <small>pelaku · komunitas · mitra</small>
              </div>
            </div>
          </div>

          <div className="ecosystem-copy">
            <span className="section-kicker">Pelaku Ekraf Kabupaten Bangka</span>
            <h2>Data yang terkoneksi, kolaborasi yang lebih mudah.</h2>
            <p>
              SI PARIK BANGKA dirancang sebagai pintu masuk untuk mengenal pelaku kreatif,
              komunitas, asosiasi, dan SDM pariwisata. Profil yang terverifikasi dapat
              membantu publik menemukan produk, layanan, dan jejaring kreatif lokal.
            </p>

            <div className="ecosystem-points">
              <div>
                <span><Icon name="briefcase" size={19} /></span>
                <div><strong>Profil pelaku lebih terstruktur</strong><small>Informasi inti mudah ditemukan dan diperbarui.</small></div>
              </div>
              <div>
                <span><Icon name="spark" size={19} /></span>
                <div><strong>Promosi potensi lokal</strong><small>Menampilkan karya dan aktivitas kreatif secara lebih menarik.</small></div>
              </div>
              <div>
                <span><Icon name="users" size={19} /></span>
                <div><strong>Jaringan kolaborasi</strong><small>Menghubungkan pelaku dengan komunitas dan mitra terkait.</small></div>
              </div>
            </div>

            <a href="#dokumen" className="button button-dark">
              Lihat Pelaku Ekraf <Icon name="arrow" size={18} />
            </a>
          </div>
        </div>
      </section>

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
            <a href="#beranda" className="button button-light">
              Ajukan Data Sekarang <Icon name="arrow" size={18} />
            </a>
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

      <section className="section about" id="tentang">
        <div className="page-container about-grid">
          <div>
            <span className="section-kicker">Tentang Platform</span>
            <h2>Digitalisasi data kreatif untuk Bangka yang lebih terhubung.</h2>
          </div>
          <p>
            SI PARIK BANGKA Kabupaten Bangka dihadirkan untuk mendukung pendataan, promosi,
            pembinaan, dan akses informasi ekonomi kreatif serta SDM pariwisata dalam
            satu layanan digital yang modern dan ramah pengguna.
          </p>
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
            <a href="/login">Portal Admin & Pengguna</a>
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

      <FloatingAiChat />
    </main>
  );
}

function SubmissionDropdown({ compact = false }: { compact?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`submission-dropdown ${compact ? "submission-dropdown-topbar" : ""} ${isOpen ? "is-open" : ""}`}
    >
      <button
        type="button"
        className={compact ? "topbar-cta submission-trigger" : "button button-primary submission-trigger"}
        onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {compact ? "Pengajuan" : "Mulai Pengajuan"}
        <span className="submission-chevron"><Icon name="chevron" size={16} /></span>
      </button>

      {isOpen && (
        <div className="submission-menu" role="menu" aria-label="Pilih jenis pengajuan">
          <div className="submission-menu-head">
            <span>Pilih pengajuan</span>
            <small>Silakan pilih kategori data yang akan diajukan.</small>
          </div>
          {submissionOptions.map((option) => (
            <a
              key={option.title}
              href={option.href}
              className="submission-option"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <span className="submission-option-icon"><Icon name={option.icon} size={18} /></span>
              <span className="submission-option-copy">
                <strong>{option.title}</strong>
                <small>{option.description}</small>
              </span>
              <Icon name="arrow" size={16} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function FloatingAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      text: "Halo! Tulis kebutuhan wisata Anda. Contoh pertanyaan di bawah sudah disesuaikan dengan data yang tersedia pada database sehingga dapat langsung menghasilkan alternatif untuk dirangking dengan SAW.",
    },
  ]);

  const examples = [
    "Cari wisata bahari di Bangka dengan tiket maksimal Rp15.000, utamakan akses mudah",
    "Cari kuliner seafood halal maksimal Rp100.000 yang tersedia delivery",
    "Cari hotel minimal bintang 3 dengan budget maksimal Rp700.000",
    "Cari satwa endemik Mentilin dengan lokasi pengamatan",
  ];

  function getLocationIfNeeded(message: string) {
    const needsLocation = /\b(dekat|terdekat|jarak|radius|\d+(?:[.,]\d+)?\s*(?:km|kilometer|meter|m))\b/i.test(message);
    if (!needsLocation || !navigator.geolocation) {
      return Promise.resolve<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });
    }

    return new Promise<{ latitude: number | null; longitude: number | null }>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        () => resolve({ latitude: null, longitude: null }),
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 120000 },
      );
    });
  }

  async function sendQuestion(value?: string) {
    const message = (value ?? question).trim();
    if (!message || isSending) return;

    setQuestion("");
    setIsSending(true);
    setMessages((current) => [...current, { role: "user", text: message }]);

    try {
      const location = await getLocationIfNeeded(message);
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });
      const payload = await response.json() as {
        type?: string;
        response?: string;
        redirect_url?: string;
        message?: string;
      };
      if (!response.ok) throw new Error(payload.message || "Chatbot belum dapat memproses pertanyaan.");

      const reply = payload.response || "Permintaan sudah diproses.";
      setMessages((current) => [...current, { role: "assistant", text: reply }]);

      if (payload.type === "search_redirect" && payload.redirect_url) {
        window.setTimeout(() => window.location.assign(payload.redirect_url as string), 850);
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: error instanceof Error ? error.message : "Layanan NLP belum dapat dihubungi.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleChatKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void sendQuestion();
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="ai-launcher"
          aria-label="Buka Tanya AI Bangka"
        >
          <span className="ai-launcher-label" aria-hidden="true">
            Rekomendasi Wisata
          </span>
          <img src="/animasi.gif" alt="Tanya AI Bangka" />
        </button>
      )}

      {isOpen && (
        <div className="ai-panel" role="dialog" aria-label="Tanya AI Bangka">
          <div className="ai-panel-head">
            <div>
              <span className="ai-status"><i /> Online</span>
              <strong>Tanya AI Bangka</strong>
              <small>Asisten informasi ekraf & pariwisata</small>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Tutup Tanya AI">
              <Icon name="close" size={18} />
            </button>
          </div>
          <div className="ai-panel-body">
            <div className="ai-conversation" aria-live="polite">
              {messages.map((message, index) => (
                <div className={`ai-bubble ${message.role === "user" ? "is-user" : ""}`} key={`${message.role}-${index}`}>
                  {message.text}
                </div>
              ))}
              {isSending && <div className="ai-bubble is-loading">Menganalisis kebutuhan dan kriteria SPK...</div>}
            </div>
            <div className="ai-example-label">Contoh pertanyaan</div>
            <div className="ai-chips">
              {examples.map((example) => (
                <button type="button" key={example} onClick={() => void sendQuestion(example)} disabled={isSending}>
                  {example}
                </button>
              ))}
            </div>
            <div className="ai-input-wrap">
              <input
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Contoh: kuliner seafood halal maksimal Rp100.000..."
                aria-label="Pertanyaan untuk AI"
                disabled={isSending}
              />
              <button type="button" aria-label="Kirim pertanyaan" onClick={() => void sendQuestion()} disabled={isSending || !question.trim()}>
                <Icon name="arrow" size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
