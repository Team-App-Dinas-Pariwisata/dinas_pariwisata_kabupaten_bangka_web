import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  const destination = user?.role === "pengaju" ? "/akun/masuk" : "/petugas";
  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
