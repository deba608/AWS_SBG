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
    const header = ["team", "preference", "role", "name", "email", "mobile", "roll_no", "year", "gender", "food", "github_url", "registered_at"];
    const lines: string[][] = [];
    const memberLine = (teamName: string, preference: string, role: string, m: { name: string; email: string; mobile: string; rollNo: string; year: string; gender: string; food: string; githubUrl?: string }, at: string) =>
      [teamName, preference, role, m.name, m.email, m.mobile, m.rollNo, m.year, m.gender, m.food, m.githubUrl ?? "", at];
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
  return NextResponse.json({ total, registered: count.registered, limit: count.limit, open: count.open, teams });
}
