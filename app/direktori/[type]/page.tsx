import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DirectoryListView from "@/components/public/DirectoryListView";
import {
  getPublicDirectoryList,
  isPublicDirectoryType,
  publicDirectoryMeta,
} from "@/lib/public-directory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
};

function parsePositiveInt(value: string | undefined, fallback = 1) {
  const parsed = Number(value ?? fallback);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { type } = await params;
  if (!isPublicDirectoryType(type)) {
    return { title: "Direktori tidak ditemukan | SI PARIK BANGKA" };
  }

  const meta = publicDirectoryMeta[type];
  return {
    title: `${meta.label} | Direktori SI PARIK BANGKA`,
    description: meta.description,
  };
}

export default async function DirectoryTypePage({ params, searchParams }: Props) {
  const [{ type }, search] = await Promise.all([params, searchParams]);
  if (!isPublicDirectoryType(type)) notFound();

  const requestedPage = parsePositiveInt(search.page, 1);
  const query = typeof search.q === "string" ? search.q.trim() : "";

  const data = await getPublicDirectoryList(type, requestedPage, 9, query);

  return <DirectoryListView type={type} data={data} query={query} />;
}
