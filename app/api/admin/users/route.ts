import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

type UserRow = RowDataPacket & {
  id: number;
  role: string;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive";
  last_login_at: string | null;
  created_at: string;
};

type ColumnRow = RowDataPacket & { Type: string };

async function adminOnly(request: NextRequest) {
  return requireRequestRole(request, "admin");
}

async function preferredOperationalRole() {
  const [rows] = await db().query<ColumnRow[]>("SHOW COLUMNS FROM pengguna LIKE 'role'");
  const type = String(rows[0]?.Type ?? "");
  if (type.includes("'operator'")) return "operator";
  if (type.includes("'pengguna'")) return "pengguna";
  throw new Error("Role pengguna/operator tidak tersedia pada tabel pengguna.");
}

function dbMessage(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "ER_DUP_ENTRY") return "Email atau nomor telepon sudah digunakan.";
  if (code === "ER_ROW_IS_REFERENCED_2") return "Pengguna masih terhubung dengan data lain dan tidak dapat dihapus.";
  return error instanceof Error && error.message.includes("Role pengguna") ? error.message : "Operasi pengguna gagal diproses.";
}

export async function GET(request: NextRequest) {
  if (!(await adminOnly(request))) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  const [rows] = await db().execute<UserRow[]>(
    "SELECT id, role, name, email, phone, status, last_login_at, created_at FROM pengguna WHERE role IN ('operator','verifikator','pengguna') ORDER BY created_at DESC",
  );
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
    const role = await preferredOperationalRole();
    const [result] = await db().execute<ResultSetHeader>(
      "INSERT INTO pengguna (role, name, email, phone, password, status) VALUES (?, ?, ?, ?, ?, ?)",
      [role, name, email, phone, hashPassword(password), status],
    );
    return NextResponse.json({ message: "Pengguna berhasil dibuat.", id: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: dbMessage(error) }, { status: 400 });
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

    const roleFilter = "role IN ('operator','verifikator','pengguna')";
    if (password) {
      await db().execute(
        `UPDATE pengguna SET name = ?, email = ?, phone = ?, password = ?, status = ? WHERE id = ? AND ${roleFilter}`,
        [name, email, phone, hashPassword(password), status, id],
      );
    } else {
      await db().execute(
        `UPDATE pengguna SET name = ?, email = ?, phone = ?, status = ? WHERE id = ? AND ${roleFilter}`,
        [name, email, phone, status, id],
      );
    }
    return NextResponse.json({ message: "Pengguna berhasil diperbarui." });
  } catch (error) {
    return NextResponse.json({ message: dbMessage(error) }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await adminOnly(request))) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ message: "ID pengguna tidak valid." }, { status: 400 });
    const [result] = await db().execute<ResultSetHeader>(
      "DELETE FROM pengguna WHERE id = ? AND role IN ('operator','verifikator','pengguna')",
      [id],
    );
    if (!result.affectedRows) return NextResponse.json({ message: "Pengguna tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ message: "Pengguna berhasil dihapus." });
  } catch (error) {
    return NextResponse.json({ message: dbMessage(error) }, { status: 409 });
  }
}
