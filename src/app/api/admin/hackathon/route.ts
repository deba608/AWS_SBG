import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import {
  deleteHackathonTeam,
  hackathonCount,
  hackathonLunchCounts,
  listHackathonTeams,
  registerTeam,
  updateHackathonTeam,
  validateTeam,
  HackathonConflictError,
  HackathonFullError,
  HackathonValidationError,
  type HackathonMemberInput,
} from "@/lib/hackathon-store";

function csvCell(v: string | null | undefined): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Admin: list teams (?format=csv for spreadsheet export). */
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const { teams, total } = await listHackathonTeams();
  if (searchParams.get("format") === "csv") {
    const header = ["team", "preference", "role", "name", "email", "mobile", "roll_no", "year", "gender", "day1_lunch", "github_url", "registered_at"];
    const lines: string[][] = [];
    const memberLine = (teamName: string, preference: string, role: string, m: { name: string; email: string; mobile: string; rollNo: string; year: string; gender: string; lunch?: string; githubUrl?: string }, at: string) =>
      [teamName, preference, role, m.name, m.email, m.mobile, m.rollNo, m.year, m.gender, m.lunch ?? "", m.githubUrl ?? "", at];
    for (const t of teams) {
      const pref = t.preference ?? "";
      lines.push(memberLine(t.teamName, pref, "leader", t.leader, t.createdAt));
      for (const m of t.members) {
        lines.push(memberLine(t.teamName, pref, "member", m, t.createdAt));
      }
    }
    const csv = [header, ...lines].map((r) => r.map(csvCell).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="hackathon-teams.csv"',
      },
    });
  }
  const count = await hackathonCount();
  const lunch = await hackathonLunchCounts();
  return NextResponse.json({ total, registered: count.registered, limit: count.limit, open: count.open, lunch, teams });
}

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

/** Admin walk-in: create a team directly (no rate limit). */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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
    declaration: true,
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
    console.error("[admin/hackathon POST]", err);
    return NextResponse.json({ error: "Create failed. Retry." }, { status: 500 });
  }
}

/** Admin edit: PATCH { id, patch: { teamName?, preference?, leader?, members? } } */
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
  const p = (b.patch ?? {}) as Record<string, unknown>;
  if (!id || typeof p !== "object") {
    return NextResponse.json({ error: "id and patch required." }, { status: 400 });
  }
  try {
    const { team } = await updateHackathonTeam(id, {
      ...(p.teamName !== undefined ? { teamName: String(p.teamName) } : {}),
      ...(p.preference !== undefined ? { preference: String(p.preference) } : {}),
      ...(p.leader !== undefined ? { leader: memberOf(p.leader) } : {}),
      ...(p.members !== undefined
        ? { members: Array.isArray(p.members) ? (p.members as unknown[]).slice(0, 8).map(memberOf) : [] }
        : {}),
    });
    return NextResponse.json({ team });
  } catch (err) {
    if (err instanceof HackathonValidationError) {
      return NextResponse.json({ error: "Validation failed.", errors: err.errors }, { status: 400 });
    }
    if (err instanceof HackathonConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof Error && err.message === "Team not found.") {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }
    console.error("[admin/hackathon PATCH]", err);
    return NextResponse.json({ error: "Update failed. Retry." }, { status: 500 });
  }
}

/** Admin remove: DELETE { id } → deletes the whole team. */
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
    const result = await deleteHackathonTeam(id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof Error && err.message === "Team not found.") {
      return NextResponse.json({ error: "Team not found." }, { status: 404 });
    }
    console.error("[admin/hackathon DELETE]", err);
    return NextResponse.json({ error: "Delete failed. Retry." }, { status: 500 });
  }
}
