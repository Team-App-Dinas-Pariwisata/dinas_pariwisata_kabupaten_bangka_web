import type { Metadata } from "next";
import Link from "next/link";
import PublicPagination from "@/components/public/PublicPagination";
import PublicSiteFooter from "@/components/public/PublicSiteFooter";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import { getPublicEventList } from "@/lib/public-content";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


export const metadata: Metadata = {
  title: "Acara | SI PARIK BANGKA Kabupaten Bangka",
  description: "Agenda dan acara ekonomi kreatif serta pariwisata Kabupaten Bangka.",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function dateParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "--", month: "---" };
  return {
    day: new Intl.DateTimeFormat("id-ID", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date).replace(".", "").toUpperCase(),
  };
}

export default async function AcaraPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const requestedPage = Number(params.page ?? "1");
  const data = await getPublicEventList(requestedPage, 9);
  const fallbackImages = ["/hero-bangka.jpg", "/hero-home-v15.jpg", "/kriya-bangka.jpg", "/kuliner-bangka.png"];

  return (
    <div className="public-page-shell">
      <PublicSiteHeader />
      <main>
        <section className="public-page-hero public-page-hero-events">
          <div className="public-container public-page-hero-inner">
            <span className="public-eyebrow">Agenda Bangka</span>
            <h1>Temukan acara, festival, dan ruang kolaborasi.</h1>
            <p>Jelajahi agenda ekonomi kreatif dan pariwisata yang dapat diikuti masyarakat, komunitas, dan pelaku usaha.</p>
          </div>
        </section>

        <section className="public-content-section">
          <div className="public-container">
            <div className="public-list-heading">
              <div><span className="public-section-label">Acara</span><h2>Semua agenda</h2></div>
              <p>{data.total} acara tersedia</p>
            </div>

            {data.items.length > 0 ? (
              <div className="public-event-grid">
                {data.items.map((item, index) => {
                  const date = dateParts(item.tanggal_mulai);
                  return (
                    <article className="public-event-card" key={item.id}>
                      <Link href={`/acara/${item.slug}`} className="public-event-card-image" style={{ backgroundImage: `url(${item.foto_utama || fallbackImages[index % fallbackImages.length]})` }} aria-label={item.nama_acara}>
                        <span className="public-event-date"><strong>{date.day}</strong><small>{date.month}</small></span>
                        <span className="public-event-category">{item.nama_kategori || "Acara"}</span>
                      </Link>
                      <div className="public-event-card-body">
                        <span className="public-event-type">{item.jenis_pelaksanaan} · {formatDate(item.tanggal_mulai)}</span>
                        <h3><Link href={`/acara/${item.slug}`}>{item.nama_acara}</Link></h3>
                        <p>{item.ringkasan || "Agenda ekonomi kreatif dan pariwisata Kabupaten Bangka."}</p>
                        <div className="public-event-location"><span>⌖</span>{item.nama_lokasi || item.alamat || "Lokasi akan diumumkan"}</div>
                        <Link href={`/acara/${item.slug}`} className="public-read-link">Lihat detail <span>→</span></Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="public-empty-state">Belum ada acara yang dipublikasikan.</div>
            )}

            <PublicPagination page={data.page} totalPages={data.totalPages} basePath="/acara" />
          </div>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
