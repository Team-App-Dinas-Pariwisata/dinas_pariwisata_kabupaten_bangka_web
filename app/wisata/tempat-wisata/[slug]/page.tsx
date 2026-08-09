import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TourismDetailView from "@/components/public/TourismDetailView";
import { getPublicTourismBySlug, getRelatedTourism } from "@/lib/public-tourism";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicTourismBySlug("tempat-wisata", slug);
  if (!item) return { title: "Data tidak ditemukan | Wisata Bangka" };
  return { title: `${item.title} | Tempat Wisata Bangka`, description: item.summary || "Informasi tempat wisata Kabupaten Bangka." };
}

export default async function DetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getPublicTourismBySlug("tempat-wisata", slug);
  if (!item) notFound();
  const related = await getRelatedTourism("tempat-wisata", item.id, 3);
  return <TourismDetailView kind="tempat-wisata" item={item} related={related} />;
}
