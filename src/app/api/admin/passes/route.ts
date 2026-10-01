import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { clearAllRegistrations, effectiveYearOf, listPasses } from "@/lib/pass-store";

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const { rows, total } = await listPasses({
    query: searchParams.get("q") ?? "",
    type: searchParams.get("type") ?? "ALL",
    status: searchParams.get("status") ?? "ALL",
    limit: Number(searchParams.get("limit") ?? 200),
    year: searchParams.get("year") ?? "ALL",
  });
  return NextResponse.json({
    total,
    rows: rows.map(({ pass, user }) => ({
      type: pass.type,
      status: pass.status,
      token: pass.token,
      createdAt: pass.createdAt,
      usedAt: pass.usedAt,
      scannedBy: pass.scannedBy,
      name: user?.name ?? "—",
      userId: user?.id ?? null,
      serial: user?.serial ?? "—",
      email: user?.email ?? "—",
      mobile: user?.mobile ?? "—",
      rollNo: user?.rollNo ?? "—",
      gender: user?.gender ?? "—",
      food: user?.food ?? "—",
      year: (user ? (effectiveYearOf(user) ?? "—") : "—"),
    })),
  });
}

/**
 * DELETE all registrations (users + passes). Serial counter reset.
 * Body must be { confirm: "DELETE ALL" }. Admin cookie required.
 * Export CSV/XLSX first — this cannot be undone.
 */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Confirmation required." }, { status: 400 });
  }
  const confirm = (body as Record<string, unknown>).confirm;
  if (confirm !== "DELETE ALL") {
    return NextResponse.json({ error: 'Send { "confirm": "DELETE ALL" } to confirm.' }, { status: 400 });
  }
  try {
    const result = await clearAllRegistrations();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[admin/passes DELETE]", err);
    return NextResponse.json({ error: "Delete failed. Retry." }, { status: 500 });
  }
}
