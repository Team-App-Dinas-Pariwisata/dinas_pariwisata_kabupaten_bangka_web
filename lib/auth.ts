import type { RowDataPacket } from "mysql2/promise";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { db } from "./db";
import { SESSION_COOKIE, type AppRole, verifySessionToken } from "./session";

export type AuthUser = {
  id: number;
  role: AppRole;
  name: string;
  email: string;
  phone: string | null;
};

type UserRow = RowDataPacket & {
  id: number;
  role: string;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive";
};

/**
 * Menormalkan role database lama maupun role portal versi sebelumnya.
 * - super_admin/admin => admin
 * - operator/verifikator/pengguna => pengguna
 */
export function normalizeDbRole(role: string): AppRole | null {
  if (["super_admin", "admin"].includes(role)) return "admin";
  if (["operator", "verifikator", "pengguna"].includes(role)) return "pengguna";
  return null;
}

async function readUser(uid: number): Promise<AuthUser | null> {
  const [rows] = await db().execute<UserRow[]>(
    "SELECT id, role, name, email, phone, status FROM pengguna WHERE id = ? LIMIT 1",
    [uid],
  );
  const row = rows[0];
  if (!row || row.status !== "active") return null;
  const role = normalizeDbRole(row.role);
  if (!role) return null;
  return { id: row.id, role, name: row.name, email: row.email, phone: row.phone };
}

export async function getRequestUser(request: NextRequest): Promise<AuthUser | null> {
  const payload = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const user = await readUser(payload.uid);
  if (!user || user.role !== payload.role) return null;
  return user;
}

export async function requireRequestRole(request: NextRequest, role: AppRole) {
  const user = await getRequestUser(request);
  if (!user || user.role !== role) return null;
  return user;
}

export async function getPageUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const payload = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const user = await readUser(payload.uid);
  if (!user || user.role !== payload.role) return null;
  return user;
}

export async function requirePageRole(role: AppRole) {
  const user = await getPageUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(user.role === "admin" ? "/admin/pengguna" : "/dashboard");
  return user;
}
