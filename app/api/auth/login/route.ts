import type { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { normalizeDbRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, type AppRole } from "@/lib/session";

type LoginRow = RowDataPacket & {
  id: number;
  role: string;
  name: string;
  email: string;
  password: string;
  status: "active" | "inactive";
};

// ==========================================================
// Proteksi Brute-Force & Rate Limiting (In-Memory)
// ==========================================================
type AttemptRecord = {
  count: number;
  lockoutUntil: number;
};

const loginAttempts = new Map<string, AttemptRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const LOCKOUT_MS = LOCKOUT_MINUTES * 60 * 1000;

function getClientIdentifier(request: NextRequest, email: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "local";
  return `${ip}:${email}`;
}

function cleanExpiredAttempts() {
  const now = Date.now();
  if (loginAttempts.size > 2000) {
    for (const [key, val] of loginAttempts.entries()) {
      if (val.lockoutUntil < now) {
        loginAttempts.delete(key);
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const requestedRole = body.role as AppRole;

    if (!email || !password || !["admin", "petugas"].includes(requestedRole)) {
      return NextResponse.json({ message: "Email, kata sandi, dan jenis akun wajib diisi." }, { status: 400 });
    }

    cleanExpiredAttempts();

    const clientKey = getClientIdentifier(request, email);
    const now = Date.now();
    const attempt = loginAttempts.get(clientKey);

    // Cek apakah akun/IP sedang dikunci karena terlalu banyak percobaan gagal
    if (attempt && attempt.lockoutUntil > now && attempt.count >= MAX_FAILED_ATTEMPTS) {
      const remainingMinutes = Math.ceil((attempt.lockoutUntil - now) / 60000);
      return NextResponse.json(
        {
          message: `Terlalu banyak percobaan login yang gagal. Akses dibatasi selama ${remainingMinutes} menit demi keamanan.`,
        },
        { status: 429 },
      );
    }

    const [rows] = await db().execute<LoginRow[]>(
      "SELECT id, role, name, email, password, status FROM pengguna WHERE email = ? LIMIT 1",
      [email],
    );
    const row = rows[0];
    const normalizedRole = row ? normalizeDbRole(row.role) : null;

    if (!row || row.status !== "active" || normalizedRole !== requestedRole || !verifyPassword(password, row.password)) {
      // Catat kegagalan login
      const currentCount = (attempt?.count ?? 0) + 1;
      loginAttempts.set(clientKey, {
        count: currentCount,
        lockoutUntil: currentCount >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_MS : now + 60000,
      });

      const remaining = MAX_FAILED_ATTEMPTS - currentCount;
      const warning =
        remaining > 0
          ? ` (Sisa ${remaining} kali percobaan sebelum diblokir sementara)`
          : ` Akun/IP diblokir sementara selama ${LOCKOUT_MINUTES} menit.`;

      return NextResponse.json(
        { message: `Email, kata sandi, atau jenis akun tidak sesuai.${warning}` },
        { status: 401 },
      );
    }

    // Login berhasil: reset catatan percobaan gagal
    loginAttempts.delete(clientKey);

    await db().execute("UPDATE pengguna SET last_login_at = NOW() WHERE id = ?", [row.id]);

    const token = createSessionToken({ uid: row.id, role: normalizedRole });
    const response = NextResponse.json({
      message: "Login berhasil.",
      redirectTo: normalizedRole === "admin" ? "/admin/petugas" : "/dashboard",
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Tidak dapat terhubung ke database. Periksa konfigurasi .env." }, { status: 500 });
  }
}
