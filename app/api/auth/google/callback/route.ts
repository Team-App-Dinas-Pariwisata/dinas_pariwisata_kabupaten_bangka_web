import { NextRequest, NextResponse } from "next/server";
import { createNumeric, dbNow, getAll, updateById } from "@/lib/realtime-db";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  exchangeGoogleCode,
  fetchGoogleProfile,
  googleOAuthReady,
  googleRedirectUri,
} from "@/lib/google-oauth";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export const runtime = "nodejs";

type ExistingUser = Record<string, unknown> & {
  id: number;
  role: string;
  email: string;
  status: "active" | "inactive";
  google_sub: string | null;
};

function errorRedirect(request: NextRequest, code: string) {
  const response = NextResponse.redirect(new URL(`/akun/masuk?error=${encodeURIComponent(code)}`, request.url));
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

function locateGoogleUser(users: ExistingUser[], googleSub: string, email: string) {
  return users.find((item) => item.google_sub === googleSub)
    ?? users.find((item) => String(item.email ?? "").trim().toLowerCase() === email)
    ?? null;
}

export async function GET(request: NextRequest) {
  if (!googleOAuthReady()) return errorRedirect(request, "config");

  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) return errorRedirect(request, providerError === "access_denied" ? "cancelled" : "google");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState) return errorRedirect(request, "state");

  try {
    const redirectUri = googleRedirectUri(request.nextUrl.origin);
    const accessToken = await exchangeGoogleCode(code, redirectUri);
    const profile = await fetchGoogleProfile(accessToken);
    const email = profile.email.trim().toLowerCase();

    if (!profile.email_verified) return errorRedirect(request, "unverified_email");

    const users = await getAll<ExistingUser>("pengguna");
    const existing = locateGoogleUser(users, profile.sub, email);
    let userId = 0;

    if (existing) {
      if (existing.role !== "pengaju") throw new Error("EMAIL_INTERNAL");
      if (existing.status !== "active") throw new Error("ACCOUNT_INACTIVE");
      if (existing.google_sub && existing.google_sub !== profile.sub) throw new Error("GOOGLE_ACCOUNT_MISMATCH");

      await updateById("pengguna", existing.id, {
        name: profile.name?.trim() || email.split("@")[0],
        avatar_url: profile.picture || null,
        google_sub: profile.sub,
        auth_provider: "google",
        email_verified: 1,
        last_login_at: dbNow(),
      });
      userId = Number(existing.id);
    } else {
      userId = await createNumeric("pengguna", {
        role: "pengaju",
        name: profile.name?.trim() || email.split("@")[0],
        email,
        password: "oauth:google",
        avatar_url: profile.picture || null,
        status: "active",
        auth_provider: "google",
        google_sub: profile.sub,
        email_verified: 1,
        last_login_at: dbNow(),
      });
    }

    const token = createSessionToken({ uid: userId, role: "pengaju" });
    const response = NextResponse.redirect(new URL("/akun", request.url));
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
    return response;
  } catch (error) {
    console.error("Google applicant auth error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message === "EMAIL_INTERNAL") return errorRedirect(request, "internal_email");
    if (message === "ACCOUNT_INACTIVE") return errorRedirect(request, "inactive");
    if (message === "GOOGLE_ACCOUNT_MISMATCH") return errorRedirect(request, "account_mismatch");
    return errorRedirect(request, "server");
  }
}
