import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DirectoryDetailView from "@/components/public/DirectoryDetailView";
import {
  getPublicDirectoryDetail,
  getRelatedPublicDirectory,
  isPublicDirectoryType,
  publicDirectoryMeta,
} from "@/lib/public-directory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = { params: Promise<{ type: string; id: string }> };

function parseId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, id: idValue } = await params;
  const id = parseId(idValue);
  if (!isPublicDirectoryType(type) || !id) {
    return { title: "Profil tidak ditemukan | SI PARIK BANGKA" };
  }

  const item = await getPublicDirectoryDetail(type, id);
  if (!item) return { title: "Profil tidak ditemukan | SI PARIK BANGKA" };
  const meta = publicDirectoryMeta[type];
  return {
    title: `${item.title} | ${meta.label} SI PARIK BANGKA`,
    description: item.description || meta.description,
  };
}

export default async function DirectoryDetailPage({ params }: Props) {
  const { type, id: idValue } = await params;
  const id = parseId(idValue);
  if (!isPublicDirectoryType(type) || !id) notFound();

  const item = await getPublicDirectoryDetail(type, id);
  if (!item) notFound();

  const related = await getRelatedPublicDirectory(type, item.id, 3);
  return <DirectoryDetailView item={item} related={related} />;
}
