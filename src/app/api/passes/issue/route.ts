import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { mailConfigured } from "@/lib/mailer";
import { getPassesByContact, issuePasses, registrationCount, ConflictError, RegistrationsClosedError, RegistrationsFullError } from "@/lib/pass-store";
import { warnDefaultSecrets } from "@/lib/pass-token";
import { clientIp, rateOk } from "@/lib/rate-limit";
import {
  normalizedContact,
  validateContact,
} from "@/lib/validate-contact";

export async function POST(req: Request) {
  warnDefaultSecrets();
  if (!rateOk(`issue:${clientIp(req)}`, 30, 60_000)) {
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
    mobile: String(b.mobile ?? ""),
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
    // Email goes out via /api/passes/email-pass with the exact client PNG
    // (web/email parity) — client triggers it right after showing the pass.
    return NextResponse.json(
      {
        user: {
          name: user.name,
          serial: user.serial,
          rollNo: user.rollNo,
          email: user.email,
          mobile: user.mobile,
          gender: user.gender,
          food: user.food,
        },
        passes: withQr,
        duplicate,
        email: { sent: false, configured: mailConfigured() },
      },
      { status: duplicate ? 200 : 201 },
    );
  } catch (err) {
    if (err instanceof ConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof RegistrationsFullError || err instanceof RegistrationsClosedError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("[passes/issue]", err);
    const storageDead =
      err instanceof Error && ("code" in err
        ? ["EROFS", "EACCES", "EPERM", "ENOSPC"].includes(String((err as NodeJS.ErrnoException).code))
        : /read-only|permission|denied/i.test(err.message));
    if (storageDead) {
      return NextResponse.json(
        { error: "Server storage is read-only. Host passes on a persistent server, not serverless." },
        { status: 500 },
      );
    }
    return NextResponse.json(
      {
        error: "Issue failed. Retry.",
        ...(process.env.NODE_ENV !== "production" && err instanceof Error
          ? { detail: err.message }
          : {}),
      },
      { status: 500 },
    );
  }
}

/** Slots: GET /api/passes/issue?count=1 — Retrieve: ?email=&rollNo=&mobile= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("count") === "1") {
    return NextResponse.json(await registrationCount());
  }
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();
  const rollNo = (searchParams.get("rollNo") ?? "").trim();
  const mobile = (searchParams.get("mobile") ?? "").trim();
  if (!email && !rollNo && !mobile) {
    return NextResponse.json({ error: "email, roll number or mobile required." }, { status: 400 });
  }
  const found = await getPassesByContact(email, rollNo, mobile);
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
      serial: found.user.serial ?? "",
      rollNo: found.user.rollNo,
      email: found.user.email,
      mobile: found.user.mobile ?? "",
      gender: found.user.gender,
      food: found.user.food,
    },
    passes: withQr,
  });
}
