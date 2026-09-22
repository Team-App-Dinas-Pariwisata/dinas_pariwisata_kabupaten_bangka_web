import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { createNumeric, deleteById, findOne, getAll, getById, updateById, type DbRecord } from "@/lib/realtime-db";
import { hashPassword } from "@/lib/password";

type UserRow = DbRecord & {
  id: number;
  role: string;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive";
  last_login_at: string | null;
  created_at: string;
};

const OPERATIONAL_ROLES = ["operator", "verifikator", "petugas"];

async function adminOnly(request: NextRequest) {
  return requireRequestRole(request, "admin");
}

export async function GET(request: NextRequest) {
  if (!(await adminOnly(request))) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const rows = await getAll<UserRow>("pengguna");
    const filtered = rows
      .filter((u) => OPERATIONAL_ROLES.includes(String(u.role ?? "")))
      .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
    return NextResponse.json({ data: filtered });
  } catch (error) {
    console.error("[admin users GET error]", error);
    return NextResponse.json({ message: "Gagal memuat data petugas." }, { status: 500 });
  }
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

    const existing = await findOne<UserRow>("pengguna", (u) => String(u.email ?? "").trim().toLowerCase() === email);
    if (existing) {
      return NextResponse.json({ message: "Email sudah digunakan." }, { status: 400 });
    }

    const newId = await createNumeric("pengguna", {
      role: "petugas",
      name,
      email,
      phone,
      password: hashPassword(password),
      status,
    });

    return NextResponse.json({ message: "Petugas berhasil dibuat.", id: newId }, { status: 201 });
  } catch (error) {
    console.error("[admin users POST error]", error);
    return NextResponse.json({ message: "Gagal membuat akun petugas." }, { status: 400 });
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

    if (!id || !name || !email) return NextResponse.json({ message: "Data petugas tidak lengkap." }, { status: 400 });
    if (password && password.length < 8) return NextResponse.json({ message: "Kata sandi baru minimal 8 karakter." }, { status: 400 });

    const existing = await getById<UserRow>("pengguna", id);
    if (!existing || !OPERATIONAL_ROLES.includes(String(existing.role ?? ""))) {
      return NextResponse.json({ message: "Petugas tidak ditemukan." }, { status: 404 });
    }

    const duplicateEmail = await findOne<UserRow>(
      "pengguna",
      (u) => Number(u.id) !== id && String(u.email ?? "").trim().toLowerCase() === email,
    );
    if (duplicateEmail) {
      return NextResponse.json({ message: "Email sudah digunakan oleh akun lain." }, { status: 400 });
    }

    const patch: Record<string, unknown> = { name, email, phone, status };
    if (password) {
      patch.password = hashPassword(password);
    }

    await updateById("pengguna", id, patch);
    return NextResponse.json({ message: "Petugas berhasil diperbarui." });
  } catch (error) {
    console.error("[admin users PATCH error]", error);
    return NextResponse.json({ message: "Gagal memperbarui data petugas." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await adminOnly(request))) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ message: "ID petugas tidak valid." }, { status: 400 });

    const existing = await getById<UserRow>("pengguna", id);
    if (!existing || !OPERATIONAL_ROLES.includes(String(existing.role ?? ""))) {
      return NextResponse.json({ message: "Petugas tidak ditemukan." }, { status: 404 });
    }

    await deleteById("pengguna", id);
    return NextResponse.json({ message: "Petugas berhasil dihapus." });
  } catch (error) {
    console.error("[admin users DELETE error]", error);
    return NextResponse.json({ message: "Petugas gagal dihapus." }, { status: 409 });
  }
}
