import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CLINIC_NOTIFY_EMAIL } = process.env;

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendMail(opts: { to?: string; subject: string; text: string }) {
  const t = getTransporter();
  if (!t) {
    // SMTP not configured yet — log instead of failing the request.
    console.log("[mailer] SMTP not configured, skipping email:", opts.subject);
    return;
  }
  await t.sendMail({
    from: SMTP_USER,
    to: opts.to ?? CLINIC_NOTIFY_EMAIL ?? SMTP_USER,
    subject: opts.subject,
    text: opts.text,
  });
}
