import type { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { normalizeDbRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, type AppRole } from "@/lib/session";

type LoginRow = RowDataPacket & { id:number; role:string; name:string; email:string; phone:string|null; avatar_url:string|null; password:string; status:"active"|"inactive" };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const requestedRole = body.role as AppRole;
    if (!email || !password || !["admin","pengguna"].includes(requestedRole)) {
      return NextResponse.json({message:"Email, kata sandi, dan jenis akun wajib diisi."},{status:400});
    }
    const [rows] = await db().execute<LoginRow[]>("SELECT id, role, name, email, phone, avatar_url, password, status FROM pengguna WHERE email = ? LIMIT 1", [email]);
    const row = rows[0];
    const role = row ? normalizeDbRole(row.role) : null;
    if (!row || row.status !== "active" || role !== requestedRole || !verifyPassword(password,row.password)) {
      return NextResponse.json({message:"Email, kata sandi, atau jenis akun tidak sesuai."},{status:401});
    }
    await db().execute("UPDATE pengguna SET last_login_at = NOW() WHERE id = ?", [row.id]);
    const token = createSessionToken({uid:row.id,role});
    const response = NextResponse.json({
      message:"Login berhasil.", token,
      user:{id:row.id,role,name:row.name,email:row.email,phone:row.phone,avatarUrl:row.avatar_url},
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Mobile login error:",error);
    return NextResponse.json({message:"Tidak dapat terhubung ke database."},{status:500});
  }
}
