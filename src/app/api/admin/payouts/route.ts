import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import {
  deletePayout,
  listPayouts,
  updatePayout,
} from "@/lib/payout-store";

function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Admin: list payout requests (?format=csv for spreadsheet export). */
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const { payouts, total } = await listPayouts();
  if (searchParams.get("format") === "csv") {
    const header = [
      "name", "roll_no", "email", "mobile", "event", "position", "team",
      "method", "upi_id", "upi_mobile", "bank_name", "account_holder", "account_number", "ifsc",
      "status", "amount", "note", "submitted_at", "updated_at",
    ];
    const lines = payouts.map((p) => [
      p.name, p.rollNo, p.email, p.mobile, p.event, p.position, p.teamName,
      p.method, p.upiId, p.upiMobile, p.bankName, p.accountHolder, p.accountNumber, p.ifsc,
      p.status, p.amount ?? "", p.note, p.createdAt, p.updatedAt,
    ]);
    const csv = [header, ...lines].map((r) => r.map(csvCell).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="winner-payouts.csv"',
      },
    });
  }
  const byStatus: Record<string, number> = {};
  for (const p of payouts) byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
  return NextResponse.json({ total, byStatus, payouts });
}

/** Admin: PATCH { id, status?, amount?, note? } */
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const id = String(b.id ?? "");
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  try {
    const { payout } = await updatePayout(id, {
      ...(b.status !== undefined ? { status: String(b.status) } : {}),
      ...(b.amount !== undefined
        ? { amount: b.amount === null || b.amount === "" ? null : Number(b.amount) }
        : {}),
      ...(b.note !== undefined ? { note: String(b.note) } : {}),
    });
    return NextResponse.json({ payout });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Update failed.";
    const code = msg === "Payout not found." ? 404 : 400;
    return NextResponse.json({ error: msg }, { status: code });
  }
}

/** Admin: DELETE { id } */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const id = String((body as Record<string, unknown>).id ?? "");
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  try {
    await deletePayout(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Delete failed.";
    const code = msg === "Payout not found." ? 404 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
