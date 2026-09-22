import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/google-oauth";
import { deleteByKey } from "@/lib/realtime-db";

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  const destination = user?.role === "pengaju" ? "/akun/masuk" : "/petugas";

  if (user && ["admin", "petugas"].includes(user.role)) {
    try {
      await deleteByKey("staff_chat_presence", user.id);
    } catch (error) {
      console.error("[logout presence cleanup]", error);
    }
  }

  const baseUrl = process.env.APP_BASE_URL || "https://siparik.bangka.go.id";
  const response = NextResponse.redirect(new URL(destination, baseUrl), 303);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}