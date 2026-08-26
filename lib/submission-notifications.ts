// lib/submission-notifications.ts
import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendEmail } from "@/lib/email";
import type { SubmissionType } from "@/lib/submission-config";

export type SubmissionDecisionStatus = "Disetujui" | "Ditolak";

type NotificationRow = RowDataPacket & {
  no_hp: string | null;
  email: string | null;
  nama: string;
  no_registrasi: string | null;
};

const typeLabel: Record<SubmissionType, string> = {
  ekraf: "Pelaku Ekonomi Kreatif",
  sdm: "SDM Pariwisata",
  komunitas: "Komunitas/Asosiasi",
};

const notificationQueries: Record<SubmissionType, string> = {
  ekraf: "SELECT no_hp, email, nama_lengkap AS nama, no_registrasi FROM pengajuan_ekraf WHERE id = ? LIMIT 1",
  sdm: "SELECT no_hp, email, nama_lengkap AS nama, no_registrasi FROM pengajuan_sdm_pariwisata WHERE id = ? LIMIT 1",
  komunitas: "SELECT no_hp_ketua AS no_hp, email, nama_ketua AS nama, no_registrasi FROM pengajuan_komunitas_asosiasi WHERE id = ? LIMIT 1",
};

function appBaseUrl(): string | null {
  const url = process.env.APP_BASE_URL?.trim().replace(/\/+$/, "");
  return url ? url : null;
}

function buildPlainText(params: {
  type: SubmissionType;
  status: SubmissionDecisionStatus;
  nama: string;
  noRegistrasi: string | null;
  note: string;
}): string {
  const { type, status, nama, noRegistrasi, note } = params;
  const label = typeLabel[type];
  const baseUrl = appBaseUrl();
  const regLine = noRegistrasi ? `No. Registrasi: ${noRegistrasi}` : null;

  if (status === "Disetujui") {
    return [
      `Halo ${nama},`,
      "",
      `Pengajuan ${label} Anda di Si Parik telah DISETUJUI oleh Dinas Pariwisata.`,
      regLine,
      note ? `Catatan petugas: ${note}` : null,
      baseUrl ? `Cek detailnya di: ${baseUrl}/akun` : null,
      "",
      "Terima kasih telah mendaftar melalui Si Parik.",
    ].filter(Boolean).join("\n");
  }

  return [
    `Halo ${nama},`,
    "",
    `Mohon maaf, pengajuan ${label} Anda di Si Parik DITOLAK oleh Dinas Pariwisata.`,
    regLine,
    `Alasan: ${note || "Tidak disertakan alasan spesifik oleh petugas."}`,
    baseUrl
      ? `Anda dapat memperbaiki dan mengajukan kembali melalui ${baseUrl}/akun.`
      : "Anda dapat memperbaiki dan mengajukan kembali melalui portal Si Parik.",
    "",
    "Terima kasih atas pengertiannya.",
  ].filter(Boolean).join("\n");
}

function buildEmailHtml(params: {
  type: SubmissionType;
  status: SubmissionDecisionStatus;
  nama: string;
  noRegistrasi: string | null;
  note: string;
}): string {
  const { type, status, nama, noRegistrasi, note } = params;
  const label = typeLabel[type];
  const baseUrl = appBaseUrl();
  const logoUrl = "https://i.ibb.co.com/pjVjqBMp/logo-si-parik-preloader-compressed.png";
  const regLine = noRegistrasi ? `No. Registrasi: ${noRegistrasi}` : null;

  const isApproved = status === "Disetujui";
  const statusColor = isApproved ? "#2a9d6f" : "#d9534f";
  const statusBg = isApproved ? "#e6f7ed" : "#fdecea";
  const statusEmoji = isApproved ? "✅" : "❌";

  const noteHtml = note
    ? `<p style="margin:16px 0;padding:12px;background:#f4f6f8;border-left:4px solid #2c5f8a;border-radius:6px;">${note}</p>`
    : "";

  return `
  <!DOCTYPE html>
  <html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Notifikasi Pengajuan SI PARIK BANGKA</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fa;padding:30px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
            <!-- Header dengan logo -->
            <tr>
              <td style="background:linear-gradient(135deg,#1a3b52 0%,#2c5f8a 100%);padding:30px;text-align:center;">
                <img src="${logoUrl}" alt="SI PARIK BANGKA" width="180" style="display:block;margin:0 auto;max-height:80px;object-fit:contain;" />
                <h1 style="color:#ffffff;font-size:22px;margin:12px 0 0;font-weight:bold;">Notifikasi Pengajuan</h1>
              </td>
            </tr>
            <!-- Isi -->
            <tr>
              <td style="padding:40px 30px;">
                <h2 style="color:#1a3b52;font-size:20px;margin-top:0;">Halo, ${nama} 👋</h2>
                <p style="font-size:16px;line-height:1.6;color:#444444;">
                  Kami ingin menginformasikan bahwa pengajuan <strong>${label}</strong> Anda
                  telah berstatus <strong style="color:${statusColor};">${status}</strong>.
                </p>
                ${regLine ? `<p style="font-size:14px;color:#666666;">${regLine}</p>` : ""}
                ${noteHtml}
                <div style="margin:24px 0;padding:16px;background:#f8f9fa;border-radius:10px;border:1px solid #eaecef;font-size:14px;color:#333;">
                  ${
                    isApproved
                      ? "Pengajuan Anda telah disetujui. Anda dapat memantau statusnya melalui akun Anda."
                      : "Mohon maaf, pengajuan Anda belum disetujui. Silakan perbaiki dan ajukan kembali melalui akun Anda."
                  }
                </div>
                ${baseUrl ? `
                  <a href="${baseUrl}/akun" style="display:inline-block;background:${statusColor};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;margin-top:8px;">
                    Buka Akun Saya
                  </a>
                ` : ""}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f0f4f8;padding:20px;text-align:center;font-size:12px;color:#777777;">
                &copy; 2026 SI PARIK BANGKA Kabupaten Bangka<br/>
                Dinas Pariwisata dan Kebudayaan Kabupaten Bangka
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

function isWhatsAppDisabled(): boolean {
  return process.env.DISABLE_WHATSAPP_NOTIFICATIONS === "true"
    || process.env.NOTIF_CHANNEL === "email";
}

/**
 * Mengirim notifikasi ke pemohon setelah pengajuannya disetujui/ditolak.
 * WhatsApp dan email dikirim secara independen jika masing-masing kanal tersedia.
 */
export async function notifySubmissionDecision(params: {
  type: SubmissionType;
  id: number;
  status: SubmissionDecisionStatus;
  note: string;
}): Promise<void> {
  try {
    const [rows] = await db().query<NotificationRow[]>(notificationQueries[params.type], [params.id]);
    const row = rows[0];

    if (!row) {
      console.warn(`[notif] Data pengajuan ${params.type}#${params.id} tidak ditemukan.`);
      return;
    }

    const plainText = buildPlainText({
      type: params.type,
      status: params.status,
      nama: row.nama,
      noRegistrasi: row.no_registrasi,
      note: params.note,
    });

    const html = buildEmailHtml({
      type: params.type,
      status: params.status,
      nama: row.nama,
      noRegistrasi: row.no_registrasi,
      note: params.note,
    });

    // WhatsApp aktif & nomor tersedia
    if (!isWhatsAppDisabled() && row.no_hp && row.no_hp.trim()) {
      const waResult = await sendWhatsAppMessage(row.no_hp, plainText);
      if (waResult.ok) {
        console.log(`[notif] WhatsApp terkirim ke ${row.no_hp} untuk ${params.type}#${params.id}`);
      } else {
        console.warn(`[notif] WhatsApp gagal: ${waResult.reason}. Email tetap akan dicoba.`);
      }
    } else {
      console.log(`[notif] WhatsApp dinonaktifkan / nomor kosong. Email tetap akan dicoba.`);
    }

    // Email selalu dicoba, terlepas dari hasil pengiriman WhatsApp.
    if (row.email && row.email.trim()) {
      try {
        await sendEmail({
          to: row.email,
          subject: `Notifikasi Pengajuan ${typeLabel[params.type]} - ${params.status}`,
          text: plainText,
          html,
        });
        console.log(`[notif] Email terkirim ke ${row.email} untuk ${params.type}#${params.id}`);
      } catch (emailError) {
        console.error(`[notif] Gagal kirim email ke ${row.email}:`, emailError);
      }
    } else {
      console.warn(`[notif] Alamat email tidak tersedia untuk ${params.type}#${params.id}.`);
    }
  } catch (error) {
    console.error(`[notif] Terjadi error saat memproses notifikasi untuk ${params.type}#${params.id}:`, error);
  }
}
