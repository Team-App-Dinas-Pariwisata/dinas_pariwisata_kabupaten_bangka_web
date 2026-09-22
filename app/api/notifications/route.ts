import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { getNotifications, getUnreadCount, markAllAsRead, markAsRead } from "@/lib/notifications";

/**
 * GET /api/notifications
 * Mengembalikan daftar notifikasi + jumlah belum dibaca untuk user yang sedang login.
 * Mendukung role admin, petugas, dan pengaju.
 */
export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !["admin", "petugas", "pengaju"].includes(user.role)) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const isApplicant = user.role === "pengaju";
    const [notifications, unreadCount] = await Promise.all([
      getNotifications(user.role, 50, isApplicant ? user.id : undefined),
      getUnreadCount(user.role, isApplicant ? user.id : undefined),
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
  if (!user || !["admin", "petugas", "pengaju"].includes(user.role)) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const isApplicant = user.role === "pengaju";

    if (body.all === true) {
      const affected = await markAllAsRead(user.role, isApplicant ? user.id : undefined);
      return NextResponse.json({ message: `${affected} notifikasi ditandai sudah dibaca.` });
    }

    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "ID notifikasi tidak valid." }, { status: 400 });
    }

    const updated = await markAsRead(id, isApplicant ? user.id : undefined, user.role);
    if (!updated) {
      return NextResponse.json({ message: "Notifikasi tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ message: "Notifikasi ditandai sudah dibaca." });
  } catch (error) {
    console.error("[api/notifications] PATCH error:", error);
    return NextResponse.json({ message: "Gagal memperbarui notifikasi." }, { status: 500 });
  }
}
