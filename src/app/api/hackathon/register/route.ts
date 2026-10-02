import { NextResponse } from "next/server";
import { clientIp, rateOk } from "@/lib/rate-limit";
import { mailConfigured, sendHackathonEmail } from "@/lib/mailer";
import {
  hackathonCount,
  registerTeam,
  validateTeam,
  HackathonConflictError,
  HackathonFullError,
  type HackathonMemberInput,
} from "@/lib/hackathon-store";

export const HACKATHON_WHATSAPP_URL = "https://chat.whatsapp.com/F0ZtzWyBtV6Fm6NQ6q7dzR";

function memberOf(v: unknown): HackathonMemberInput {
  const o = (v ?? {}) as Record<string, unknown>;
  return {
    name: String(o.name ?? ""),
    rollNo: String(o.rollNo ?? ""),
    email: String(o.email ?? ""),
    mobile: String(o.mobile ?? ""),
    year: String(o.year ?? ""),
    gender: String(o.gender ?? ""),
    githubUrl: String(o.githubUrl ?? ""),
    lunch: String(o.lunch ?? ""),
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
    preference: String(b.preference ?? ""),
    declaration: b.declaration === true,
    leader: memberOf(b.leader),
    members: Array.isArray(b.members) ? (b.members as unknown[]).slice(0, 8).map(memberOf) : [],
  };
  const errors = validateTeam(input);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Validation failed.", errors }, { status: 400 });
  }
  try {
    const { team } = await registerTeam(input);
    // Confirmation email to leader (fire-and-forget — never blocks registration).
    const configured = mailConfigured();
    let emailed = false;
    if (configured) {
      const people = [team.leader, ...team.members].map(
        (m) => `${m.name} · ${m.rollNo} · ${m.year} year`,
      );
      emailed = (
        await sendHackathonEmail({
          to: team.leader.email,
          teamName: team.teamName,
          leaderName: team.leader.name,
          preference: team.preference,
          members: people,
          whatsappUrl: HACKATHON_WHATSAPP_URL,
        }).catch(() => ({ sent: false as boolean }))
      ).sent;
    }
    return NextResponse.json({ team, email: { sent: emailed, configured } }, { status: 201 });
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
