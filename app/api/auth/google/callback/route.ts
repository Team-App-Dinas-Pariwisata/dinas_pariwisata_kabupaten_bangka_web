import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  exchangeGoogleCode,
  fetchGoogleProfile,
  googleOAuthReady,
  googleRedirectUri,
} from "@/lib/google-oauth";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

type ExistingUser = RowDataPacket & {
  id: number;
  role: string;
  status: "active" | "inactive";
  google_sub: string | null;
};

function errorRedirect(request: NextRequest, code: string) {
  const response = NextResponse.redirect(new URL(`/akun/masuk?error=${encodeURIComponent(code)}`, request.url));
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
  return response;
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

    const connection = await db().getConnection();
    let userId = 0;
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute<ExistingUser[]>(
        "SELECT id, role, status, google_sub FROM pengguna WHERE google_sub = ? OR email = ? ORDER BY google_sub = ? DESC LIMIT 1 FOR UPDATE",
        [profile.sub, email, profile.sub],
      );
      const existing = rows[0];

      if (existing) {
        if (existing.role !== "pengaju") throw new Error("EMAIL_INTERNAL");
        if (existing.status !== "active") throw new Error("ACCOUNT_INACTIVE");
        if (existing.google_sub && existing.google_sub !== profile.sub) throw new Error("GOOGLE_ACCOUNT_MISMATCH");

        await connection.execute(
          `UPDATE pengguna
           SET name = ?, avatar_url = ?, google_sub = ?, auth_provider = 'google', email_verified = 1, last_login_at = NOW()
           WHERE id = ?`,
          [profile.name?.trim() || email.split("@")[0], profile.picture || null, profile.sub, existing.id],
        );
        userId = existing.id;
      } else {
        const [result] = await connection.execute<ResultSetHeader>(
          `INSERT INTO pengguna
           (role, name, email, password, avatar_url, status, auth_provider, google_sub, email_verified, last_login_at)
           VALUES ('pengaju', ?, ?, 'oauth:google', ?, 'active', 'google', ?, 1, NOW())`,
          [profile.name?.trim() || email.split("@")[0], email, profile.picture || null, profile.sub],
        );
        userId = result.insertId;
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const token = createSessionToken({ uid: userId, role: "pengaju" }, 60 * 60 * 24 * 7);
    const response = NextResponse.redirect(new URL("/akun", request.url));
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
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
