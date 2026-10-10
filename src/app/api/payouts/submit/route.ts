import { NextResponse } from "next/server";
import { clientIp, rateOk } from "@/lib/rate-limit";
import {
  PayoutConflictError,
  submitPayout,
  validatePayout,
  type PayoutInput,
} from "@/lib/payout-store";

function asInput(b: Record<string, unknown>): PayoutInput {
  return {
    name: String(b.name ?? ""),
    rollNo: String(b.rollNo ?? ""),
    email: String(b.email ?? ""),
    mobile: String(b.mobile ?? ""),
    event: String(b.event ?? ""),
    position: String(b.position ?? ""),
    teamName: String(b.teamName ?? ""),
    method: String(b.method ?? ""),
    upiId: String(b.upiId ?? ""),
    accountHolder: String(b.accountHolder ?? ""),
    accountNumber: String(b.accountNumber ?? ""),
    ifsc: String(b.ifsc ?? ""),
    consent: b.consent === true,
  };
}

/** Winners submit payment details for prize transfer. */
export async function POST(req: Request) {
  if (!rateOk(`payout:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Wait a minute." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const input = asInput((body ?? {}) as Record<string, unknown>);
  const errors = validatePayout(input);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Validation failed.", errors }, { status: 400 });
  }
  try {
    const { payout } = await submitPayout(input);
    // Never echo full bank account back — return masked id only.
    return NextResponse.json(
      { ok: true, id: payout.id, event: payout.event, status: payout.status },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof PayoutConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[payouts/submit]", err);
    return NextResponse.json({ error: "Submit failed. Retry." }, { status: 500 });
  }
}
