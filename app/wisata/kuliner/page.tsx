import type { Metadata } from "next";
import TourismListView from "@/components/public/TourismListView";
import { getPublicTourismList } from "@/lib/public-tourism";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Kuliner | Wisata Bangka",
  description: "Daftar kuliner Kabupaten Bangka.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const data = await getPublicTourismList("kuliner", page, 9);
  return <TourismListView kind="kuliner" data={data} />;
}
