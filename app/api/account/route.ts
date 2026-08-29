import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { getById, updateById } from "@/lib/realtime-db";
import { hashPassword, verifyPassword } from "@/lib/password";

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
    const row = await getById<Record<string, unknown> & { password?: string }>("pengguna", user.id);
    if (!row?.password || !verifyPassword(currentPassword, row.password)) return NextResponse.json({ message: "Kata sandi saat ini tidak sesuai." }, { status: 400 });
    await updateById("pengguna", user.id, { name, phone, password: hashPassword(newPassword) });
  } else {
    await updateById("pengguna", user.id, { name, phone });
  }
  return NextResponse.json({ message: "Pengaturan berhasil disimpan." });
}
