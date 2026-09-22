// lib/email.ts
import nodemailer from "nodemailer";

type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const host = process.env.SMTP_HOST || "mail.siparik.bangka.go.id";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const from =
    process.env.EMAIL_FROM ||
    `"Si Parik Bangka" <${user}>`;

  if (!user || !pass) {
    throw new Error("Konfigurasi SMTP belum lengkap.");
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

  await transporter.sendMail({
    from,
    sender: user,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,

    // membantu reputasi email
    headers: {
      "X-Mailer": "Si Parik Bangka Notification System",
      "X-Priority": "3",
    },
  });
}
