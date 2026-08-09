import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { RowDataPacket } from "mysql2/promise";

export async function GET(request: NextRequest) {
  const user = await requireRequestRole(request, "pengguna");
  if (!user) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  return NextResponse.json({ data: { name: user.name, email: user.email, phone: user.phone ?? "" } });
}

export async function PATCH(request: NextRequest) {
  const user = await requireRequestRole(request, "pengguna");
  if (!user) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim() || null;
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");
  if (!name) return NextResponse.json({ message: "Nama wajib diisi." }, { status: 400 });

  if (newPassword) {
    if (newPassword.length < 8) return NextResponse.json({ message: "Kata sandi baru minimal 8 karakter." }, { status: 400 });
    const [rows] = await db().execute<(RowDataPacket & { password: string })[]>("SELECT password FROM pengguna WHERE id = ? LIMIT 1", [user.id]);
    if (!rows[0] || !verifyPassword(currentPassword, rows[0].password)) return NextResponse.json({ message: "Kata sandi saat ini tidak sesuai." }, { status: 400 });
    await db().execute("UPDATE pengguna SET name = ?, phone = ?, password = ? WHERE id = ?", [name, phone, hashPassword(newPassword), user.id]);
  } else {
    await db().execute("UPDATE pengguna SET name = ?, phone = ? WHERE id = ?", [name, phone, user.id]);
  }
  return NextResponse.json({ message: "Pengaturan berhasil disimpan." });
}
