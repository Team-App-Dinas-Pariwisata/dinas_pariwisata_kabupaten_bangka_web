import { NextRequest, NextResponse } from "next/server";
import { normalizeDbRole } from "@/lib/auth";
import { dbNow, findOne, updateById } from "@/lib/realtime-db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, type AppRole } from "@/lib/session";

type LoginRow = Record<string, unknown> & {
  id: number;
  role: string;
  name: string;
  email: string;
  password: string;
  status: "active" | "inactive";
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const requestedRole = body.role as AppRole;

    if (!email || !password || !["admin", "pengguna"].includes(requestedRole)) {
      return NextResponse.json({ message: "Email, kata sandi, dan jenis akun wajib diisi." }, { status: 400 });
    }

    const row = await findOne<LoginRow>("pengguna", (item) => String(item.email ?? "").trim().toLowerCase() === email);
    const normalizedRole = row ? normalizeDbRole(row.role) : null;

    if (!row || row.status !== "active" || normalizedRole !== requestedRole || !verifyPassword(password, row.password)) {
      return NextResponse.json({ message: "Email, kata sandi, atau jenis akun tidak sesuai." }, { status: 401 });
    }

    await updateById("pengguna", row.id, { last_login_at: dbNow() });

    const token = createSessionToken({ uid: Number(row.id), role: normalizedRole });
    const response = NextResponse.json({
      message: "Login berhasil.",
      redirectTo: normalizedRole === "admin" ? "/admin/pengguna" : "/dashboard",
    });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Tidak dapat terhubung ke Firebase Realtime Database. Periksa konfigurasi .env." }, { status: 500 });
  }
}
