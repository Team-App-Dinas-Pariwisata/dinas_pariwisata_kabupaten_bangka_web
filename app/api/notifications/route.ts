import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { getNotifications, getUnreadCount, markAllAsRead, markAsRead } from "@/lib/notifications";

/**
 * GET /api/notifications
 * Mengembalikan daftar notifikasi + jumlah belum dibaca untuk user yang sedang login.
 * Hanya role admin dan petugas yang bisa mengakses.
 */
export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || (user.role !== "admin" && user.role !== "petugas")) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      getNotifications(user.role, 50),
      getUnreadCount(user.role),
    ]);

    return NextResponse.json({ data: notifications, unreadCount });
  } catch (error) {
    console.error("[api/notifications] GET error:", error);
    return NextResponse.json({ message: "Gagal memuat notifikasi." }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Mark notifikasi sebagai sudah dibaca.
 * Body: { id: number } untuk satu notifikasi, atau { all: true } untuk semua.
 */
export async function PATCH(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || (user.role !== "admin" && user.role !== "petugas")) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (body.all === true) {
      const affected = await markAllAsRead(user.role);
      return NextResponse.json({ message: `${affected} notifikasi ditandai sudah dibaca.` });
    }

    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "ID notifikasi tidak valid." }, { status: 400 });
    }

    const updated = await markAsRead(id);
    if (!updated) {
      return NextResponse.json({ message: "Notifikasi tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ message: "Notifikasi ditandai sudah dibaca." });
  } catch (error) {
    console.error("[api/notifications] PATCH error:", error);
    return NextResponse.json({ message: "Gagal memperbarui notifikasi." }, { status: 500 });
  }
}
