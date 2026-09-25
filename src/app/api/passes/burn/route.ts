import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { burnPass } from "@/lib/pass-store";
import { clientIp, rateOk } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!rateOk(`scan:${clientIp(req)}`, 120, 60_000)) {
    return NextResponse.json({ error: "Too fast. Slow down." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const token = String((body as Record<string, unknown>).token ?? "").trim();
  const scannedBy = String((body as Record<string, unknown>).scannedBy ?? "admin").slice(0, 60);
  if (!token) return NextResponse.json({ error: "token required." }, { status: 400 });
  const r = await burnPass(token, scannedBy);
  if (!r.ok) {
    if (r.reason === "EXPIRED") {
      return NextResponse.json({ ok: false, status: "EXPIRED" }, { status: 410 });
    }
    if (r.reason === "ALREADY_USED") {
      return NextResponse.json(
        {
          ok: false,
          status: "USED",
          type: r.pass?.type,
          user: r.user
            ? { name: r.user.name, email: r.user.email, rollNo: r.user.rollNo, food: r.user.food }
            : undefined,
          usedAt: r.pass?.usedAt,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: false, status: "INVALID" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    status: "USED",
    type: r.pass.type,
    user: { name: r.user.name, email: r.user.email, rollNo: r.user.rollNo, food: r.user.food },
    usedAt: r.pass.usedAt,
  });
}
