import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export const runtime = "nodejs";
type GoogleTokenInfo = { sub?:string; email?:string; email_verified?:string|boolean; name?:string; picture?:string; aud?:string; error_description?:string };
type ExistingUser = RowDataPacket & { id:number; role:string; status:"active"|"inactive"; google_sub:string|null };

export async function POST(request: NextRequest) {
  try {
    const {idToken} = await request.json() as {idToken?:string};
    if (!idToken) return NextResponse.json({message:"Google ID token wajib dikirim."},{status:400});
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return NextResponse.json({message:"GOOGLE_CLIENT_ID belum dikonfigurasi di backend."},{status:500});

    const verify = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {cache:"no-store"});
    const profile = await verify.json() as GoogleTokenInfo;
    const verified = profile.email_verified === true || profile.email_verified === "true";
    if (!verify.ok || !profile.sub || !profile.email || profile.aud !== clientId || !verified) {
      return NextResponse.json({message:profile.error_description || "Token Google tidak valid atau email belum terverifikasi."},{status:401});
    }
    const email = profile.email.trim().toLowerCase();
    const connection = await db().getConnection();
    let userId = 0;
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute<ExistingUser[]>(
        "SELECT id, role, status, google_sub FROM pengguna WHERE google_sub = ? OR email = ? ORDER BY google_sub = ? DESC LIMIT 1 FOR UPDATE",
        [profile.sub,email,profile.sub],
      );
      const existing = rows[0];
      if (existing) {
        if (existing.role !== "pengaju") throw new Error("EMAIL_INTERNAL");
        if (existing.status !== "active") throw new Error("ACCOUNT_INACTIVE");
        if (existing.google_sub && existing.google_sub !== profile.sub) throw new Error("GOOGLE_ACCOUNT_MISMATCH");
        await connection.execute(
          "UPDATE pengguna SET name=?, avatar_url=?, google_sub=?, auth_provider='google', email_verified=1, last_login_at=NOW() WHERE id=?",
          [profile.name?.trim() || email.split("@")[0], profile.picture || null, profile.sub, existing.id],
        );
        userId = existing.id;
      } else {
        const [result] = await connection.execute<ResultSetHeader>(
          "INSERT INTO pengguna (role,name,email,password,avatar_url,status,auth_provider,google_sub,email_verified,last_login_at) VALUES ('pengaju',?,?,'oauth:google',?,'active','google',?,1,NOW())",
          [profile.name?.trim() || email.split("@")[0],email,profile.picture || null,profile.sub],
        );
        userId = result.insertId;
      }
      await connection.commit();
    } catch (e) { await connection.rollback(); throw e; } finally { connection.release(); }

    const token = createSessionToken({uid:userId,role:"pengaju"});
    const response = NextResponse.json({message:"Login Google berhasil.",token,user:{id:userId,role:"pengaju",name:profile.name?.trim() || email.split("@")[0],email,phone:null,avatarUrl:profile.picture || null}});
    response.cookies.set(SESSION_COOKIE,token,sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Mobile Google auth error:",error);
    const code = error instanceof Error ? error.message : "";
    if (code === "EMAIL_INTERNAL") return NextResponse.json({message:"Email ini sudah digunakan sebagai akun internal petugas."},{status:409});
    if (code === "ACCOUNT_INACTIVE") return NextResponse.json({message:"Akun Anda sedang nonaktif."},{status:403});
    if (code === "GOOGLE_ACCOUNT_MISMATCH") return NextResponse.json({message:"Akun Google tidak sesuai dengan akun yang sudah terdaftar."},{status:409});
    return NextResponse.json({message:"Login Google mobile belum dapat diproses."},{status:500});
  }
}
