import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import {
  isPetugasMassDeleteEnabled,
  setPetugasMassDeleteEnabled,
} from "@/lib/system-settings";

export async function GET(request: NextRequest) {
  if (!(await requireRequestRole(request, "admin"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const petugasMassDeleteEnabled = await isPetugasMassDeleteEnabled();
    return NextResponse.json({
      data: {
        petugas_mass_delete_enabled: petugasMassDeleteEnabled,
      },
    });
  } catch (error) {
    console.error("[api/admin/settings] GET error:", error);
    return NextResponse.json({ message: "Gagal memuat pengaturan sistem." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await requireRequestRole(request, "admin"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (typeof body.petugas_mass_delete_enabled !== "boolean") {
      return NextResponse.json(
        { message: "Nilai pengaturan petugas_mass_delete_enabled harus boolean." },
        { status: 400 },
      );
    }

    await setPetugasMassDeleteEnabled(body.petugas_mass_delete_enabled);
    const updatedStatus = await isPetugasMassDeleteEnabled();

    return NextResponse.json({
      message: updatedStatus
        ? "Fitur hapus massal untuk akun petugas berhasil diaktifkan."
        : "Fitur hapus massal untuk akun petugas berhasil dinonaktifkan.",
      data: {
        petugas_mass_delete_enabled: updatedStatus,
      },
    });
  } catch (error) {
    console.error("[api/admin/settings] PATCH error:", error);
    return NextResponse.json({ message: "Gagal menyimpan pengaturan sistem." }, { status: 500 });
  }
}
