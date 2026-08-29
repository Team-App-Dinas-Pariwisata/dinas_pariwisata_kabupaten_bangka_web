import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { createNumeric, deleteById, getAll, updateById } from "@/lib/realtime-db";
import { hashPassword } from "@/lib/password";

type UserRow = Record<string, unknown> & {
  id: number;
  role: string;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive";
  last_login_at: string | null;
  created_at: string;
};

async function adminOnly(request: NextRequest) {
  return requireRequestRole(request, "admin");
}

function operationalUser(row: UserRow) {
  return ["operator", "verifikator", "pengguna"].includes(String(row.role));
}

async function duplicateUser(email: string, phone: string | null, exceptId?: number) {
  const rows = await getAll<UserRow>("pengguna");
  return rows.find((row) => Number(row.id) !== exceptId && (
    String(row.email ?? "").trim().toLowerCase() === email
    || (phone && String(row.phone ?? "").trim() === phone)
  )) ?? null;
}

export async function GET(request: NextRequest) {
  if (!(await adminOnly(request))) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  const rows = (await getAll<UserRow>("pengguna"))
    .filter(operationalUser)
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))
    .map(({ id, role, name, email, phone, status, last_login_at, created_at }) => ({ id, role, name, email, phone, status, last_login_at, created_at }));
  return NextResponse.json({ data: rows });
}

export async function POST(request: NextRequest) {
  if (!(await adminOnly(request))) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim() || null;
    const password = String(body.password ?? "");
    const status = body.status === "inactive" ? "inactive" : "active";
    if (!name || !email || password.length < 8) {
      return NextResponse.json({ message: "Nama, email, dan kata sandi minimal 8 karakter wajib diisi." }, { status: 400 });
    }
    if (await duplicateUser(email, phone)) return NextResponse.json({ message: "Email atau nomor telepon sudah digunakan." }, { status: 400 });
    const id = await createNumeric("pengguna", { role: "pengguna", name, email, phone, password: hashPassword(password), status, auth_provider: "password", email_verified: 0 });
    return NextResponse.json({ message: "Pengguna berhasil dibuat.", id }, { status: 201 });
  } catch (error) {
    console.error("Admin create user:", error);
    return NextResponse.json({ message: "Operasi pengguna gagal diproses." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await adminOnly(request))) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const body = await request.json();
    const id = Number(body.id);
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim() || null;
    const password = String(body.password ?? "");
    const status = body.status === "inactive" ? "inactive" : "active";
    if (!id || !name || !email) return NextResponse.json({ message: "Data pengguna tidak lengkap." }, { status: 400 });
    if (password && password.length < 8) return NextResponse.json({ message: "Kata sandi baru minimal 8 karakter." }, { status: 400 });

    const rows = await getAll<UserRow>("pengguna");
    const current = rows.find((row) => Number(row.id) === id && operationalUser(row));
    if (!current) return NextResponse.json({ message: "Pengguna tidak ditemukan." }, { status: 404 });
    if (await duplicateUser(email, phone, id)) return NextResponse.json({ message: "Email atau nomor telepon sudah digunakan." }, { status: 400 });

    const patch: Record<string, unknown> = { name, email, phone, status };
    if (password) patch.password = hashPassword(password);
    await updateById("pengguna", id, patch);
    return NextResponse.json({ message: "Pengguna berhasil diperbarui." });
  } catch (error) {
    console.error("Admin update user:", error);
    return NextResponse.json({ message: "Operasi pengguna gagal diproses." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await adminOnly(request))) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ message: "ID pengguna tidak valid." }, { status: 400 });
    const rows = await getAll<UserRow>("pengguna");
    const current = rows.find((row) => Number(row.id) === id && operationalUser(row));
    if (!current) return NextResponse.json({ message: "Pengguna tidak ditemukan." }, { status: 404 });
    const removed = await deleteById("pengguna", id);
    if (!removed) return NextResponse.json({ message: "Pengguna tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ message: "Pengguna berhasil dihapus." });
  } catch (error) {
    console.error("Admin delete user:", error);
    return NextResponse.json({ message: "Pengguna tidak dapat dihapus." }, { status: 409 });
  }
}
