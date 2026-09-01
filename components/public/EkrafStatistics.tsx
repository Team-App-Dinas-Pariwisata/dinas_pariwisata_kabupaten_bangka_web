"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type StatistikItem = {
  id: number;
  label: string;
  total: number;
};

type StatistikPayload = {
  total?: number;
  kecamatan?: StatistikItem[];
  subsektor?: StatistikItem[];
  years?: number[];
  selectedYear?: number | null;
  message?: string;
};

type FrameKey = "kecamatan" | "subsektor";

const frames: { key: FrameKey; eyebrow: string; title: string; description: string }[] = [
  {
    key: "kecamatan",
    eyebrow: "Sebaran Wilayah",
    title: "Pelaku Ekraf di Kecamatan",
    description: "Jumlah Pelaku Ekraf terverifikasi berdasarkan lokasi usaha di delapan kecamatan Kabupaten Bangka.",
  },
  {
    key: "subsektor",
    eyebrow: "Sebaran Subsektor",
    title: "Pelaku Ekraf di Subsektor",
    description: "Komposisi Pelaku Ekraf terverifikasi pada 17 subsektor ekonomi kreatif.",
  },
];

function BarList({ data, columns = false }: { data: StatistikItem[]; columns?: boolean }) {
  const max = Math.max(1, ...data.map((item) => item.total));

  return (
    <div className={`ekraf-chart-list ${columns ? "is-columns" : ""}`}>
      {data.map((item) => {
        const width = item.total === 0 ? 0 : Math.max(7, (item.total / max) * 100);
        return (
          <div className="ekraf-chart-row" key={item.id}>
            <div className="ekraf-chart-row-head">
              <span title={item.label}>{item.label}</span>
              <strong>{item.total}</strong>
            </div>
            <div className="ekraf-chart-bar" aria-hidden="true">
              <span style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function EkrafStatistics() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [kecamatan, setKecamatan] = useState<StatistikItem[]>([]);
  const [subsektor, setSubsektor] = useState<StatistikItem[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    const query = selectedYear ? `?tahun=${encodeURIComponent(selectedYear)}` : "";

    fetch(`/api/public/statistik-ekraf${query}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as StatistikPayload;
        if (!response.ok) throw new Error(payload.message || "Statistik gagal dimuat.");
        setTotal(Number(payload.total ?? 0));
        setKecamatan(Array.isArray(payload.kecamatan) ? payload.kecamatan : []);
        setSubsektor(Array.isArray(payload.subsektor) ? payload.subsektor : []);
        setYears(Array.isArray(payload.years) ? payload.years : []);
      })
      .catch((fetchError) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "Statistik gagal dimuat.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [selectedYear]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const width = track.clientWidth || 1;
      setActiveIndex(Math.max(0, Math.min(frames.length - 1, Math.round(track.scrollLeft / width))));
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  const frameData = useMemo<Record<FrameKey, StatistikItem[]>>(
    () => ({ kecamatan, subsektor }),
    [kecamatan, subsektor],
  );

  function goTo(index: number) {
    const next = Math.max(0, Math.min(frames.length - 1, index));
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    setActiveIndex(next);
  }

  function move(direction: -1 | 1) {
    let next = activeIndex + direction;
    if (next < 0) next = frames.length - 1;
    if (next >= frames.length) next = 0;
    goTo(next);
  }

  return (
    <section className="ekraf-statistics-section" aria-labelledby="ekraf-statistics-title">
      <div className="page-container">
        <div className="ekraf-statistics-shell">
          <div className="ekraf-statistics-topbar">
            <div>
              <span className="section-kicker">Statistik Pelaku Ekraf</span>
              <h2 id="ekraf-statistics-title">Potret Ekonomi Kreatif Kabupaten Bangka.</h2>
            </div>

            <div className="ekraf-statistics-actions" aria-label="Filter dan navigasi grafik statistik">

              <span className="ekraf-statistics-total">
                <strong>{loading ? "…" : total}</strong>
                <small>Pelaku disetujui</small>
              </span>
              <button type="button" onClick={() => move(-1)} aria-label="Grafik sebelumnya">←</button>
              <button type="button" onClick={() => move(1)} aria-label="Grafik berikutnya">→</button>
              <label className="ekraf-statistics-year-filter">
                <span>Tahun</span>
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                  aria-label="Filter statistik berdasarkan tahun verifikasi"
                >
                  <option value="">Semua Tahun</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {error ? (
            <div className="ekraf-statistics-state">{error}</div>
          ) : loading ? (
            <div className="ekraf-statistics-frame ekraf-statistics-skeleton" aria-live="polite" />
          ) : (
            <>
              <div className="ekraf-statistics-track" ref={trackRef}>
                {frames.map((frame) => {
                  const data = frameData[frame.key];
                  return (
                    <article className="ekraf-statistics-frame" key={frame.key}>
                      <div className="ekraf-statistics-frame-head">
                        <div>
                          <span>{frame.eyebrow}</span>
                          <h3>{frame.title}</h3>
                          <p>
                            {frame.description}
                            {selectedYear ? ` Data tahun ${selectedYear}.` : ""}
                          </p>
                        </div>
                        <span className="ekraf-statistics-frame-count">{data.length.toString().padStart(2, "0")}</span>
                      </div>

                      {data.length > 0 ? (
                        <BarList data={data} columns={frame.key === "subsektor"} />
                      ) : (
                        <div className="ekraf-statistics-empty">
                          {selectedYear
                            ? `Belum ada data Pelaku Ekraf yang disetujui pada tahun ${selectedYear}.`
                            : "Belum ada data Pelaku Ekraf yang disetujui."}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              <div className="ekraf-statistics-pagination" aria-label="Pilih grafik statistik">
                {frames.map((frame, index) => (
                  <button
                    key={frame.key}
                    type="button"
                    className={activeIndex === index ? "active" : ""}
                    onClick={() => goTo(index)}
                    aria-label={`Tampilkan ${frame.title}`}
                    aria-current={activeIndex === index ? "true" : undefined}
                  >
                    <span />
                    {frame.title.replace("Pelaku Ekraf di ", "")}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
