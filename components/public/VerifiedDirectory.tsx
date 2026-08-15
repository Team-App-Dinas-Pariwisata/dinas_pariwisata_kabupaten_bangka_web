"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

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

type FilterType = "all" | PublicDirectoryItem["type"];

const filters: { id: FilterType; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "ekraf", label: "Pelaku Ekraf" },
  { id: "sdm", label: "SDM Pariwisata" },
  { id: "komunitas", label: "Komunitas" },
];

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
  const trackRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PublicDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "30" });
    if (filter !== "all") params.set("type", filter);
    if (query) params.set("q", query);

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
  }, [filter, query]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(draftQuery.trim());
    window.requestAnimationFrame(() => trackRef.current?.scrollTo({ left: 0, behavior: "smooth" }));
  }

  function changeFilter(next: FilterType) {
    setFilter(next);
    window.requestAnimationFrame(() => trackRef.current?.scrollTo({ left: 0, behavior: "smooth" }));
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
          <p>Daftar ini hanya menampilkan data yang sudah disetujui petugas. Pelaku Ekraf berstatus unggulan otomatis ditempatkan lebih awal.</p>
        </div>

        <form className="directory-search" onSubmit={submitSearch} role="search">
          <label>
            <span className="directory-search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Cari nama usaha, pelaku, subsektor, SDM, atau komunitas..."
              aria-label="Cari direktori terverifikasi"
            />
          </label>
          <button type="submit">Cari</button>
        </form>

        <div className="directory-toolbar">
          <div className="directory-filters" role="tablist" aria-label="Filter direktori">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                className={filter === item.id ? "active" : ""}
                onClick={() => changeFilter(item.id)}
                role="tab"
                aria-selected={filter === item.id}
              >
                {item.label}
              </button>
            ))}
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
          <div className="directory-state">Belum ada profil yang sesuai dengan pencarian dan filter.</div>
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
                  <span className="directory-verified">✓ Disetujui dan terverifikasi</span>
                  <h3>{item.title}</h3>
                  {item.subtitle ? <p className="directory-subtitle">{item.subtitle}</p> : null}
                  <div className="directory-card-meta">
                    {item.category ? <span>{item.category}</span> : null}
                    {item.location ? <span>⌖ {item.location}</span> : null}
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
