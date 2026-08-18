import type { Metadata } from "next";
import PublicSiteFooter from "@/components/public/PublicSiteFooter";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import TourismRecommendationSearch from "@/components/public/TourismRecommendationSearch";

export const metadata: Metadata = {
  title: "Pencarian Rekomendasi | SI PARIK BANGKA Kabupaten Bangka",
  description: "Pencarian rekomendasi tempat wisata, kuliner, hotel, dan satwa endemik berdasarkan kebutuhan dan prioritas pengguna.",
};

export default function PencarianPage() {
  return (
    <div className="public-page-shell">
      <PublicSiteHeader />
      <main>
        <section className="public-page-hero spk-search-hero">
          <div className="public-container public-page-hero-inner">
            <span className="public-eyebrow">Pencarian Cerdas</span>
            <h1>Temukan rekomendasi wisata berdasarkan kebutuhan Anda.</h1>
            <p>Pilih kategori, tentukan batas budget dan jarak, tambahkan kebutuhan khusus, lalu atur prioritas. Sistem akan membandingkan pilihan yang tersedia dan menampilkan rekomendasi yang paling sesuai dengan kebutuhan Anda.</p>
          </div>
        </section>
        <section className="public-content-section spk-search-section">
          <div className="public-container">
            <TourismRecommendationSearch />
          </div>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
