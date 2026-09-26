// app/sitemap.ts
import type { MetadataRoute } from "next";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";

type SlugDateRow = RowDataPacket & {
  slug: string;
  tanggal_publikasi?: string | Date | null;
};

type IdRow = RowDataPacket & {
  id: number;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.APP_BASE_URL || "https://siparik.bangka.go.id").replace(/\/+$/, "");
  const now = new Date();

  // 1. Rute statis utama portal
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/wisata`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/wisata/tempat-wisata`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/wisata/kuliner`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/wisata/hotel`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/wisata/satwa-endemik`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/acara`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/berita`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/direktori`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/direktori/ekraf`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/direktori/sdm`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/direktori/komunitas`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  try {
    const database = db();

    // 2. Query data dinamis secara paralel untuk sitemap
    const [
      [tempatWisataRows],
      [kulinerRows],
      [hotelRows],
      [satwaRows],
      [beritaRows],
      [acaraRows],
      [subsektorRows],
    ] = await Promise.all([
      database.query<SlugDateRow[]>(`
        SELECT t.slug, t.tanggal_publikasi
        FROM tempat_wisata t
        WHERE t.aktif = 1 AND t.dipublikasikan = 1 AND t.tanggal_publikasi IS NOT NULL AND t.tanggal_publikasi <= NOW()
      `).catch(() => [[]]),
      database.query<SlugDateRow[]>(`
        SELECT t.slug, t.tanggal_publikasi
        FROM kuliner t
        WHERE t.aktif = 1 AND t.dipublikasikan = 1 AND t.tanggal_publikasi IS NOT NULL AND t.tanggal_publikasi <= NOW()
      `).catch(() => [[]]),
      database.query<SlugDateRow[]>(`
        SELECT t.slug, t.tanggal_publikasi
        FROM hotel t
        WHERE t.aktif = 1 AND t.dipublikasikan = 1 AND t.tanggal_publikasi IS NOT NULL AND t.tanggal_publikasi <= NOW()
      `).catch(() => [[]]),
      database.query<SlugDateRow[]>(`
        SELECT t.slug, t.tanggal_publikasi
        FROM satwa_endemik t
        WHERE t.aktif = 1 AND t.dipublikasikan = 1 AND t.tanggal_publikasi IS NOT NULL AND t.tanggal_publikasi <= NOW()
      `).catch(() => [[]]),
      database.query<SlugDateRow[]>(`
        SELECT b.slug, b.tanggal_publikasi
        FROM berita b
        WHERE b.aktif = 1 AND b.dipublikasikan = 1 AND b.tanggal_publikasi IS NOT NULL AND b.tanggal_publikasi <= NOW()
      `).catch(() => [[]]),
      database.query<SlugDateRow[]>(`
        SELECT a.slug, a.tanggal_publikasi
        FROM acara a
        WHERE a.aktif = 1 AND a.dipublikasikan = 1 AND a.tanggal_publikasi IS NOT NULL AND a.tanggal_publikasi <= NOW()
      `).catch(() => [[]]),
      database.query<IdRow[]>(`
        SELECT id FROM master_subsektor_ekraf WHERE aktif = 1
      `).catch(() => [[]]),
    ]);

    const dynamicRoutes: MetadataRoute.Sitemap = [
      ...tempatWisataRows.map((row) => ({
        url: `${baseUrl}/wisata/tempat-wisata/${encodeURIComponent(row.slug)}`,
        lastModified: row.tanggal_publikasi ? new Date(row.tanggal_publikasi) : now,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      })),
      ...kulinerRows.map((row) => ({
        url: `${baseUrl}/wisata/kuliner/${encodeURIComponent(row.slug)}`,
        lastModified: row.tanggal_publikasi ? new Date(row.tanggal_publikasi) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...hotelRows.map((row) => ({
        url: `${baseUrl}/wisata/hotel/${encodeURIComponent(row.slug)}`,
        lastModified: row.tanggal_publikasi ? new Date(row.tanggal_publikasi) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...satwaRows.map((row) => ({
        url: `${baseUrl}/wisata/satwa-endemik/${encodeURIComponent(row.slug)}`,
        lastModified: row.tanggal_publikasi ? new Date(row.tanggal_publikasi) : now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...beritaRows.map((row) => ({
        url: `${baseUrl}/berita/${encodeURIComponent(row.slug)}`,
        lastModified: row.tanggal_publikasi ? new Date(row.tanggal_publikasi) : now,
        changeFrequency: "daily" as const,
        priority: 0.85,
      })),
      ...acaraRows.map((row) => ({
        url: `${baseUrl}/acara/${encodeURIComponent(row.slug)}`,
        lastModified: row.tanggal_publikasi ? new Date(row.tanggal_publikasi) : now,
        changeFrequency: "daily" as const,
        priority: 0.85,
      })),
      ...subsektorRows.map((row) => ({
        url: `${baseUrl}/subsektor/${row.id}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];

    return [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    console.error("[SEO Sitemap] Gagal mengambil data dinamis, menggunakan rute statis:", error);
    return staticRoutes;
  }
}
