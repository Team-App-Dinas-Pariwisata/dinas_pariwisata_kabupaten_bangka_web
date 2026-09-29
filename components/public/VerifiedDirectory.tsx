"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { startGuestNavigation } from "@/components/Preloader";

export type PublicDirectoryItem = {
  id: number;
  type: "ekraf" | "sdm" | "komunitas";
  title: string;
  subtitle: string | null;
  category: string | null;
  location: string | null;
  description: string | null;
  image: string | null;
  unggulan: number;
  updated_at: string | null;
};

type SearchCategory = "ekraf" | "sdm" | "komunitas";

const typeLabels: Record<PublicDirectoryItem["type"], string> = {
  ekraf: "Pelaku Ekraf",
  sdm: "SDM Pariwisata",
  komunitas: "Komunitas / Asosiasi",
};

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SP";
}

export default function VerifiedDirectory() {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);

  const [searchTarget, setSearchTarget] = useState<SearchCategory>("ekraf");
  const [searchQuery, setSearchQuery] = useState("");

  const [items, setItems] = useState<PublicDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "10" });

    setLoading(true);
    setError("");

    fetch(`/api/public/direktori?${params.toString()}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as { data?: PublicDirectoryItem[]; message?: string };
        if (!response.ok) throw new Error(payload.message || "Direktori gagal dimuat.");
        setItems(Array.isArray(payload.data) ? payload.data : []);
      })
      .catch((fetchError) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "Direktori gagal dimuat.");
        setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    const targetUrl = query
      ? `/direktori/${searchTarget}?q=${encodeURIComponent(query)}`
      : `/direktori/${searchTarget}`;
    startGuestNavigation();
    router.push(targetUrl);
  }

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.max(300, track.clientWidth * 0.82), behavior: "smooth" });
  }

  return (
    <section className="section verified-directory" id="pelaku-ekraf" aria-labelledby="verified-directory-title">
      <div className="page-container directory-shell">
        <div className="directory-heading">
          <div>
            <span className="section-kicker">Direktori Terverifikasi Kabupaten Bangka</span>
            <h2 id="verified-directory-title">Temukan pelaku, SDM pariwisata, dan komunitas.</h2>
          </div>
          <p>
            Daftar pada slide ini menampilkan 10 pelaku terakhir yang telah disetujui petugas. Pelaku Ekraf berstatus unggulan otomatis ditempatkan lebih awal. Untuk melihat data lengkapnya, silakan pilih kategori pencarian di atas atau klik menu direktori pada navigasi.
          </p>
        </div>

        <form className="directory-search directory-home-search" onSubmit={handleSearch} role="search">
          <div className="directory-search-category">
            <select
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value as SearchCategory)}
              className="directory-category-select"
              aria-label="Pilih kategori pencarian"
            >
              <option value="ekraf">Pelaku Ekraf</option>
              <option value="sdm">SDM Pariwisata</option>
              <option value="komunitas">Komunitas</option>
            </select>
            <span className="directory-category-arrow" aria-hidden="true">▾</span>
          </div>

          <label>
            <span className="directory-search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={
                searchTarget === "ekraf"
                  ? "Cari nama usaha, pelaku, produk, subsektor..."
                  : searchTarget === "sdm"
                    ? "Cari nama SDM, jabatan, tempat tugas..."
                    : "Cari nama komunitas, kategori, rincian..."
              }
              aria-label="Cari direktori terverifikasi"
            />
          </label>
          <button type="submit">Cari</button>
        </form>

        <div className="directory-toolbar directory-toolbar-clean">
          <div className="directory-toolbar-title">
            <strong>10 Pelaku Terakhir Disetujui</strong>
          </div>

          <div className="directory-nav" aria-label="Navigasi daftar">
            <span>{loading ? "Memuat..." : `${items.length} profil`}</span>
            <button type="button" onClick={() => move(-1)} aria-label="Geser daftar ke kiri">←</button>
            <button type="button" onClick={() => move(1)} aria-label="Geser daftar ke kanan">→</button>
          </div>
        </div>

        {error ? (
          <div className="directory-state directory-state-error">{error}</div>
        ) : loading ? (
          <div className="directory-track directory-loading" aria-live="polite">
            {[0, 1, 2].map((item) => <div className="directory-card directory-skeleton" key={item} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="directory-state">Belum ada profil pelaku terverifikasi yang tersedia.</div>
        ) : (
          <div className="directory-track" ref={trackRef}>
            {items.map((item) => (
              <Link
                href={`/direktori/${item.type}/${item.id}`}
                className={`directory-card ${item.unggulan ? "is-featured" : ""}`}
                key={`${item.type}-${item.id}`}
                aria-label={`Lihat detail ${item.title}`}
              >
                <div className="directory-card-media">
                  {item.image ? (
                    <img src={item.image} alt={item.title} loading="lazy" />
                  ) : (
                    <span className="directory-initials" aria-hidden="true">{initials(item.title)}</span>
                  )}
                  <div className="directory-card-badges">
                    <span>{typeLabels[item.type]}</span>
                    {item.unggulan ? <strong>Unggulan</strong> : null}
                  </div>
                </div>

                <div className="directory-card-copy">
                  <span className="directory-verified">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    Disetujui &amp; Terverifikasi
                  </span>
                  <h3>{item.title}</h3>
                  {item.subtitle ? <p className="directory-subtitle">{item.subtitle}</p> : null}
                  <div className="directory-card-meta">
                    {item.category ? <span>{item.category}</span> : null}
                    {item.location ? (
                      <span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "#0284c7" }}><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                        {item.location}
                      </span>
                    ) : null}
                  </div>
                  <p className="directory-description">{item.description || "Profil telah diverifikasi dan tercatat dalam direktori SI PARIK BANGKA."}</p>
                  <span className="directory-card-link-label">Lihat profil <span aria-hidden="true">→</span></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
