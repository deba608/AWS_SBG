import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { migrateYears } from "@/lib/pass-store";

/**
 * One-shot backfill: 24…→3rd, 25…→2nd (26…→1st, 23…→4th) for
 * registrations saved before the Year field existed. Idempotent —
 * rows that already have a year are untouched.
 */
export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const result = await migrateYears();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[admin/migrate-years]", err);
    return NextResponse.json({ error: "Migration failed. Retry." }, { status: 500 });
  }
}
