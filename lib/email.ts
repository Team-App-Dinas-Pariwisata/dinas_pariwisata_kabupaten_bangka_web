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
 * Menggunakan Resend API (resend.com) sebagai provider utama.
 * Memiliki fallback otomatis ke SMTP jika API Resend mengalami kendala/pembatasan domain sandbox.
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ id?: string; provider: "resend" | "smtp" }> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  // 1. Coba kirim via Resend API
  if (resendApiKey) {
    try {
      const from =
        process.env.RESEND_FROM?.trim() ||
        process.env.EMAIL_FROM?.trim() ||
        "Si Parik Bangka <onboarding@resend.dev>";

      const replyTo =
        options.replyTo ||
        process.env.RESEND_REPLY_TO?.trim() ||
        process.env.SMTP_USER?.trim() ||
        undefined;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
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
        console.warn(`[email:resend] Gagal mengirim via Resend: ${errorMsg}`);
        throw new Error(`Resend API Error: ${errorMsg}`);
      }

      console.log(`[email:resend] Email berhasil terkirim ke ${options.to} via Resend. ID: ${resJson?.id}`);
      return { id: resJson?.id, provider: "resend" };
    } catch (resendError) {
      console.warn(`[email] Resend gagal: ${(resendError as Error).message}`);

      // Jika SMTP tidak dikonfigurasi, lemparkan error asli dari Resend
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw resendError;
      }
      console.log(`[email] Mengalihkan pengiriman ke fallback SMTP...`);
    }
  }

  // 2. Fallback ke SMTP (Nodemailer)
  const host = process.env.SMTP_HOST || "mail.siparik.bangka.go.id";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const from =
    process.env.EMAIL_FROM ||
    `"Si Parik Bangka" <${user}>`;

  if (!user || !pass) {
    throw new Error("Konfigurasi pengiriman email (Resend API maupun SMTP) belum lengkap.");
  }

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
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    headers: {
      "X-Mailer": "Si Parik Bangka Notification System",
      "X-Priority": "3",
    },
  });

  console.log(`[email:smtp] Email berhasil terkirim ke ${options.to} via SMTP fallback.`);
  return { id: info.messageId, provider: "smtp" };
}
