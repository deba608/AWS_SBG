import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listPasses } from "@/lib/pass-store";

function csvCell(v: string | null | undefined): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "ALL"; // ALL | ENTRY | FOOD | USERS
  const { rows } = await listPasses({ limit: 1000 });

  let header: string[];
  let lines: string[][];
  if (scope === "USERS") {
    const seen = new Map<string, { name: string; email: string; mobile: string; createdAt: string }>();
    for (const { user } of rows) {
      if (!user || seen.has(user.id)) continue;
      seen.set(user.id, {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        mobile: user.mobile,
        createdAt: user.createdAt,
      });
    }
    header = ["name", "email", "mobile", "registered_at"];
    lines = [...seen.values()].map((u) => [u.name, u.email, u.mobile, u.createdAt]);
  } else {
    const filtered = scope === "ALL" ? rows : rows.filter((r) => r.pass.type === scope);
    header = ["name", "email", "mobile", "type", "status", "used_at", "scanned_by", "token"];
    lines = filtered.map(({ pass, user }) => [
      user ? `${user.firstName} ${user.lastName}` : "",
      user?.email ?? "",
      user?.mobile ?? "",
      pass.type,
      pass.status,
      pass.usedAt ?? "",
      pass.scannedBy ?? "",
      pass.token,
    ]);
  }

  const csv = [header, ...lines].map((r) => r.map(csvCell).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="passes-${scope.toLowerCase()}.csv"`,
    },
  });
}
