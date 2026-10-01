import { NextResponse } from "next/server";
import { clientIp, rateOk } from "@/lib/rate-limit";
import {
  hackathonCount,
  registerTeam,
  validateTeam,
  HackathonConflictError,
  HackathonFullError,
  type HackathonMemberInput,
} from "@/lib/hackathon-store";

function memberOf(v: unknown): HackathonMemberInput {
  const o = (v ?? {}) as Record<string, unknown>;
  return {
    name: String(o.name ?? ""),
    rollNo: String(o.rollNo ?? ""),
    email: String(o.email ?? ""),
    mobile: String(o.mobile ?? ""),
    year: String(o.year ?? ""),
    food: String(o.food ?? ""),
    gender: String(o.gender ?? ""),
  };
}

export async function POST(req: Request) {
  if (!rateOk(`hackathon:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Wait a minute." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const input = {
    teamName: String(b.teamName ?? ""),
    leader: memberOf(b.leader),
    members: Array.isArray(b.members) ? (b.members as unknown[]).slice(0, 8).map(memberOf) : [],
  };
  const errors = validateTeam(input);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Validation failed.", errors }, { status: 400 });
  }
  try {
    const { team } = await registerTeam(input);
    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    if (err instanceof HackathonConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof HackathonFullError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("[hackathon/register]", err);
    return NextResponse.json({ error: "Registration failed. Retry." }, { status: 500 });
  }
}

/** Slots: GET /api/hackathon/register?count=1 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("count") === "1") {
    return NextResponse.json(await hackathonCount());
  }
  return NextResponse.json({ error: "Use ?count=1." }, { status: 400 });
}
