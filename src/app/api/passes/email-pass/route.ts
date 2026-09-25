import { NextResponse } from "next/server";
import { mailConfigured, sendPassEmail } from "@/lib/mailer";
import { verifyPass } from "@/lib/pass-store";
import { warnDefaultSecrets } from "@/lib/pass-token";
import { clientIp, rateOk } from "@/lib/rate-limit";

/**
 * Send the EXACT pass PNG the user sees (composed client-side) — guarantees
 * web/email parity. Token proves ownership of the pass.
 */
export async function POST(req: Request) {
  warnDefaultSecrets();
  if (!rateOk(`emailpass:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many emails. Wait a minute." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const token = String(b.token ?? "").trim();
  const pngDataUrl = String(b.pngDataUrl ?? "");
  if (!token || !pngDataUrl.startsWith("data:image/png;base64,")) {
    return NextResponse.json({ error: "token + PNG image required." }, { status: 400 });
  }
  const png = Buffer.from(pngDataUrl.split(",")[1] ?? "", "base64");
  if (png.length === 0 || png.length > 2_000_000) {
    return NextResponse.json({ error: "Bad image." }, { status: 400 });
  }
  const v = await verifyPass(token);
  if (!v.ok) return NextResponse.json({ ok: false, status: v.reason }, { status: 404 });
  if (!mailConfigured()) {
    return NextResponse.json({ error: "Email service not set up yet." }, { status: 503 });
  }
  try {
    const mail = await sendPassEmail({
      to: v.user.email,
      name: v.user.name,
      rollNo: v.user.rollNo,
      serial: v.user.serial,
      passPng: png,
      token: v.pass.token,
    });
    if (!mail.sent) return NextResponse.json({ error: "Email failed. Retry." }, { status: 502 });
    return NextResponse.json({ ok: true, to: v.user.email });
  } catch (err) {
    console.error("[passes/email-pass]", err);
    return NextResponse.json({ error: "Email failed. Retry." }, { status: 500 });
  }
}
