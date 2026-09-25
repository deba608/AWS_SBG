import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { burnPass } from "@/lib/pass-store";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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
    if (r.reason === "ALREADY_USED") {
      return NextResponse.json(
        {
          ok: false,
          status: "USED",
          type: r.pass?.type,
          user: r.user
            ? { name: `${r.user.firstName} ${r.user.lastName}`, email: r.user.email, mobile: r.user.mobile }
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
    user: { name: `${r.user.firstName} ${r.user.lastName}`, email: r.user.email, mobile: r.user.mobile },
    usedAt: r.pass.usedAt,
  });
}
