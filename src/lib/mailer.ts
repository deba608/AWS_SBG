import nodemailer from "nodemailer";

export interface EmailResult {
  sent: boolean;
  reason?: string;
}

/** SMTP via env. Missing config → skipped, never throws. */
export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendPassEmail(input: {
  to: string;
  name: string;
  qrPng: Buffer;
  token: string;
}): Promise<EmailResult> {
  if (!mailConfigured()) return { sent: false, reason: "email-not-configured" };
  try {
    const port = Number(process.env.SMTP_PORT ?? 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const from = process.env.SMTP_FROM ?? "awsscd@suiit.ac.in";
    await transporter.sendMail({
      from: `"AWS SBG" <${from}>`,
      to: input.to,
      subject: "Your AWS Student Community Day entry pass",
      text: [
        `Hi ${input.name},`,
        ``,
        `Your entry pass for AWS Student Community Day (Oct 6–8, SUIIT) is attached as an image.`,
        `Show the QR at the gate — it scans once.`,
        ``,
        `Backup: take a screenshot of the attached pass.`,
        `Token: ${input.token}`,
        ``,
        `See you there — AWS Student Builder Group`,
      ].join("\n"),
      attachments: [{ filename: "entry-pass.png", content: input.qrPng, contentType: "image/png" }],
    });
    return { sent: true };
  } catch (err) {
    console.error("[passes/email]", err);
    return { sent: false, reason: "email-failed" };
  }
}
