import { NextRequest, NextResponse } from "next/server";
import { normalizeDbRole } from "@/lib/auth";
import { dbNow, findOne, updateById } from "@/lib/realtime-db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, type AppRole } from "@/lib/session";
import { createFirebaseCustomToken } from "@/lib/firebase-custom-token";

type LoginRow = Record<string, unknown> & { id:number; role:string; name:string; email:string; phone:string|null; avatar_url:string|null; password:string; status:"active"|"inactive" };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const requestedRole = body.role as AppRole;
    if (!email || !password || !["admin","pengguna"].includes(requestedRole)) {
      return NextResponse.json({message:"Email, kata sandi, dan jenis akun wajib diisi."},{status:400});
    }
    const row = await findOne<LoginRow>("pengguna", (item) => String(item.email ?? "").trim().toLowerCase() === email);
    const role = row ? normalizeDbRole(row.role) : null;
    if (!row || row.status !== "active" || role !== requestedRole || !verifyPassword(password,row.password)) {
      return NextResponse.json({message:"Email, kata sandi, atau jenis akun tidak sesuai."},{status:401});
    }
    await updateById("pengguna", row.id, { last_login_at: dbNow() });
    const token = createSessionToken({uid:Number(row.id),role});
    const firebaseCustomToken = createFirebaseCustomToken({ userId: Number(row.id), role });
    const response = NextResponse.json({
      message:"Login berhasil.", token, firebaseCustomToken,
      user:{id:Number(row.id),role,name:row.name,email:row.email,phone:row.phone ?? null,avatarUrl:row.avatar_url ?? null},
    });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Mobile login error:",error);
    return NextResponse.json({message:"Tidak dapat terhubung ke Firebase Realtime Database."},{status:500});
  }
}
