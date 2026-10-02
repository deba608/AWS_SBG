import nodemailer from "nodemailer";

export interface EmailResult {
  sent: boolean;
  reason?: string;
}

/** SMTP via env. Missing config → skipped, never throws. */
export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendHackathonEmail(input: {
  to: string;
  teamName: string;
  leaderName: string;
  preference: string;
  members: string[];
  whatsappUrl: string;
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
    const from = process.env.SMTP_FROM ?? "awssbg@suiit.ac.in";
    const memberLines = input.members.map((m, i) => `  ${i + 1}. ${m}`).join("\n");
    await transporter.sendMail({
      from: `"AWS SBG" <${from}>`,
      to: input.to,
      subject: `DecodeX Hackathon — team ${input.teamName} registered`,
      text: [
        `Hi ${input.leaderName},`,
        ``,
        `Your team "${input.teamName}" is registered for the DecodeX Hackathon (Day 1, 6th October 2026).`,
        ``,
        `Track preference: ${input.preference}`,
        `Team:`,
        memberLines,
        ``,
        `Check-in 8:45 AM at APJ Abdul Kalam Auditorium, SUIIT, Burla. Bring laptops + your team.`,
        ``,
        `Join the DecodeX Hackathon WhatsApp group for updates:`,
        input.whatsappUrl,
        ``,
        `Note: each member still needs their own Community Day pass (8th October) for Day-3 entry + lunch — get passes at https://awssbgsuiit.in/passes.`,
        ``,
        `See you there!`,
        ``,
        `Best regards,`,
        `AWS Student Builder Group, SUIIT`,
      ].join("\n"),
    });
    return { sent: true };
  } catch (err) {
    console.error("[hackathon/email]", err);
    return { sent: false, reason: "email-failed" };
  }
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
        `Valid only for: Student Community Day — 8th October (Speaker session, Prize Distribution, Lunch & Comedy).`,
        `Serial No: ${input.serial}`,
        `Entry Token: ${input.token}`,
        ``,
        `Note: the DecodeX Hackathon, Tech Parliament and Make-A-Bot need separate registration — hackathon teams register at /hackathon, Tech Parliament and Make-A-Bot via their Google Forms (links shared by mail). This pass alone does not grant contest entry.`,
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
