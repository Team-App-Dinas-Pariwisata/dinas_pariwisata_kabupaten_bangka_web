import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/session";

/**
 * Sliding session untuk admin, petugas, dan pengaju.
 * Setiap kali pengguna kembali mengakses portal dengan sesi yang masih valid,
 * masa cookie diperpanjang lagi. Logout tetap menghapus cookie melalui route logout.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Jangan pernah memperpanjang cookie ketika pengguna sedang logout.
  if (request.nextUrl.pathname === "/api/auth/logout") return response;

  const currentToken = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(currentToken);
  if (!payload) return response;

  const refreshedToken = createSessionToken({ uid: payload.uid, role: payload.role });
  response.cookies.set(SESSION_COOKIE, refreshedToken, sessionCookieOptions());
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2)$).*)",
  ],
};
