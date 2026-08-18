import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  const destination = user?.role === "pengaju" ? "/akun/masuk" : "/petugas";

  if (user && ["admin", "pengguna"].includes(user.role)) {
    try {
      await db().execute("DELETE FROM staff_chat_presence WHERE user_id = ?", [user.id]);
    } catch (error) {
      console.error("[logout presence cleanup]", error);
    }
  }

  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
