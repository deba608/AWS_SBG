import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { effectiveYearOf, foodStatusOf, resetPassByRaw, type ResetScope } from "@/lib/pass-store";
import { clientIp, rateOk } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Same gate budget as burn: double-tap + retries. */
const SCAN_LIMIT = 300;

/**
 * Per-person check-in reset: USED → ACTIVE (entry and/or lunch).
 * Full admin only — sub-admin (gate) gets 401. Body:
 * { token: string (token, QR URL, or Serial No. A01), scope?: "entry" | "food" | "both" }
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!rateOk(`scan:${clientIp(req)}`, SCAN_LIMIT, 60_000)) {
    return NextResponse.json({ error: "Too fast. Slow down." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  // QR holds full URL …/admin/scan?t=TOKEN — accept pasted URL too
  let raw = String(b.token ?? "").trim();
  try {
    if (raw.includes("://") || raw.includes("?t=")) {
      const u = new URL(raw, "http://x");
      raw = u.searchParams.get("t") ?? u.searchParams.get("token") ?? raw;
    }
  } catch {
    // plain token / serial
  }
  const scopeRaw = String(b.scope ?? "entry");
  const scope: ResetScope = scopeRaw === "food" ? "food" : scopeRaw === "both" ? "both" : "entry";
  if (!raw) return NextResponse.json({ error: "token required." }, { status: 400 });
  const r = await resetPassByRaw(raw, scope);
  if (!r.ok) {
    return NextResponse.json({ ok: false, status: "INVALID", scope }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    scope,
    resetEntry: r.resetEntry,
    resetFood: r.resetFood,
    status: r.pass.status,
    foodStatus: foodStatusOf(r.pass) === "USED" ? "FOOD_USED" : "FOOD_ACTIVE",
    type: r.pass.type,
    user: {
      name: r.user.name,
      serial: r.user.serial ?? "",
      email: r.user.email,
      mobile: r.user.mobile ?? "",
      rollNo: r.user.rollNo,
      food: r.user.food,
      year: effectiveYearOf(r.user) ?? "",
    },
    usedAt: r.pass.usedAt,
    scannedBy: r.pass.scannedBy,
  });
}
