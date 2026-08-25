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

/**
 * `replyTo` matters for anything a member of the public sends in.
 *
 * The From address has to stay the clinic's own SMTP user or the message is
 * rejected as a forgery — so a contact-form email arrives *from the clinic*.
 * Without a Reply-To, hitting reply in the inbox writes back to the clinic
 * itself and the patient never hears anything.
 *
 * Returns whether the mail actually left. Callers that need to tell the sender
 * "we have your message" should not say so on the strength of a no-op.
 */
export async function sendMail(opts: {
  to?: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    // SMTP not configured yet — log instead of failing the request.
    console.log("[mailer] SMTP not configured, skipping email:", opts.subject);
    return false;
  }
  await t.sendMail({
    from: SMTP_USER,
    to: opts.to ?? CLINIC_NOTIFY_EMAIL ?? SMTP_USER,
    subject: opts.subject,
    text: opts.text,
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
  });
  return true;
}
