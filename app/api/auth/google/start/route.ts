import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  buildGoogleAuthorizationUrl,
  createOAuthState,
  googleOAuthReady,
  googleRedirectUri,
} from "@/lib/google-oauth";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!googleOAuthReady()) {
    return NextResponse.redirect(new URL("/akun/masuk?error=config", request.url));
  }

  const state = createOAuthState();
  const redirectUri = googleRedirectUri(request.nextUrl.origin);
  const response = NextResponse.redirect(buildGoogleAuthorizationUrl(redirectUri, state));
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
