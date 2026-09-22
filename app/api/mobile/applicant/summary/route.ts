import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { getAll, type DbRecord } from "@/lib/realtime-db";

const editable = (s: string) => ["Menunggu", "Perlu Perbaikan", "Ditolak"].includes(s);

export async function GET(request: NextRequest) {
  const user = await requireRequestRole(request, "pengaju");
  if (!user) return NextResponse.json({ message: "Sesi akun pengaju tidak valid." }, { status: 401 });

  try {
    const userId = Number(user.id);
    const [allEkraf, allSdm, allKomunitas] = await Promise.all([
      getAll<DbRecord>("pengajuan_ekraf"),
      getAll<DbRecord>("pengajuan_sdm_pariwisata"),
      getAll<DbRecord>("pengajuan_komunitas_asosiasi"),
    ]);

    const userEkraf = allEkraf.filter((r) => Number(r.created_by) === userId);
    const userSdm = allSdm.filter((r) => Number(r.created_by) === userId);
    const userKomunitas = allKomunitas.filter((r) => Number(r.created_by) === userId);

    const mapEkraf = userEkraf.map((r) => {
      const status = String(r.status || "Menunggu");
      return {
        id: Number(r.id),
        type: "ekraf" as const,
        typeLabel: "Pelaku Ekraf",
        title: String(r.nama_usaha || "Pengajuan"),
        noRegistrasi: String(r.no_registrasi || "—"),
        status,
        createdAt: String(r.created_at || ""),
        canEdit: editable(status),
      };
    });

    const mapSdm = userSdm.map((r) => {
      const status = String(r.status_pengajuan || "Menunggu");
      return {
        id: Number(r.id),
        type: "sdm" as const,
        typeLabel: "SDM Pariwisata",
        title: String(r.tempat_bertugas || r.nama_lengkap || "Pengajuan"),
        noRegistrasi: String(r.no_registrasi || "—"),
        status,
        createdAt: String(r.created_at || ""),
        canEdit: editable(status),
      };
    });

    const mapKomunitas = userKomunitas.map((r) => {
      const status = String(r.status_pengajuan || "Menunggu");
      return {
        id: Number(r.id),
        type: "komunitas" as const,
        typeLabel: "Komunitas",
        title: String(r.nama_organisasi || "Pengajuan"),
        noRegistrasi: String(r.no_registrasi || "—"),
        status,
        createdAt: String(r.created_at || ""),
        canEdit: editable(status),
      };
    });

    const items = [...mapEkraf, ...mapSdm, ...mapKomunitas].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      data: {
        total: items.length,
        pending: items.filter((x) => ["Menunggu", "Perlu Perbaikan"].includes(x.status)).length,
        approved: items.filter((x) => x.status === "Disetujui").length,
        items,
      },
    });
  } catch (error) {
    console.error("mobile applicant summary", error);
    return NextResponse.json({ message: "Riwayat pengajuan belum dapat dimuat." }, { status: 500 });
  }
}

