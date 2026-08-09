import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { requireRequestRole } from "@/lib/auth";
import { db } from "@/lib/db";
import type { SubmissionType } from "@/lib/submission-config";

const listQueries: Record<SubmissionType, string> = {
  ekraf: `
    SELECT p.*,
      COALESCE(p.status, 'Menunggu') AS status_label,
      s.nama_subsektor AS subsektor_label,
      kd.nama_kecamatan AS kecamatan_label,
      ld.nama_kelurahan AS kelurahan_label,
      ku.nama_komunitas AS komunitas_label,
      ku2.nama_kecamatan AS kecamatan_usaha_label,
      lu2.nama_kelurahan AS kelurahan_usaha_label
    FROM pengajuan_ekraf p
    LEFT JOIN master_subsektor_ekraf s ON s.id = p.subsektor_id
    LEFT JOIN master_kecamatan kd ON kd.id = p.kecamatan_id
    LEFT JOIN master_kelurahan ld ON ld.id = p.kelurahan_id
    LEFT JOIN master_komunitas ku ON ku.id = p.komunitas_id
    LEFT JOIN master_kecamatan ku2 ON ku2.id = p.kecamatan_usaha_id
    LEFT JOIN master_kelurahan lu2 ON lu2.id = p.kelurahan_usaha_id
    ORDER BY p.created_at DESC`,
  sdm: `
    SELECT p.*, p.status_pengajuan AS status_label
    FROM pengajuan_sdm_pariwisata p
    ORDER BY p.created_at DESC`,
  komunitas: `
    SELECT p.*, p.status_pengajuan AS status_label,
      s.nama_subsektor AS subsektor_label,
      k.nama_kecamatan AS kecamatan_label,
      l.nama_kelurahan AS kelurahan_label
    FROM pengajuan_komunitas_asosiasi p
    LEFT JOIN master_subsektor_ekraf s ON s.id = p.subsektor_id
    LEFT JOIN master_kecamatan k ON k.id = p.kecamatan_id
    LEFT JOIN master_kelurahan l ON l.id = p.kelurahan_id
    ORDER BY p.created_at DESC`,
};

function validType(value: string | null): value is SubmissionType {
  return value === "ekraf" || value === "sdm" || value === "komunitas";
}

export async function GET(request: NextRequest) {
  if (!(await requireRequestRole(request, "pengguna"))) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }
  const type = request.nextUrl.searchParams.get("type");
  if (!validType(type)) return NextResponse.json({ message: "Jenis pengajuan tidak valid." }, { status: 400 });
  try {
    const [rows] = await db().query<RowDataPacket[]>(listQueries[type]);
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Submission list error:", error);
    return NextResponse.json({ message: "Data pengajuan gagal dimuat dari database." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await requireRequestRole(request, "pengguna");
  if (!user) return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });

  const body = await request.json();
  const type = String(body.type ?? "");
  const id = Number(body.id);
  const action = String(body.action ?? "");
  const note = String(body.note ?? "").trim();
  if (!validType(type) || !id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ message: "Permintaan verifikasi tidak valid." }, { status: 400 });
  }
  if (action === "reject" && !note) {
    return NextResponse.json({ message: "Alasan penolakan wajib diisi." }, { status: 400 });
  }

  const connection = await db().getConnection();
  try {
    await connection.beginTransaction();
    const status = action === "approve" ? "Disetujui" : "Ditolak";

    if (type === "ekraf") {
      const [result] = await connection.execute<ResultSetHeader>(
        "UPDATE pengajuan_ekraf SET status = ?, catatan_verifikasi = ?, diverifikasi_oleh = ?, tanggal_verifikasi = NOW(), updated_by = ? WHERE id = ?",
        [status, note || null, user.id, user.id, id],
      );
      if (!result.affectedRows) throw new Error("NOT_FOUND");
    }

    if (type === "sdm") {
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE pengajuan_sdm_pariwisata
         SET status_pengajuan = ?, catatan_verifikasi = ?, alasan_penolakan = ?, diverifikasi_oleh = ?, tanggal_verifikasi = NOW(), updated_by = ?,
             dipublikasikan = CASE WHEN ? = 'Disetujui' AND persetujuan_publikasi = 1 THEN 1 ELSE 0 END,
             tanggal_publikasi = CASE WHEN ? = 'Disetujui' AND persetujuan_publikasi = 1 THEN COALESCE(tanggal_publikasi, NOW()) ELSE NULL END
         WHERE id = ?`,
        [status, note || null, action === "reject" ? note : null, user.id, user.id, status, status, id],
      );
      if (!result.affectedRows) throw new Error("NOT_FOUND");
    }

    if (type === "komunitas") {
      const [rows] = await connection.execute<(RowDataPacket & {
        master_komunitas_id: number | null;
        nama_organisasi: string;
        nama_ketua: string;
        no_hp_ketua: string;
        email: string;
        alamat: string;
        rincian: string | null;
      })[]>(
        "SELECT master_komunitas_id, nama_organisasi, nama_ketua, no_hp_ketua, email, alamat, rincian FROM pengajuan_komunitas_asosiasi WHERE id = ? FOR UPDATE",
        [id],
      );
      const current = rows[0];
      if (!current) throw new Error("NOT_FOUND");

      let masterId = current.master_komunitas_id;
      if (action === "approve" && !masterId) {
        const [master] = await connection.execute<ResultSetHeader>(
          "INSERT INTO master_komunitas (nama_komunitas, ketua, no_hp, email, alamat, keterangan, aktif) VALUES (?, ?, ?, ?, ?, ?, 1)",
          [current.nama_organisasi, current.nama_ketua, current.no_hp_ketua, current.email, current.alamat, current.rincian],
        );
        masterId = master.insertId;
      }

      await connection.execute(
        `UPDATE pengajuan_komunitas_asosiasi
         SET status_pengajuan = ?, catatan_verifikasi = ?, alasan_penolakan = ?, diverifikasi_oleh = ?, tanggal_verifikasi = NOW(), updated_by = ?,
             master_komunitas_id = ?,
             dipublikasikan = CASE WHEN ? = 'Disetujui' AND persetujuan_publikasi = 1 THEN 1 ELSE 0 END,
             tanggal_publikasi = CASE WHEN ? = 'Disetujui' AND persetujuan_publikasi = 1 THEN COALESCE(tanggal_publikasi, NOW()) ELSE NULL END
         WHERE id = ?`,
        [status, note || null, action === "reject" ? note : null, user.id, user.id, masterId, status, status, id],
      );
    }

    await connection.commit();
    return NextResponse.json({ message: action === "approve" ? "Pengajuan berhasil disetujui." : "Pengajuan berhasil ditolak." });
  } catch (error) {
    await connection.rollback();
    console.error("Submission verify error:", error);
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Pengajuan tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ message: "Verifikasi gagal disimpan ke database." }, { status: 500 });
  } finally {
    connection.release();
  }
}
