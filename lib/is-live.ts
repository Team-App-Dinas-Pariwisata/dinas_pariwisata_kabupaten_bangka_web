import { headers } from "next/headers";

/**
 * Mendeteksi apakah aplikasi sedang berjalan pada server produksi/live (misal: siparik.bangka.go.id).
 * Mengecek APP_BASE_URL serta header host dari request HTTP.
 */
export async function checkIsLiveServer(): Promise<boolean> {
  const appUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  if (
    appUrl &&
    !appUrl.includes("localhost") &&
    !appUrl.includes("127.0.0.1") &&
    !appUrl.includes("0.0.0.0")
  ) {
    return true;
  }

  try {
    const headerStore = await headers();
    const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "";
    if (
      host &&
      !host.includes("localhost") &&
      !host.includes("127.0.0.1") &&
      !host.includes("0.0.0.0")
    ) {
      return true;
    }
  } catch {
    // Abaikan jika dipanggil di luar konteks request (misal saat build statis)
  }

  return false;
}
