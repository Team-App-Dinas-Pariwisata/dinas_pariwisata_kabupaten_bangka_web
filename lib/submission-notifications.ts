// lib/submission-notifications.ts
import { getById, type DbRecord } from "@/lib/realtime-db";
import { sendEmail } from "@/lib/email";
import type { SubmissionType } from "@/lib/submission-config";

export type SubmissionDecisionStatus = "Disetujui" | "Ditolak";

type NotificationRow = {
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

const notificationSource: Record<SubmissionType, { table: string; phone: string; name: string }> = {
  ekraf: { table: "pengajuan_ekraf", phone: "no_hp", name: "nama_lengkap" },
  sdm: { table: "pengajuan_sdm_pariwisata", phone: "no_hp", name: "nama_lengkap" },
  komunitas: { table: "pengajuan_komunitas_asosiasi", phone: "no_hp_ketua", name: "nama_ketua" },
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
      ? `Anda dapat memperbaiki dan mengajukan kembali melalui portal Si Parik.`
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

function formatWaktuIndonesia(date = new Date()): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }) + " WIB";
}

function buildSubmissionReceiptHtml(params: {
  action: "create" | "revise";
  type: SubmissionType;
  nama: string;
  noRegistrasi: string | null;
  waktu: string;
}): string {
  const { action, type, nama, noRegistrasi, waktu } = params;
  const label = typeLabel[type];
  const baseUrl = appBaseUrl();
  const logoUrl = "https://i.ibb.co.com/pjVjqBMp/logo-si-parik-preloader-compressed.png";
  const isCreate = action === "create";

  const title = isCreate ? "Konfirmasi Pengajuan Diterima" : "Konfirmasi Perbaikan Pengajuan";
  const headline = isCreate
    ? `Terima kasih telah mengajukan data <strong>${label}</strong> melalui portal SI PARIK BANGKA.`
    : `Perbaikan data untuk pengajuan <strong>${label}</strong> Anda telah berhasil dikirimkan kembali ke SI PARIK BANGKA.`;

  const explanation = isCreate
    ? "Pengajuan Anda telah tercatat ke dalam sistem kami dan saat ini berada dalam status <strong>Menunggu Verifikasi</strong> oleh petugas verifikator Dinas Pariwisata dan Kebudayaan Kabupaten Bangka."
    : "Data yang Anda perbarui telah masuk kembali ke antrean verifikasi dengan status <strong>Menunggu Verifikasi</strong>. Petugas verifikator kami akan memeriksa kembali kelengkapan dan perbaikan data Anda.";

  const badgeColor = "#2563eb";
  const badgeBg = "#eff6ff";

  return `
  <!DOCTYPE html>
  <html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} - SI PARIK BANGKA</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f7fa;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fa;padding:30px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#1a3b52 0%,#2c5f8a 100%);padding:32px 30px;text-align:center;">
                <img src="${logoUrl}" alt="SI PARIK BANGKA" width="180" style="display:block;margin:0 auto;max-height:80px;object-fit:contain;" />
                <h1 style="color:#ffffff;font-size:22px;margin:14px 0 0;font-weight:bold;letter-spacing:-0.3px;">${title}</h1>
              </td>
            </tr>
            <!-- Konten -->
            <tr>
              <td style="padding:36px 30px;">
                <h2 style="color:#1a3b52;font-size:20px;margin-top:0;font-weight:700;">Halo, ${nama} 👋</h2>
                <p style="font-size:15px;line-height:1.6;color:#374151;margin:12px 0 20px;">
                  ${headline}
                </p>

                <!-- Kartu Rincian Pengajuan -->
                <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:20px 0;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                    <tr>
                      <td style="padding:6px 0;color:#64748b;width:140px;font-weight:600;">Kategori Data</td>
                      <td style="padding:6px 0;color:#1e293b;font-weight:700;">: ${label}</td>
                    </tr>
                    ${noRegistrasi ? `
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-weight:600;">No. Registrasi</td>
                      <td style="padding:6px 0;color:#0f766e;font-weight:700;">: <span style="background:#ccfbf1;padding:2px 8px;border-radius:4px;font-family:monospace;letter-spacing:0.5px;">${noRegistrasi}</span></td>
                    </tr>` : ""}
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-weight:600;">Status</td>
                      <td style="padding:6px 0;color:${badgeColor};font-weight:700;">: <span style="background:${badgeBg};padding:3px 10px;border-radius:6px;border:1px solid #bfdbfe;font-size:13px;">⏳ Menunggu Verifikasi</span></td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-weight:600;">Waktu Dikirim</td>
                      <td style="padding:6px 0;color:#1e293b;">: ${waktu}</td>
                    </tr>
                  </table>
                </div>

                <p style="font-size:14px;line-height:1.6;color:#475569;margin:16px 0;">
                  ${explanation}
                </p>

                <div style="margin:24px 0 28px;padding:14px 18px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:6px;font-size:13px;line-height:1.5;color:#166534;">
                  💡 <strong>Informasi:</strong> Hasil verifikasi (disetujui atau memerlukan perbaikan kembali) akan dikirimkan otomatis ke alamat email ini dan diperbarui pada dashboard akun Anda.
                </div>

                ${baseUrl ? `
                <div style="text-align:center;margin-top:24px;">
                  <a href="${baseUrl}/akun" style="display:inline-block;background:linear-gradient(135deg,#1a3b52 0%,#2c5f8a 100%);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:bold;box-shadow:0 4px 12px rgba(44,95,138,0.25);">
                    Buka Dashboard Akun Saya ↗
                  </a>
                </div>
                ` : ""}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f8fafc;padding:24px 30px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;line-height:1.6;">
                <strong>SI PARIK BANGKA</strong> — Sistem Informasi Pariwisata & Ekonomi Kreatif<br/>
                Dinas Pariwisata dan Kebudayaan Kabupaten Bangka<br/>
                <span style="color:#94a3b8;font-size:11px;">Email ini dibuat secara otomatis oleh sistem notifikasi SI PARIK. Mohon tidak membalas email ini secara langsung.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

/**
 * Mengirim notifikasi ke pemohon setelah pengajuannya disetujui/ditolak.
 */
export async function notifySubmissionDecision(params: {
  type: SubmissionType;
  id: number;
  status: SubmissionDecisionStatus;
  note: string;
}): Promise<void> {
  try {
    const source = notificationSource[params.type];
    const raw = await getById<DbRecord>(source.table, params.id);
    const row: NotificationRow | null = raw ? {
      no_hp: raw[source.phone] == null ? null : String(raw[source.phone]),
      email: raw.email == null ? null : String(raw.email),
      nama: String(raw[source.name] ?? "Pemohon"),
      no_registrasi: raw.no_registrasi == null ? null : String(raw.no_registrasi),
    } : null;

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
    }
  } catch (error) {
    console.error(`[notif] Terjadi error saat memproses notifikasi untuk ${params.type}#${params.id}:`, error);
  }
}

/**
 * Mengirim notifikasi email ke pemohon saat pengajuan baru berhasil dikirim.
 */
export async function notifyApplicantSubmissionCreated(params: {
  type: SubmissionType;
  recipientEmail: string;
  applicantName: string;
  noRegistrasi?: string | null;
  id?: number;
}): Promise<void> {
  const email = params.recipientEmail?.trim();
  if (!email) {
    console.warn(`[notif] notifyApplicantSubmissionCreated dilewati: email kosong untuk ${params.type}#${params.id ?? "new"}.`);
    return;
  }

  const label = typeLabel[params.type];
  const waktu = formatWaktuIndonesia();
  const regSuffix = params.noRegistrasi ? ` (${params.noRegistrasi})` : "";
  const baseUrl = appBaseUrl();

  const plainText = [
    `Halo ${params.applicantName},`,
    "",
    `Pengajuan ${label} Anda di SI PARIK BANGKA telah berhasil kami terima.`,
    params.noRegistrasi ? `No. Registrasi: ${params.noRegistrasi}` : null,
    "Status saat ini: Menunggu Verifikasi",
    `Waktu dikirim: ${waktu}`,
    "",
    "Tim petugas Dinas Pariwisata dan Kebudayaan Kabupaten Bangka akan memeriksa data dan berkas yang Anda kirimkan.",
    baseUrl ? `Pantau status pengajuan Anda melalui: ${baseUrl}/akun` : null,
    "",
    "Terima kasih atas partisipasi Anda.",
    "SI PARIK BANGKA - Dinas Pariwisata dan Kebudayaan Kabupaten Bangka",
  ].filter(Boolean).join("\n");

  const html = buildSubmissionReceiptHtml({
    action: "create",
    type: params.type,
    nama: params.applicantName,
    noRegistrasi: params.noRegistrasi ?? null,
    waktu,
  });

  try {
    await sendEmail({
      to: email,
      subject: `Konfirmasi Pengajuan ${label} Berhasil Dikirim${regSuffix}`,
      text: plainText,
      html,
    });
    console.log(`[notif] Email konfirmasi pengajuan baru terkirim ke ${email} (${params.type}${regSuffix})`);
  } catch (err) {
    console.error(`[notif] Gagal mengirim email konfirmasi pengajuan baru ke ${email}:`, err);
  }
}

/**
 * Mengirim notifikasi email ke pemohon saat perbaikan/revisi pengajuan berhasil dikirim.
 */
export async function notifyApplicantSubmissionRevised(params: {
  type: SubmissionType;
  recipientEmail: string;
  applicantName: string;
  noRegistrasi?: string | null;
  id?: number;
}): Promise<void> {
  const email = params.recipientEmail?.trim();
  if (!email) {
    console.warn(`[notif] notifyApplicantSubmissionRevised dilewati: email kosong untuk ${params.type}#${params.id ?? "update"}.`);
    return;
  }

  const label = typeLabel[params.type];
  const waktu = formatWaktuIndonesia();
  const regSuffix = params.noRegistrasi ? ` (${params.noRegistrasi})` : "";
  const baseUrl = appBaseUrl();

  const plainText = [
    `Halo ${params.applicantName},`,
    "",
    `Perbaikan/revisi data pengajuan ${label} Anda di SI PARIK BANGKA telah berhasil kami terima.`,
    params.noRegistrasi ? `No. Registrasi: ${params.noRegistrasi}` : null,
    "Status saat ini: Menunggu Verifikasi",
    `Waktu dikirim: ${waktu}`,
    "",
    "Data yang Anda perbarui telah masuk kembali ke antrean verifikasi petugas untuk ditinjau ulang.",
    baseUrl ? `Pantau perkembangan pengajuan Anda melalui: ${baseUrl}/akun` : null,
    "",
    "Terima kasih atas kerja sama Anda.",
    "SI PARIK BANGKA - Dinas Pariwisata dan Kebudayaan Kabupaten Bangka",
  ].filter(Boolean).join("\n");

  const html = buildSubmissionReceiptHtml({
    action: "revise",
    type: params.type,
    nama: params.applicantName,
    noRegistrasi: params.noRegistrasi ?? null,
    waktu,
  });

  try {
    await sendEmail({
      to: email,
      subject: `Perbaikan Pengajuan ${label} Berhasil Dikirim${regSuffix}`,
      text: plainText,
      html,
    });
    console.log(`[notif] Email konfirmasi perbaikan pengajuan terkirim ke ${email} (${params.type}${regSuffix})`);
  } catch (err) {
    console.error(`[notif] Gagal mengirim email konfirmasi perbaikan pengajuan ke ${email}:`, err);
  }
}
