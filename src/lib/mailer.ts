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
  rollNo: string;
  serial: string;
  passPng: Buffer;
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
        `We're excited to welcome you to AWS Student Community Day!`,
        ``,
        `Your official entry pass is attached to this email. Please keep it accessible and present it at the venue for verification.`,
        ``,
        `Serial No: ${input.serial}`,
        `Entry Token: ${input.token}`,
        ``,
        `We look forward to seeing you at the event and having you be a part of a day filled with technology, innovation, learning, and collaboration.`,
        ``,
        `See you there!`,
        ``,
        `Best regards,`,
        `AWS Student Builder Group, SUIIT`,
        `Sambalpur University Institute of Information Technology`,
        `Sambalpur, Odisha - 768019`,
      ].join("\n"),
      attachments: [{ filename: `SCD_${input.rollNo}.png`, content: input.passPng, contentType: "image/png" }],
    });
    return { sent: true };
  } catch (err) {
    console.error("[passes/email]", err);
    return { sent: false, reason: "email-failed" };
  }
}
