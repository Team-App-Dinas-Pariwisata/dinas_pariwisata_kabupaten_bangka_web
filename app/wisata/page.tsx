import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteFooter from "@/components/public/PublicSiteFooter";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";

export const metadata: Metadata = {
  title: "Wisata | APPEKRAF Kabupaten Bangka",
  description: "Jelajahi tempat wisata, kuliner, hotel, dan satwa endemik di Kabupaten Bangka.",
};

const categories = [
  {
    title: "Tempat Wisata",
    href: "/wisata/tempat-wisata",
    description: "Pantai, alam, budaya, dan destinasi pilihan untuk rencana perjalanan Anda.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=82",
  },
  {
    title: "Kuliner",
    href: "/wisata/kuliner",
    description: "Jelajahi cita rasa lokal, menu khas, dan ruang makan pilihan di Bangka.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=82",
  },
  {
    title: "Hotel",
    href: "/wisata/hotel",
    description: "Pilihan akomodasi untuk perjalanan singkat, keluarga, maupun kebutuhan bisnis.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=82",
  },
  {
    title: "Satwa Endemik",
    href: "/wisata/satwa-endemik",
    description: "Kenali fauna khas, habitat, persebaran, dan informasi konservasinya.",
    image: "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1400&q=82",
  },
];

export default function WisataPage() {
  return (
    <div className="public-page-shell">
      <PublicSiteHeader />
      <main>
        <section className="public-page-hero tourism-index-hero">
          <div className="public-container public-page-hero-inner">
            <span className="public-eyebrow">Jelajah Kabupaten Bangka</span>
            <h1>Satu pintu untuk menemukan pengalaman wisata Bangka.</h1>
            <p>Mulai dari destinasi, kuliner, akomodasi, hingga kekayaan hayati, semuanya dirangkum dalam tampilan yang sederhana dan mudah dijelajahi.</p>
          </div>
        </section>

        <section className="public-content-section">
          <div className="public-container">
            <div className="public-list-heading">
              <div><span className="public-section-label">Kategori Wisata</span><h2>Pilih yang ingin Anda jelajahi</h2></div>
            </div>
            <div className="tourism-category-grid">
              {categories.map((category) => (
                <Link href={category.href} className="tourism-category-card" key={category.href}>
                  <div className="tourism-category-image" style={{ backgroundImage: `url(${category.image})` }} />
                  <div><h3>{category.title}</h3><p>{category.description}</p><span>Jelajahi →</span></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
