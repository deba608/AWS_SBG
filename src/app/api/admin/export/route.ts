import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listPasses, passStats } from "@/lib/pass-store";

function csvCell(v: string | null | undefined): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "ALL"; // ALL | ENTRY | FOOD | USERS
  const format = searchParams.get("format") ?? "csv"; // csv | xlsx
  const { rows } = await listPasses({ limit: 1000 });

  let header: string[];
  let lines: string[][];
  if (scope === "USERS") {
    const seen = new Map<string, { serial: string; name: string; email: string; mobile: string; rollNo: string; gender: string; food: string; createdAt: string }>();
    for (const { user } of rows) {
      if (!user || seen.has(user.id)) continue;
      seen.set(user.id, {
        serial: user.serial ?? "",
        name: user.name,
        email: user.email,
        mobile: user.mobile ?? "",
        rollNo: user.rollNo,
        gender: user.gender,
        food: user.food,
        createdAt: user.createdAt,
      });
    }
    header = ["serial", "name", "email", "mobile", "roll_no", "gender", "food", "registered_at"];
    lines = [...seen.values()].map((u) => [u.serial, u.name, u.email, u.mobile, u.rollNo, u.gender, u.food, u.createdAt]);
  } else {
    const filtered = scope === "ALL" ? rows : rows.filter((r) => r.pass.type === scope);
    header = ["serial", "name", "email", "mobile", "roll_no", "gender", "food", "type", "entry_status", "entry_used_at", "food_status", "food_used_at", "token"];
    lines = filtered.map(({ pass, user }) => [
      user?.serial ?? "",
      user?.name ?? "",
      user?.email ?? "",
      user?.mobile ?? "",
      user?.rollNo ?? "",
      user?.gender ?? "",
      user?.food ?? "",
      pass.type,
      pass.status,
      pass.usedAt ?? "",
      pass.food ?? "ACTIVE",
      pass.foodUsedAt ?? "",
      pass.token,
    ]);
  }

  if (format === "xlsx") {
    const stats = await passStats();
    const wb = new ExcelJS.Workbook();
    wb.creator = "AWS SBG";
    wb.created = new Date();
    const main = wb.addWorksheet(scope === "USERS" ? "Registrations" : "Passes");
    main.columns = header.map((h) => ({ header: h, key: h, width: 22 }));
    main.getRow(1).font = { bold: true };
    for (const line of lines) main.addRow(line);
    const lunch = wb.addWorksheet("Lunch summary");
    lunch.columns = [
      { header: "metric", key: "metric", width: 22 },
      { header: "count", key: "count", width: 12 },
    ];
    lunch.getRow(1).font = { bold: true };
    for (const [metric, count] of [
      ["registered", stats.users],
      ["passes_issued", stats.issued],
      ["veg", stats.veg],
      ["non_veg", stats.nonveg],
      ["entry_scanned", stats.entryUsed],
      ["entry_pending", stats.entryActive],
      ["lunch_served", stats.foodUsed],
      ["lunch_pending", stats.foodActive],
    ] as const) lunch.addRow([metric, count]);
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="passes-${scope.toLowerCase()}.xlsx"`,
      },
    });
  }

  const csv = [header, ...lines].map((r) => r.map(csvCell).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="passes-${scope.toLowerCase()}.csv"`,
    },
  });
}
