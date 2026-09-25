import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { mailConfigured, sendPassEmail } from "@/lib/mailer";
import { getPassesByContact, issuePasses } from "@/lib/pass-store";
import { warnDefaultSecrets } from "@/lib/pass-token";
import { clientIp, rateOk } from "@/lib/rate-limit";
import {
  normalizedContact,
  validateContact,
} from "@/lib/validate-contact";

export async function POST(req: Request) {
  warnDefaultSecrets();
  if (!rateOk(`issue:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Wait a minute." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const input = {
    fullName: String(b.fullName ?? ""),
    rollNo: String(b.rollNo ?? ""),
    email: String(b.email ?? ""),
    gender: String(b.gender ?? ""),
    food: String(b.food ?? ""),
  };
  const errors = validateContact(input);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Validation failed.", errors }, { status: 400 });
  }
  const contact = normalizedContact(input);
  try {
    const { user, passes, duplicate } = await issuePasses(contact);
    const withQr = await Promise.all(
      passes.map(async (p) => ({
        type: p.type,
        token: p.token,
        qrContent: p.qrContent,
        qrImage: await QRCode.toDataURL(p.qrContent, { width: 800, margin: 2 }),
        status: p.status,
      })),
    );
    // Share by email too — best effort, pass shown regardless.
    let emailSent = false;
    if (!duplicate && mailConfigured()) {
      const png = Buffer.from(withQr[0].qrImage.split(",")[1], "base64");
      const mail = await sendPassEmail({
        to: user.email,
        name: user.name,
        qrPng: png,
        token: passes[0].token,
      });
      emailSent = mail.sent;
    }
    return NextResponse.json(
      {
        user: {
          name: user.name,
          rollNo: user.rollNo,
          email: user.email,
          gender: user.gender,
          food: user.food,
        },
        passes: withQr,
        duplicate,
        email: { sent: emailSent, configured: mailConfigured() },
      },
      { status: duplicate ? 200 : 201 },
    );
  } catch (err) {
    console.error("[passes/issue]", err);
    return NextResponse.json({ error: "Issue failed. Retry." }, { status: 500 });
  }
}

/** Retrieve: GET /api/passes/issue?email=&rollNo= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();
  const rollNo = (searchParams.get("rollNo") ?? searchParams.get("mobile") ?? "").trim();
  if (!email && !rollNo) {
    return NextResponse.json({ error: "email or roll number required." }, { status: 400 });
  }
  const found = await getPassesByContact(email, rollNo);
  if (!found) return NextResponse.json({ error: "No pass found." }, { status: 404 });
  const withQr = await Promise.all(
    found.passes.map(async (p) => ({
      type: p.type,
      token: p.token,
      qrContent: p.qrContent,
      qrImage: await QRCode.toDataURL(p.qrContent, { width: 800, margin: 2 }),
      status: p.status,
    })),
  );
  return NextResponse.json({
    user: {
      name: found.user.name,
      rollNo: found.user.rollNo,
      email: found.user.email,
      gender: found.user.gender,
      food: found.user.food,
    },
    passes: withQr,
  });
}
