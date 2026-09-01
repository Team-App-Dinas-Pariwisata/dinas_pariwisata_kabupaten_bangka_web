import { NextResponse } from "next/server";
import { getAll, isTruthyDb, type DbRecord } from "@/lib/realtime-db";

export const runtime = "nodejs";

function recordYear(record: DbRecord) {
  const value = record.tanggal_verifikasi ?? record.created_at;
  if (value === null || value === undefined || value === "") return null;

  const match = String(value).match(/^(\d{4})/);
  if (!match) return null;

  const year = Number(match[1]);
  return Number.isSafeInteger(year) && year >= 1900 && year <= 9999 ? year : null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedYearText = searchParams.get("tahun")?.trim() ?? "";
    const requestedYear = /^\d{4}$/.test(requestedYearText) ? Number(requestedYearText) : null;

    const [kecamatanRaw, subsektorRaw, ekraf] = await Promise.all([
      getAll<DbRecord>("master_kecamatan"),
      getAll<DbRecord>("master_subsektor_ekraf"),
      getAll<DbRecord>("pengajuan_ekraf"),
    ]);

    const approvedAll = ekraf.filter((record) => String(record.status ?? "") === "Disetujui");
    const years = Array.from(
      new Set(approvedAll.map((record) => recordYear(record)).filter((year): year is number => year !== null)),
    ).sort((a, b) => b - a);

    const approved = requestedYear === null
      ? approvedAll
      : approvedAll.filter((record) => recordYear(record) === requestedYear);

    const kecamatan = kecamatanRaw
      .filter((record) => isTruthyDb(record.aktif))
      .map((record) => ({
        id: Number(record.id),
        label: String(record.nama_kecamatan ?? ""),
        total: approved.filter(
          (item) => Number(item.kecamatan_usaha_id ?? item.kecamatan_id) === Number(record.id),
        ).length,
      }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "id"));

    const subsektor = subsektorRaw
      .filter((record) => isTruthyDb(record.aktif))
      .map((record) => ({
        id: Number(record.id),
        label: String(record.nama_subsektor ?? ""),
        total: approved.filter((item) => Number(item.subsektor_id) === Number(record.id)).length,
      }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "id"));

    return NextResponse.json({
      total: approved.length,
      kecamatan,
      subsektor,
      years,
      selectedYear: requestedYear,
    });
  } catch (error) {
    console.error("Public ekraf statistics error:", error);
    return NextResponse.json(
      { message: "Statistik Pelaku Ekraf belum dapat dimuat." },
      { status: 500 },
    );
  }
}
