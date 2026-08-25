// lib/email.ts
import nodemailer from "nodemailer";

type SendEmailOptions = {
  to: string;
  subject: string;
  text: string; // fallback plain text
  html: string;
};

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  if (!host || !user || !pass || !from) {
    throw new Error("Konfigurasi SMTP belum lengkap.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}