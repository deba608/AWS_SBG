import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getPassesByContact, issuePasses } from "@/lib/pass-store";
import {
  normalizedContact,
  validateContact,
} from "@/lib/validate-contact";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const input = {
    firstName: String(b.firstName ?? ""),
    lastName: String(b.lastName ?? ""),
    email: String(b.email ?? ""),
    mobile: String(b.mobile ?? ""),
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
    return NextResponse.json(
      {
        user: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          mobile: user.mobile,
        },
        passes: withQr,
        duplicate,
      },
      { status: duplicate ? 200 : 201 },
    );
  } catch (err) {
    console.error("[passes/issue]", err);
    return NextResponse.json({ error: "Issue failed. Retry." }, { status: 500 });
  }
}

/** Retrieve: GET /api/passes/issue?email=&mobile= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();
  const mobile = (searchParams.get("mobile") ?? "").replace(/\D/g, "").slice(-10);
  if (!email && !mobile) {
    return NextResponse.json({ error: "email or mobile required." }, { status: 400 });
  }
  const found = await getPassesByContact(email, mobile);
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
      name: `${found.user.firstName} ${found.user.lastName}`,
      email: found.user.email,
      mobile: found.user.mobile,
    },
    passes: withQr,
  });
}
