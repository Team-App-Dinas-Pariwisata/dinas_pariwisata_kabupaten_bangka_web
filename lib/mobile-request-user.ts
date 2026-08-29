import type { NextRequest } from "next/server";
import { normalizeDbRole, type AuthUser } from "./auth";
import { getById } from "./realtime-db";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export async function getMobileRequestUser(request: NextRequest): Promise<AuthUser | null> {
  const authorization = request.headers.get("authorization")?.trim() || "";
  const bearer = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  const token = bearer || request.cookies.get(SESSION_COOKIE)?.value || "";
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const row = await getById<Record<string, unknown> & {
    id: number;
    role: string;
    name: string;
    email: string;
    phone?: string | null;
    avatar_url?: string | null;
    status: "active" | "inactive";
  }>("pengguna", payload.uid);
  if (!row || row.status !== "active") return null;
  const role = normalizeDbRole(String(row.role ?? ""));
  if (!role || role !== payload.role) return null;

  return {
    id: Number(row.id),
    role,
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: row.phone ? String(row.phone) : null,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
  };
}
