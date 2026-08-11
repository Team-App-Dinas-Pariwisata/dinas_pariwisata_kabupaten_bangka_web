import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  const destination = user?.role === "pengaju" ? "/akun/masuk" : "/login";
  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
  return response;
}
