import { NextResponse } from "next/server";

/**
 * Proxy sengaja tidak lagi memperpanjang cookie sesi pada setiap request.
 * Masa sesi sudah persisten dari saat login. Menulis ulang cookie dari request
 * biasa dapat menimpa cookie login baru atau menghidupkan kembali sesi lama
 * ketika response lama selesai sesudah proses logout.
 */
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2)$).*)",
  ],
};
