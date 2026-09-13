// app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);

  /**
   * Tentukan halaman tujuan setelah logout
   */
  const destination =
    user?.role === "pengaju"
      ? "/akun/masuk"
      : "/petugas";

  /**
   * Bersihkan presence user petugas
   */
  if (user && ["admin", "petugas"].includes(user.role)) {
    try {
      await db().execute(
        "DELETE FROM staff_chat_presence WHERE user_id = ?",
        [user.id]
      );
    } catch (error) {
      console.error(
        "[logout presence cleanup error]",
        error
      );
    }
  }

  /**
   * Gunakan base URL production
   * agar tidak mengambil localhost dari request.url
   */
  const baseUrl =
    process.env.APP_BASE_URL ||
    "https://siparik.bangka.go.id";

  const response = NextResponse.redirect(
    new URL(destination, baseUrl),
    303
  );

  /**
   * Hapus session cookie
   */
  response.cookies.set(
    SESSION_COOKIE,
    "",
    {
      ...sessionCookieOptions(),
      maxAge: 0,
    }
  );

  return response;
}