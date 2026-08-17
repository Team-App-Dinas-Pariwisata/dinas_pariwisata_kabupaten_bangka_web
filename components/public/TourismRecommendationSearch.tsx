"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

type TourismKind = "tempat-wisata" | "kuliner" | "hotel" | "satwa-endemik";
type Criterion = {
  code: string;
  label: string;
  description: string | null;
  type: "benefit" | "cost";
  source: string;
  unit: string | null;
  defaultWeight: number;
  required: boolean;
};
type CriterionResult = {
  code: string;
  label: string;
  type: "benefit" | "cost";
  valueLabel: string;
  normalizedValue: number;
  weight: number;
  contribution: number;
};
type ResultItem = {
  id: number;
  slug: string;
  title: string;
  category: string | null;
  summary: string | null;
  image: string | null;
  address: string | null;
  href: string;
  priceFrom: number | null;
  priceTo: number | null;
  distanceKm: number | null;
  score: number;
  rank: number;
  criteria: CriterionResult[];
  reasons: string[];
};
type SearchResponse = {
  data?: {
    items: ResultItem[];
    totalCandidates: number;
    totalMatched: number;
    criteria: Criterion[];
    usedLocation: boolean;
  };
  method?: {
    name: string;
    benefitNormalization: string;
    costNormalization: string;
    preferenceWeighting: string;
  };
  message?: string;
};

type Requirements = {
  parking: boolean;
  prayerRoom: boolean;
  childFriendly: boolean;
  familyFriendly: boolean;
  seniorFriendly: boolean;
  halalMode: "semua" | "halal" | "bersertifikat";
  deliveryOnly: boolean;
  minStars: number;
  observationOnly: boolean;
  educationalLocationOnly: boolean;
};

const categoryOptions: { value: TourismKind; label: string; description: string }[] = [
  { value: "tempat-wisata", label: "Tempat Wisata", description: "Destinasi alam, budaya, pantai, dan rekreasi." },
  { value: "kuliner", label: "Kuliner", description: "Warung, restoran, kafe, dan kuliner khas Bangka." },
  { value: "hotel", label: "Hotel", description: "Hotel, resort, guest house, dan akomodasi." },
  { value: "satwa-endemik", label: "Satwa Endemik", description: "Informasi satwa dan lokasi pengamatan publik." },
];

const initialRequirements: Requirements = {
  parking: false,
  prayerRoom: false,
  childFriendly: false,
  familyFriendly: false,
  seniorFriendly: false,
  halalMode: "semua",
  deliveryOnly: false,
  minStars: 0,
  observationOnly: false,
  educationalLocationOnly: false,
};

function rupiah(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function priorityLabel(value: number) {
  if (value <= 1) return "Sangat rendah";
  if (value === 2) return "Rendah";
  if (value === 3) return "Normal";
  if (value === 4) return "Tinggi";
  return "Sangat tinggi";
}

export default function TourismRecommendationSearch() {
  const [category, setCategory] = useState<TourismKind>("tempat-wisata");
  const [keyword, setKeyword] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [maxDistanceKm, setMaxDistanceKm] = useState("50");
  const [maxBudget, setMaxBudget] = useState("");
  const [requirements, setRequirements] = useState<Requirements>(initialRequirements);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [priorities, setPriorities] = useState<Record<string, number>>({});
  const [criteriaLoading, setCriteriaLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [resultMeta, setResultMeta] = useState<{ totalCandidates: number; totalMatched: number; usedLocation: boolean } | null>(null);
  const [method, setMethod] = useState<SearchResponse["method"]>(undefined);
  const [hasSearched, setHasSearched] = useState(false);
  const [aiNotice, setAiNotice] = useState("");
  const [pendingAutoSearch, setPendingAutoSearch] = useState(false);
  const aiPriorityOverrides = useRef<Record<string, number>>({});
  const autoSearchStarted = useRef(false);

  const categoryInfo = useMemo(() => categoryOptions.find((item) => item.value === category)!, [category]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("source") !== "ai") return;

    const incomingCategory = params.get("category") as TourismKind | null;
    if (incomingCategory && categoryOptions.some((option) => option.value === incomingCategory)) {
      setCategory(incomingCategory);
    }
    setKeyword(params.get("keyword") ?? "");
    setLatitude(params.get("latitude") ?? "");
    setLongitude(params.get("longitude") ?? "");
    if (params.has("maxDistanceKm")) setMaxDistanceKm(params.get("maxDistanceKm") ?? "");
    if (params.has("maxBudget")) setMaxBudget(params.get("maxBudget") ?? "");

    setRequirements({
      parking: params.get("parking") === "1",
      prayerRoom: params.get("prayerRoom") === "1",
      childFriendly: params.get("childFriendly") === "1",
      familyFriendly: params.get("familyFriendly") === "1",
      seniorFriendly: params.get("seniorFriendly") === "1",
      halalMode: ["halal", "bersertifikat"].includes(params.get("halalMode") ?? "")
        ? params.get("halalMode") as Requirements["halalMode"]
        : "semua",
      deliveryOnly: params.get("deliveryOnly") === "1",
      minStars: Math.min(5, Math.max(0, Number(params.get("minStars") ?? 0) || 0)),
      observationOnly: params.get("observationOnly") === "1",
      educationalLocationOnly: params.get("educationalLocationOnly") === "1",
    });

    const priorityOverrides: Record<string, number> = {};
    for (const token of (params.get("priorities") ?? "").split(",")) {
      const [rawCode, rawValue] = token.split(":");
      const code = rawCode?.trim();
      const value = Number(rawValue);
      if (code && Number.isFinite(value)) priorityOverrides[code] = Math.min(5, Math.max(1, value));
    }
    aiPriorityOverrides.current = priorityOverrides;

    const sourceMessage = params.get("aiMessage")?.trim();
    setAiNotice(sourceMessage
      ? `Kriteria dari Tanya AI Bangka: “${sourceMessage}”`
      : "Kriteria dari Tanya AI Bangka sudah dimuat ke form pencarian.");
    setPendingAutoSearch(params.get("auto") === "1");
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCriteriaLoading(true);
    setError("");
    fetch(`/api/public/rekomendasi?category=${encodeURIComponent(category)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { data?: { criteria?: Criterion[] }; message?: string };
        if (!response.ok) throw new Error(payload.message || "Kriteria rekomendasi gagal dimuat.");
        return payload.data?.criteria ?? [];
      })
      .then((loaded) => {
        if (cancelled) return;
        setCriteria(loaded);
        setPriorities(Object.fromEntries(
          loaded.map((criterion) => [criterion.code, aiPriorityOverrides.current[criterion.code] ?? 3]),
        ));
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Kriteria rekomendasi gagal dimuat.");
      })
      .finally(() => {
        if (!cancelled) setCriteriaLoading(false);
      });

    return () => { cancelled = true; };
  }, [category]);

  function updateRequirement<K extends keyof Requirements>(key: K, value: Requirements[K]) {
    setRequirements((current) => ({ ...current, [key]: value }));
  }

  function handleCategoryChange(value: TourismKind) {
    setCategory(value);
    setRequirements(initialRequirements);
    setResults([]);
    setResultMeta(null);
    setHasSearched(false);
    setMaxBudget("");
  }

  function detectLocation() {
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationMessage("Browser ini tidak mendukung geolocation. Latitude dan longitude dapat diisi manual.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(7));
        setLongitude(position.coords.longitude.toFixed(7));
        setLocationMessage(`Lokasi berhasil digunakan dengan akurasi ±${Math.round(position.coords.accuracy)} meter.`);
        setLocationLoading(false);
      },
      () => {
        setLocationMessage("Lokasi tidak dapat diakses. Izinkan akses lokasi atau isi koordinat secara manual.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 },
    );
  }

  async function runSearch() {
    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const requestRecommendation = async (requestBody: Record<string, unknown>) => {
        const response = await fetch("/api/public/rekomendasi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        const payload = await response.json() as SearchResponse;
        if (!response.ok || !payload.data) throw new Error(payload.message || "Rekomendasi gagal dihitung.");
        return payload;
      };

      const baseRequest = {
        category,
        keyword,
        latitude: latitude === "" ? null : Number(latitude),
        longitude: longitude === "" ? null : Number(longitude),
        maxDistanceKm: maxDistanceKm === "" ? null : Number(maxDistanceKm),
        maxBudget: maxBudget === "" ? null : Number(maxBudget),
        priorities,
        requirements,
        limit: 12,
      };

      let payload = await requestRecommendation(baseRequest);
      const aiDriven = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("source") === "ai";

      // Pesan dari asisten dapat menghasilkan kombinasi kebutuhan yang terlalu sempit.
      // Jika data kandidat sebenarnya tersedia tetapi tidak ada yang lolos hard filter,
      // pencarian AI otomatis melakukan satu kali fallback: pertahankan kategori dan
      // pertahankan prioritas, tetapi lepaskan kata kunci, budget, jarak, dan kebutuhan wajib.
      // Dengan demikian chatbot tetap dapat memberi rekomendasi dari data publik yang tersedia.
      if (aiDriven && payload.data.totalCandidates > 0 && payload.data.totalMatched === 0) {
        payload = await requestRecommendation({
          category,
          keyword: "",
          latitude: latitude === "" ? null : Number(latitude),
          longitude: longitude === "" ? null : Number(longitude),
          maxDistanceKm: null,
          maxBudget: null,
          priorities,
          requirements: initialRequirements,
          limit: 12,
        });
        setAiNotice((current) => `${current} Kebutuhan yang terlalu spesifik belum menemukan pilihan. Sistem otomatis menyesuaikan pencarian sambil tetap mempertahankan prioritas Anda agar hasil yang tersedia tetap dapat ditampilkan.`.trim());
      }

      setResults(payload.data.items);
      setResultMeta({
        totalCandidates: payload.data.totalCandidates,
        totalMatched: payload.data.totalMatched,
        usedLocation: payload.data.usedLocation,
      });
      setMethod(payload.method);
    } catch (searchError: unknown) {
      setResults([]);
      setResultMeta(null);
      setError(searchError instanceof Error ? searchError.message : "Rekomendasi gagal dihitung.");
    } finally {
      setLoading(false);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch();
  }

  useEffect(() => {
    if (!pendingAutoSearch || autoSearchStarted.current || criteriaLoading || criteria.length === 0) return;
    autoSearchStarted.current = true;
    setPendingAutoSearch(false);
    void runSearch();
    // runSearch intentionally reads the form state populated from the AI URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAutoSearch, criteriaLoading, criteria.length, category, keyword, latitude, longitude, maxDistanceKm, maxBudget, requirements, priorities]);

  return (
    <div className="spk-search-layout">
      <form className="spk-search-form" onSubmit={submitSearch}>
        {aiNotice && (
          <div className="spk-ai-notice">
            <strong>Kriteria otomatis dari chatbot</strong>
            <p>{aiNotice}</p>
            <span>Form sudah diisi otomatis berdasarkan percakapan Anda. Anda tetap dapat mengubah kriterianya lalu mencari ulang.</span>
          </div>
        )}
        <div className="spk-form-heading">
          <span>Form Pencarian</span>
          <h2>Cari rekomendasi yang paling sesuai</h2>
          <p>Pilih kebutuhan Anda, lalu atur tingkat kepentingan setiap kriteria. Sistem akan membandingkan pilihan yang tersedia dan menampilkan rekomendasi yang paling sesuai.</p>
        </div>

        <div className="spk-form-section">
          <div className="spk-section-title"><span>01</span><div><strong>Kategori dan kata kunci</strong><small>Tentukan jenis objek yang ingin dicari.</small></div></div>
          <div className="spk-field-grid two">
            <label className="spk-field">
              <span>Kategori wisata</span>
              <select value={category} onChange={(event) => handleCategoryChange(event.target.value as TourismKind)}>
                {categoryOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
              </select>
              <small>{categoryInfo.description}</small>
            </label>
            <label className="spk-field">
              <span>Nama / kata kunci <em>opsional</em></span>
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={`Contoh: ${category === "hotel" ? "resort pantai" : category === "kuliner" ? "otak-otak" : category === "satwa-endemik" ? "mentilin" : "pantai keluarga"}`} maxLength={120} />
              <small>Mencari pada nama, kategori, ringkasan, dan lokasi.</small>
            </label>
          </div>
        </div>

        <div className="spk-form-section">
          <div className="spk-section-title"><span>02</span><div><strong>Lokasi dan batas pencarian</strong><small>Jarak dihitung berdasarkan data lokasi yang tersedia.</small></div></div>
          <button className="spk-location-button" type="button" onClick={detectLocation} disabled={locationLoading}>
            <span aria-hidden="true">⌖</span>{locationLoading ? "Mendeteksi lokasi..." : "Gunakan lokasi saya"}
          </button>
          {locationMessage && <p className="spk-inline-message">{locationMessage}</p>}
          <div className="spk-field-grid three">
            <label className="spk-field">
              <span>Latitude <em>opsional</em></span>
              <input type="number" step="0.0000001" min="-90" max="90" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="-1.8580000" />
            </label>
            <label className="spk-field">
              <span>Longitude <em>opsional</em></span>
              <input type="number" step="0.0000001" min="-180" max="180" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="106.1100000" />
            </label>
            <label className="spk-field">
              <span>Jarak maksimum <em>km</em></span>
              <input type="number" min="1" max="500" value={maxDistanceKm} onChange={(event) => setMaxDistanceKm(event.target.value)} placeholder="50" />
            </label>
          </div>
        </div>

        <div className="spk-form-section">
          <div className="spk-section-title"><span>03</span><div><strong>Kebutuhan khusus</strong><small>Digunakan untuk menyaring hasil agar lebih sesuai dengan kebutuhan Anda.</small></div></div>
          {category !== "satwa-endemik" && (
            <div className="spk-field-grid two">
              <label className="spk-field">
                <span>Budget maksimum <em>opsional</em></span>
                <input type="number" min="0" max="100000000" step="1000" value={maxBudget} onChange={(event) => setMaxBudget(event.target.value)} placeholder={category === "hotel" ? "750000" : "100000"} />
                <small>Alternatif tanpa data harga tidak dipakai jika budget diaktifkan.</small>
              </label>
              {category === "hotel" && (
                <label className="spk-field">
                  <span>Minimal klasifikasi hotel</span>
                  <select value={requirements.minStars} onChange={(event) => updateRequirement("minStars", Number(event.target.value))}>
                    <option value={0}>Semua klasifikasi</option>
                    {[1, 2, 3, 4, 5].map((star) => <option value={star} key={star}>Minimal {star} bintang</option>)}
                  </select>
                </label>
              )}
              {category === "kuliner" && (
                <label className="spk-field">
                  <span>Preferensi halal</span>
                  <select value={requirements.halalMode} onChange={(event) => updateRequirement("halalMode", event.target.value as Requirements["halalMode"])}>
                    <option value="semua">Semua status halal</option>
                    <option value="halal">Halal / klaim / proses sertifikasi</option>
                    <option value="bersertifikat">Hanya halal bersertifikat</option>
                  </select>
                </label>
              )}
            </div>
          )}

          <div className="spk-check-grid">
            {category !== "satwa-endemik" && <Check label="Harus memiliki parkir" checked={requirements.parking} onChange={(value) => updateRequirement("parking", value)} />}
            {category !== "satwa-endemik" && <Check label="Harus memiliki musala" checked={requirements.prayerRoom} onChange={(value) => updateRequirement("prayerRoom", value)} />}
            {category === "tempat-wisata" && <Check label="Cocok untuk anak" checked={requirements.childFriendly} onChange={(value) => updateRequirement("childFriendly", value)} />}
            {category === "tempat-wisata" && <Check label="Cocok untuk keluarga" checked={requirements.familyFriendly} onChange={(value) => updateRequirement("familyFriendly", value)} />}
            {category === "tempat-wisata" && <Check label="Ramah lansia" checked={requirements.seniorFriendly} onChange={(value) => updateRequirement("seniorFriendly", value)} />}
            {category === "kuliner" && <Check label="Harus tersedia delivery" checked={requirements.deliveryOnly} onChange={(value) => updateRequirement("deliveryOnly", value)} />}
            {category === "satwa-endemik" && <Check label="Ada lokasi yang mengizinkan pengamatan" checked={requirements.observationOnly} onChange={(value) => updateRequirement("observationOnly", value)} />}
            {category === "satwa-endemik" && <Check label="Ada lokasi edukasi / konservasi" checked={requirements.educationalLocationOnly} onChange={(value) => updateRequirement("educationalLocationOnly", value)} />}
          </div>
        </div>

        <div className="spk-form-section">
          <div className="spk-section-title"><span>04</span><div><strong>Prioritas pilihan</strong><small>Atur tingkat kepentingan setiap kriteria. Nilai 3 mempertahankan tingkat kepentingan awal.</small></div></div>
          {criteriaLoading ? (
            <div className="spk-criteria-loading">Memuat konfigurasi kriteria...</div>
          ) : (
            <div className="spk-priority-list">
              {criteria.map((criterion) => {
                const value = priorities[criterion.code] ?? 3;
                return (
                  <label className="spk-priority-card" key={criterion.code}>
                    <div className="spk-priority-head">
                      <div><strong>{criterion.label}</strong><small>{criterion.type === "cost" ? "Cost — nilai lebih kecil lebih baik" : "Benefit — nilai lebih besar lebih baik"}</small></div>
                      <span>{priorityLabel(value)}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={value}
                      onChange={(event) => setPriorities((current) => ({ ...current, [criterion.code]: Number(event.target.value) }))}
                    />
                    <div className="spk-priority-foot"><small>{criterion.description || "Kriteria aktif untuk rekomendasi."}</small><b>Prioritas awal {(criterion.defaultWeight * 100).toFixed(0)}%</b></div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {error && <div className="spk-error-box">{error}</div>}
        <button className="spk-submit-button" type="submit" disabled={loading || criteriaLoading || criteria.length === 0}>
          {loading ? "Menyusun rekomendasi..." : "Cari Rekomendasi Terbaik"}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <section className="spk-result-panel" aria-live="polite">
        <div className="spk-result-heading">
          <div><span>Hasil Rekomendasi</span><h2>Ranking berdasarkan preferensi Anda</h2></div>
          {resultMeta && <p>{resultMeta.totalMatched} dari {resultMeta.totalCandidates} alternatif lolos filter</p>}
        </div>

        {!hasSearched && (
          <div className="spk-result-placeholder">
            <div className="spk-placeholder-icon">★</div>
            <h3>Hasil rekomendasi akan muncul di sini</h3>
            <p>Lengkapi form di atas. Sistem akan membandingkan setiap pilihan berdasarkan kebutuhan dan prioritas yang Anda tentukan.</p>
          </div>
        )}

        {loading && <div className="spk-result-placeholder compact"><div className="spk-loading-dot"/><h3>Sedang menyiapkan rekomendasi...</h3></div>}

        {hasSearched && !loading && !error && results.length === 0 && (
          <div className="spk-result-placeholder compact">
            <h3>Belum ada alternatif yang memenuhi filter</h3>
            <p>Coba naikkan batas budget atau jarak, atau kurangi kebutuhan wajib agar lebih banyak pilihan dapat ditampilkan.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="spk-results-list">
            {results.map((item) => (
              <article className={`spk-result-card${item.rank === 1 ? " is-best" : ""}`} key={item.id}>
                <div className="spk-result-rank"><span>#{item.rank}</span>{item.rank === 1 && <small>Terbaik</small>}</div>
                <Link href={item.href} className="spk-result-image" style={{ backgroundImage: `url(${item.image || "/hero-home-v15.jpg"})` }} aria-label={item.title} />
                <div className="spk-result-content">
                  <div className="spk-result-topline"><span>{item.category || categoryInfo.label}</span><strong>{Math.round(item.score * 100)}<small>/100</small></strong></div>
                  <h3><Link href={item.href}>{item.title}</Link></h3>
                  {item.address && <p className="spk-result-address">⌖ {item.address}</p>}
                  <div className="spk-result-metrics">
                    {item.distanceKm !== null && <span><b>{item.distanceKm.toFixed(item.distanceKm < 10 ? 1 : 0)} km</b> dari lokasi Anda</span>}
                    {item.priceFrom !== null && <span><b>{rupiah(item.priceFrom)}</b> harga mulai</span>}
                  </div>
                  <div className="spk-reason-tags">{item.reasons.map((reason) => <span key={reason}>{reason}</span>)}</div>
                  <div className="spk-result-actions">
                    <Link href={item.href}>Lihat detail <span>→</span></Link>
                    <details>
                      <summary>Lihat alasan penilaian</summary>
                      <div className="spk-calculation-popover">
                        {item.criteria.map((criterion) => (
                          <div key={criterion.code}>
                            <span>{criterion.label}<small>{criterion.valueLabel}</small></span>
                            <b>Kesesuaian {(criterion.normalizedValue * 100).toFixed(0)}%</b>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {method && results.length > 0 && (
          <div className="spk-method-note">
            <strong>Dasar rekomendasi</strong>
            <p>Hasil disusun berdasarkan kebutuhan, batas pencarian, dan prioritas yang Anda tentukan.</p>
            {!resultMeta?.usedLocation && <p><b>Catatan:</b> jarak belum digunakan karena lokasi Anda belum diisi.</p>}
          </div>
        )}
      </section>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="spk-check-option">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="spk-check-mark" aria-hidden="true">✓</span>
      <strong>{label}</strong>
    </label>
  );
}
