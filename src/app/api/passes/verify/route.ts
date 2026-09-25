import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { verifyPass } from "@/lib/pass-store";
import { clientIp, rateOk } from "@/lib/rate-limit";

function extractToken(req: Request, bodyToken?: string): string {
  if (bodyToken) return bodyToken;
  const { searchParams } = new URL(req.url);
  const t = searchParams.get("t") ?? searchParams.get("token") ?? "";
  // QR holds full URL: /admin/scan?t=TOKEN — support pasting whole URL too
  try {
    if (t) return t;
    const raw = searchParams.get("u") ?? "";
    if (raw) {
      const inner = new URL(raw);
      return inner.searchParams.get("t") ?? raw;
    }
  } catch {
    // fall through
  }
  return t;
}

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!rateOk(`scan:${clientIp(req)}`, 120, 60_000)) {
    return NextResponse.json({ error: "Too fast. Slow down." }, { status: 429 });
  }
  const token = extractToken(req).trim();
  if (!token) return NextResponse.json({ error: "token required." }, { status: 400 });
  const r = await verifyPass(token);
  if (!r.ok) return NextResponse.json({ ok: false, status: r.reason });
  return NextResponse.json({
    ok: true,
    status: r.alreadyUsed ? "USED" : "ACTIVE",
    type: r.pass.type,
    user: {
      name: `${r.user.firstName} ${r.user.lastName}`,
      email: r.user.email,
      mobile: r.user.mobile,
    },
    usedAt: r.pass.usedAt,
    scannedBy: r.pass.scannedBy,
  });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // allow query-only
  }
  const token = extractToken(req, String((body as Record<string, unknown>).token ?? "")).trim();
  if (!token) return NextResponse.json({ error: "token required." }, { status: 400 });
  const r = await verifyPass(token);
  if (!r.ok) return NextResponse.json({ ok: false, status: r.reason });
  return NextResponse.json({
    ok: true,
    status: r.alreadyUsed ? "USED" : "ACTIVE",
    type: r.pass.type,
    user: {
      name: `${r.user.firstName} ${r.user.lastName}`,
      email: r.user.email,
      mobile: r.user.mobile,
    },
    usedAt: r.pass.usedAt,
    scannedBy: r.pass.scannedBy,
  });
}
