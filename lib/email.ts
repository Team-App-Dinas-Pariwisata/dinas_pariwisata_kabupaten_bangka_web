// lib/email.ts
import nodemailer from "nodemailer";

export type SendEmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html: string;
  replyTo?: string;
};

/**
 * Mengirim email notifikasi sistem Si Parik.
 * Konfigurasi sepenuhnya diambil dari environment variable (.env):
 * 1. Provider Utama: SMTP (Nodemailer)
 * 2. Provider Cadangan (Fallback): Resend API jika SMTP mengalami kendala
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ id?: string; provider: "resend" | "smtp" }> {
  const host = process.env.SMTP_HOST || "mail.siparik.bangka.go.id";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.EMAIL_FROM?.trim() || (user ? `"Si Parik Bangka" <${user}>` : undefined);

  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  // 1. Coba kirim via SMTP jika konfigurasi user & pass tersedia di .env
  if (user && pass && from) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.verify();

      const info = await transporter.sendMail({
        from,
        sender: user,
        replyTo: options.replyTo || user,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        headers: {
          "X-Mailer": "Si Parik Bangka Notification System",
          "X-Priority": "3",
        },
      });

      console.log(`[email:smtp] Email berhasil terkirim ke ${options.to} via SMTP (${host})`);
      return { id: info.messageId, provider: "smtp" };
    } catch (smtpError) {
      console.warn(`[email:smtp] Gagal kirim via SMTP (${(smtpError as Error).message}).`);

      // Jika Resend tidak dikonfigurasi, lemparkan error asli dari SMTP
      if (!resendApiKey) {
        throw smtpError;
      }
      console.log("[email] Mengalihkan ke backup Resend API...");
    }
  }

  // 2. Kirim / Fallback ke Resend API jika API Key tersedia di .env
  if (resendApiKey) {
    const resendFrom =
      process.env.RESEND_FROM?.trim() ||
      from ||
      "Si Parik Bangka <noreply@siparik.bangka.go.id>";

    const replyTo =
      options.replyTo ||
      process.env.RESEND_REPLY_TO?.trim() ||
      user ||
      undefined;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || undefined,
        reply_to: replyTo,
        headers: {
          "X-Entity-Ref-ID": `${Date.now()}`,
        },
      }),
    });

    const resJson = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = resJson?.message || resJson?.error || `HTTP ${res.status}: ${res.statusText}`;
      console.error(`[email:resend] Gagal kirim via Resend: ${errorMsg}`);
      throw new Error(`Pengiriman email via Resend gagal: ${errorMsg}`);
    }

    console.log(`[email:resend] Email berhasil terkirim ke ${options.to} via Resend. ID: ${resJson?.id}`);
    return { id: resJson?.id, provider: "resend" };
  }

  throw new Error("Konfigurasi email belum lengkap di .env (SMTP maupun RESEND_API_KEY tidak tersedia).");
}
