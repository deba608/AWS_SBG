import { NextResponse } from "next/server";
import { mailConfigured } from "@/lib/mailer";
import { passExpiry } from "@/lib/pass-token";
import { storeWritable } from "@/lib/pass-store";

/** Diagnose a failing host: open /api/health in browser. */
export async function GET() {
  const writable = await storeWritable();
  return NextResponse.json({
    ok: writable,
    store: writable ? "writable" : "READ-ONLY — passes cannot be saved on this host",
    mail: mailConfigured() ? "configured" : "not-configured",
    expiry: passExpiry().toISOString(),
    now: new Date().toISOString(),
  });
}
