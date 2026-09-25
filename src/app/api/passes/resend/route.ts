import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { mailConfigured, sendPassEmail } from "@/lib/mailer";
import { drawPassImageServer } from "@/lib/pass-image-server";
import { getPassesByContact } from "@/lib/pass-store";
import { warnDefaultSecrets } from "@/lib/pass-token";
import { clientIp, rateOk } from "@/lib/rate-limit";

/** Resend pass image to a registered email. 3/min per IP anti-abuse. */
export async function POST(req: Request) {
  warnDefaultSecrets();
  if (!rateOk(`resend:${clientIp(req)}`, 3, 60_000)) {
    return NextResponse.json({ error: "Too many resends. Wait a minute." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const email = String(b.email ?? "").trim().toLowerCase();
  const rollNo = String(b.rollNo ?? "").trim();
  const mobile = String(b.mobile ?? "").trim();
  if (!email && !rollNo && !mobile) {
    return NextResponse.json({ error: "email, roll number or mobile required." }, { status: 400 });
  }
  const found = await getPassesByContact(email, rollNo, mobile);
  if (!found) return NextResponse.json({ error: "No pass found." }, { status: 404 });
  if (!mailConfigured()) {
    return NextResponse.json({ error: "Email service not set up yet." }, { status: 503 });
  }
  const pass = found.passes.find((p) => p.type === "ENTRY") ?? found.passes[0];
  if (!pass) return NextResponse.json({ error: "No pass found." }, { status: 404 });
  try {
    const qrImage = await QRCode.toDataURL(pass.qrContent, { width: 800, margin: 2 });
    const png = await drawPassImageServer({
      serial: found.user.serial ?? "",
      name: found.user.name,
      email: found.user.email,
      rollNo: found.user.rollNo,
      food: found.user.food,
      qrDataUrl: qrImage,
      token: pass.token,
    });
    const mail = await sendPassEmail({
      to: found.user.email,
      name: found.user.name,
      rollNo: found.user.rollNo,
      passPng: png,
      token: pass.token,
    });
    if (!mail.sent) return NextResponse.json({ error: "Email failed. Retry." }, { status: 502 });
    return NextResponse.json({ ok: true, to: found.user.email });
  } catch (err) {
    console.error("[passes/resend]", err);
    return NextResponse.json({ error: "Resend failed. Retry." }, { status: 500 });
  }
}
