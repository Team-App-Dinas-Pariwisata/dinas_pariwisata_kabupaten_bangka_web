import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { getAll } from "@/lib/realtime-db";
import type { NotificationRow } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  if (!(await requireRequestRole(request, "admin"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.max(1, Math.min(Number(searchParams.get("pageSize")) || 10, 100));
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const role = (searchParams.get("role") || "").trim();
  const jenis = (searchParams.get("jenis") || "").trim();
  const tipe = (searchParams.get("tipe") || "").trim();

  try {
    const all = await getAll<NotificationRow>("notifikasi");

    // Filter data
    const filtered = all.filter((n) => {
      if (role && role !== "all" && n.target_role !== role) return false;
      if (jenis && jenis !== "all" && n.jenis !== jenis) return false;
      if (tipe && tipe !== "all" && n.referensi_tipe !== tipe) return false;
      if (search) {
        const matchTitle = (n.judul || "").toLowerCase().includes(search);
        const matchMsg = (n.pesan || "").toLowerCase().includes(search);
        const matchSender = (n.pengirim_nama || "").toLowerCase().includes(search);
        if (!matchTitle && !matchMsg && !matchSender) return false;
      }
      return true;
    });

    // Urutkan newest first
    filtered.sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")) || Number(b.id) - Number(a.id));

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const offset = (page - 1) * pageSize;
    const paged = filtered.slice(offset, offset + pageSize);

    // Hitung stats dari keseluruhan data
    const stats = {
      total: all.length,
      pengajuanBaru: all.filter((n) => n.jenis === "pengajuan_baru").length,
      pengajuanDiperbaiki: all.filter((n) => n.jenis === "pengajuan_diperbaiki").length,
      verifikasi: all.filter((n) => n.jenis === "verifikasi").length,
    };

    return NextResponse.json({
      data: paged,
      total,
      page,
      pageSize,
      totalPages,
      stats,
    });
  } catch (error) {
    console.error("[api/admin/notifications] GET error:", error);
    return NextResponse.json({ message: "Gagal memuat riwayat notifikasi." }, { status: 500 });
  }
}
