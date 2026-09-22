import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { notifySubmissionDecision } from "@/lib/submission-notifications";
import { notifyApplicantDecision, notifyVerificationAction } from "@/lib/notifications";
import type { SubmissionType } from "@/lib/submission-config";
import {
  byNumericId,
  createNumeric,
  dbNow,
  getAll,
  getById,
  isTruthyDb,
  updateById,
  type DbRecord,
} from "@/lib/realtime-db";
import { deleteSubmissionsWithManagedFiles, isSubmissionType } from "@/lib/staff-record-cleanup";
import { isPetugasMassDeleteEnabled } from "@/lib/system-settings";

function validType(value: string | null): value is SubmissionType {
  return value === "ekraf" || value === "sdm" || value === "komunitas";
}

const tableByType: Record<SubmissionType, string> = {
  ekraf: "pengajuan_ekraf",
  sdm: "pengajuan_sdm_pariwisata",
  komunitas: "pengajuan_komunitas_asosiasi",
};

function sortNewest<T extends DbRecord>(rows: T[]) {
  return rows.sort(
    (a, b) =>
      String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")) ||
      Number(b.id ?? 0) - Number(a.id ?? 0),
  );
}

async function listRows(type: SubmissionType) {
  const rows = await getAll(tableByType[type]);
  if (type === "sdm") {
    return sortNewest(rows).map((row) => ({ ...row, status_label: row.status_pengajuan ?? "Menunggu" }));
  }

  const [subsectors, districts, villages, communities] = await Promise.all([
    getAll("master_subsektor_ekraf"),
    getAll("master_kecamatan"),
    getAll("master_kelurahan"),
    getAll("master_komunitas"),
  ]);
  const s = byNumericId(subsectors);
  const k = byNumericId(districts);
  const l = byNumericId(villages);
  const c = byNumericId(communities);

  if (type === "ekraf") {
    return sortNewest(rows).map((row) => ({
      ...row,
      status_label: row.status ?? "Menunggu",
      subsektor_label: s.get(Number(row.subsektor_id))?.nama_subsektor ?? null,
      kecamatan_label: k.get(Number(row.kecamatan_id))?.nama_kecamatan ?? null,
      kelurahan_label: l.get(Number(row.kelurahan_id))?.nama_kelurahan ?? null,
      komunitas_label: c.get(Number(row.komunitas_id))?.nama_komunitas ?? null,
      kecamatan_usaha_label: k.get(Number(row.kecamatan_usaha_id))?.nama_kecamatan ?? null,
      kelurahan_usaha_label: l.get(Number(row.kelurahan_usaha_id))?.nama_kelurahan ?? null,
    }));
  }

  return sortNewest(rows).map((row) => ({
    ...row,
    status_label: row.status_pengajuan ?? "Menunggu",
    subsektor_label: s.get(Number(row.subsektor_id))?.nama_subsektor ?? null,
    kecamatan_label: k.get(Number(row.kecamatan_id))?.nama_kecamatan ?? null,
    kelurahan_label: l.get(Number(row.kelurahan_id))?.nama_kelurahan ?? null,
  }));
}

export async function GET(request: NextRequest) {
  if (!(await requireRequestRole(request, "petugas"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }
  const type = request.nextUrl.searchParams.get("type");
  if (!validType(type)) return NextResponse.json({ message: "Jenis pengajuan tidak valid." }, { status: 400 });
  try {
    const data = await listRows(type);
    const massDeleteEnabled = await isPetugasMassDeleteEnabled();
    return NextResponse.json({ data, massDeleteEnabled });
  } catch (error) {
    console.error("Submission list error:", error);
    return NextResponse.json({ message: "Data pengajuan gagal dimuat dari Firebase Realtime Database." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await requireRequestRole(request, "petugas");
  if (!user) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });

  const body = await request.json();
  const type = String(body.type ?? "");
  const id = Number(body.id);
  const action = String(body.action ?? "");
  const note = String(body.note ?? "").trim();

  if (action === "feature") {
    if (type !== "ekraf" || !id) return NextResponse.json({ message: "Permintaan unggulan tidak valid." }, { status: 400 });
    try {
      const current = await getById("pengajuan_ekraf", id);
      if (!current || String(current.status) !== "Disetujui") {
        return NextResponse.json({ message: "Hanya Pelaku Ekraf yang sudah disetujui yang dapat ditandai sebagai unggulan." }, { status: 400 });
      }
      const unggulan = Number(body.unggulan) === 1 ? 1 : 0;
      await updateById("pengajuan_ekraf", id, { unggulan, updated_by: user.id });
      return NextResponse.json({ message: unggulan ? "Pelaku Ekraf ditandai sebagai unggulan." : "Status unggulan Pelaku Ekraf dihapus." });
    } catch (error) {
      console.error("Submission feature error:", error);
      return NextResponse.json({ message: "Status unggulan gagal disimpan ke Firebase Realtime Database." }, { status: 500 });
    }
  }

  if (!validType(type) || !id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ message: "Permintaan verifikasi tidak valid." }, { status: 400 });
  }
  if (action === "reject" && !note) {
    return NextResponse.json({ message: "Alasan penolakan wajib diisi." }, { status: 400 });
  }

  try {
    const table = tableByType[type];
    const current = await getById(table, id);
    if (!current) return NextResponse.json({ message: "Pengajuan tidak ditemukan." }, { status: 404 });

    const status: "Disetujui" | "Ditolak" = action === "approve" ? "Disetujui" : "Ditolak";
    const now = dbNow();

    if (type === "ekraf") {
      await updateById(table, id, {
        status,
        catatan_verifikasi: note || null,
        diverifikasi_oleh: user.id,
        tanggal_verifikasi: now,
        updated_by: user.id,
        unggulan: status === "Disetujui" ? Number(current.unggulan ?? 0) : 0,
      });
    } else if (type === "sdm") {
      const publish = status === "Disetujui" && isTruthyDb(current.persetujuan_publikasi);
      await updateById(table, id, {
        status_pengajuan: status,
        catatan_verifikasi: note || null,
        alasan_penolakan: action === "reject" ? note : null,
        diverifikasi_oleh: user.id,
        tanggal_verifikasi: now,
        updated_by: user.id,
        dipublikasikan: publish ? 1 : 0,
        tanggal_publikasi: publish ? (current.tanggal_publikasi ?? now) : null,
      });
    } else {
      let masterId = current.master_komunitas_id == null ? null : Number(current.master_komunitas_id);
      if (action === "approve" && !masterId) {
        masterId = await createNumeric("master_komunitas", {
          nama_komunitas: current.nama_organisasi ?? "Komunitas",
          ketua: current.nama_ketua ?? null,
          no_hp: current.no_hp_ketua ?? null,
          email: current.email ?? null,
          alamat: current.alamat ?? null,
          keterangan: current.rincian ?? null,
          aktif: 1,
        });
      }
      const publish = status === "Disetujui" && isTruthyDb(current.persetujuan_publikasi);
      await updateById(table, id, {
        status_pengajuan: status,
        catatan_verifikasi: note || null,
        alasan_penolakan: action === "reject" ? note : null,
        diverifikasi_oleh: user.id,
        tanggal_verifikasi: now,
        updated_by: user.id,
        master_komunitas_id: masterId,
        dipublikasikan: publish ? 1 : 0,
        tanggal_publikasi: publish ? (current.tanggal_publikasi ?? now) : null,
      });
    }

    await notifySubmissionDecision({ type, id, status, note });

    const applicantUserId = Number(current.user_id);
    if (Number.isSafeInteger(applicantUserId) && applicantUserId > 0) {
      await notifyApplicantDecision({
        applicantUserId,
        type,
        submissionId: id,
        status: status === "Disetujui" ? "Disetujui" : "Ditolak",
        note,
        noRegistrasi: current.no_registrasi ? String(current.no_registrasi) : null,
        staffName: user.name,
      });
    }

    await notifyVerificationAction({
      type,
      submissionId: id,
      staffName: user.name,
      action: action === "approve" ? "approve" : "reject",
      noRegistrasi: current.no_registrasi ? String(current.no_registrasi) : null,
    });

    return NextResponse.json({ message: action === "approve" ? "Pengajuan berhasil disetujui." : "Pengajuan berhasil ditolak." });
  } catch (error) {
    console.error("Submission verify error:", error);
    return NextResponse.json({ message: "Verifikasi gagal disimpan ke Firebase Realtime Database." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await requireRequestRole(request, "petugas");
  if (!user) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });

  const isEnabled = await isPetugasMassDeleteEnabled();
  if (!isEnabled) {
    return NextResponse.json(
      { message: "Fitur hapus pengajuan sedang dinonaktifkan oleh Administrator." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const type = body.type;

    if (!isSubmissionType(type)) {
      return NextResponse.json({ message: "Jenis pengajuan tidak valid." }, { status: 400 });
    }

    let idsToDelete: number[] = [];
    if (Array.isArray(body.ids)) {
      idsToDelete = body.ids
        .map((id: unknown) => Number(id))
        .filter((id: number) => Number.isSafeInteger(id) && id > 0);
    } else if (body.id) {
      const singleId = Number(body.id);
      if (Number.isSafeInteger(singleId) && singleId > 0) {
        idsToDelete = [singleId];
      }
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { message: "Pilih setidaknya satu pengajuan untuk dihapus." },
        { status: 400 },
      );
    }

    const result = await deleteSubmissionsWithManagedFiles(type, idsToDelete);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Pengajuan yang dipilih tidak ditemukan." },
        { status: 404 },
      );
    }

    const itemLabel = result.deletedCount === 1 ? "1 pengajuan" : `${result.deletedCount} pengajuan`;
    const message = result.failedFiles
      ? `${itemLabel} berhasil dihapus dari Firebase Realtime Database. Sebagian berkas Cloudflare R2 gagal dibersihkan.`
      : `${itemLabel} dan seluruh berkas terkait berhasil dihapus permanen.`;

    return NextResponse.json({
      message,
      data: result,
    });
  } catch (error) {
    console.error("Submission delete error:", error);
    return NextResponse.json(
      { message: "Pengajuan belum dapat dihapus dari Firebase Realtime Database." },
      { status: 500 },
    );
  }
}
