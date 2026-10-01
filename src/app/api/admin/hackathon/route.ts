import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { hackathonCount, listHackathonTeams } from "@/lib/hackathon-store";

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
    const header = ["team", "role", "name", "email", "mobile", "roll_no", "year", "registered_at"];
    const lines: string[][] = [];
    for (const t of teams) {
      lines.push([t.teamName, "leader", t.leader.name, t.leader.email, t.leader.mobile, t.leader.rollNo, t.leader.year, t.createdAt]);
      for (const m of t.members) {
        lines.push([t.teamName, "member", m.name, m.email, m.mobile, m.rollNo, m.year, t.createdAt]);
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
  return NextResponse.json({ total, registered: count.registered, limit: count.limit, open: count.open, teams });
}
