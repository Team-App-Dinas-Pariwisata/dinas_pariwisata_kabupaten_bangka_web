import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import PublicSiteFooter from "@/components/public/PublicSiteFooter";
import PublicPagination from "@/components/public/PublicPagination";
import { getApprovedEkrafBySubsector, getPublicSubsector } from "@/lib/public-subsectors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

function parsePositiveInt(value: string | undefined, fallback = 1) {
  const parsed = Number(value ?? fallback);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "EK";
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { id: idValue } = await params;
  const id = parsePositiveInt(idValue, 0);
  if (!id) return { title: "Subsektor tidak ditemukan | SI PARIK BANGKA" };
  const subsector = await getPublicSubsector(id);
  if (!subsector) return { title: "Subsektor tidak ditemukan | SI PARIK BANGKA" };
  return {
    title: `${subsector.nama_subsektor} | Pelaku Ekraf SI PARIK BANGKA`,
    description: `Daftar pelaku ekonomi kreatif subsektor ${subsector.nama_subsektor} yang telah disetujui dan terverifikasi di SI PARIK BANGKA.`,
  };
}

export default async function SubsectorPage({ params, searchParams }: Props) {
  const [{ id: idValue }, query] = await Promise.all([params, searchParams]);
  const id = parsePositiveInt(idValue, 0);
  if (!id) notFound();

  const subsector = await getPublicSubsector(id);
  if (!subsector) notFound();

  const requestedPage = parsePositiveInt(query.page, 1);
  const result = await getApprovedEkrafBySubsector(id, requestedPage, 9);
  const basePath = `/subsektor/${subsector.id}`;

  return (
    <main className="public-page subsector-directory-page">
      <PublicSiteHeader />

      <section className="subsector-list-hero">
        <div className="public-container subsector-list-hero-inner">
          <Link href="/#subsektor" className="subsector-back-link">← Kembali ke semua subsektor</Link>
          <span className="subsector-list-kicker">Subsektor Ekonomi Kreatif</span>
          <h1>{subsector.nama_subsektor}</h1>
          <p>{subsector.deskripsi || `Temukan pelaku ekonomi kreatif subsektor ${subsector.nama_subsektor} yang telah disetujui dan terverifikasi di Kabupaten Bangka.`}</p>
          <div className="subsector-list-stat">
            <strong>{result.total}</strong>
            <span>pelaku terverifikasi</span>
          </div>
        </div>
      </section>

      <section className="subsector-directory-section">
        <div className="public-container">
          <div className="subsector-directory-heading">
            <div>
              <span>Direktori Pelaku Ekraf</span>
              <h2>Pelaku {subsector.nama_subsektor}</h2>
            </div>
            <p>Halaman {result.page} dari {result.totalPages}. Klik kartu untuk membuka profil lengkap pelaku ekraf.</p>
          </div>

          {result.items.length === 0 ? (
            <div className="subsector-directory-empty">
              <strong>Belum ada pelaku yang ditampilkan.</strong>
              <span>Data akan muncul setelah pengajuan subsektor ini disetujui petugas.</span>
            </div>
          ) : (
            <div className="subsector-directory-grid">
              {result.items.map((item) => (
                <Link
                  href={`/direktori/ekraf/${item.id}`}
                  className={`directory-card subsector-directory-card ${item.unggulan ? "is-featured" : ""}`}
                  key={item.id}
                  aria-label={`Lihat detail ${item.title}`}
                >
                  <div className="directory-card-media">
                    {item.image ? (
                      <img src={item.image} alt={item.title} loading="lazy" />
                    ) : (
                      <span className="directory-initials" aria-hidden="true">{initials(item.title)}</span>
                    )}
                    <div className="directory-card-badges">
                      <span>{subsector.nama_subsektor}</span>
                      {item.unggulan ? <strong>Unggulan</strong> : null}
                    </div>
                  </div>
                  <div className="directory-card-copy">
                    <span className="directory-verified">✓ Disetujui dan terverifikasi</span>
                    <h3>{item.title}</h3>
                    {item.subtitle ? <p className="directory-subtitle">{item.subtitle}</p> : null}
                    <div className="directory-card-meta">
                      {item.location ? <span>⌖ {item.location}</span> : null}
                    </div>
                    <p className="directory-description">{item.description || "Profil pelaku ekonomi kreatif yang telah diverifikasi di SI PARIK BANGKA."}</p>
                    <span className="directory-card-link-label">Lihat profil <span aria-hidden="true">→</span></span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <PublicPagination page={result.page} totalPages={result.totalPages} basePath={basePath} />
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
