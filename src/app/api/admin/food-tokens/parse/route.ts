import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";

export interface FoodTokenRow {
  name: string;
  serial: string;
  food: "Veg" | "Non-veg";
  rollNo: string;
}

function normFood(v: unknown): "Veg" | "Non-veg" {
  const s = String(v ?? "").trim().toLowerCase();
  if (/non[\s-_]?veg|nonveg|nveg|nv|chicken|mutton|egg/i.test(s)) return "Non-veg";
  return "Veg";
}

function headerIndex(header: string[], ...needles: string[]): number {
  const h = header.map((c) => String(c ?? "").trim().toLowerCase());
  for (const n of needles) {
    const i = h.findIndex((c) => c.includes(n));
    if (i >= 0) return i;
  }
  return -1;
}

/** Serial order that survives A100+: compare the numeric tail, not the string. */
function serialCmp(a: string, b: string): number {
  const na = Number(/^A(\d+)$/i.exec(a.trim())?.[1]);
  const nb = Number(/^A(\d+)$/i.exec(b.trim())?.[1]);
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
  return a.localeCompare(b);
}

function normalizeTable(header: string[], data: string[][]): FoodTokenRow[] {
  const nameI = headerIndex(header, "name", "student", "attendee");
  const serialI = headerIndex(header, "serial", "sr", "sl", "barcode", "token", "id", "no");
  const foodI = headerIndex(header, "food", "veg", "meal", "lunch", "diet");
  const rollI = headerIndex(header, "roll");
  const out: FoodTokenRow[] = [];
  for (const cells of data) {
    const name = String(cells[nameI >= 0 ? nameI : 0] ?? "").trim();
    let serial = String(cells[serialI >= 0 ? serialI : 1] ?? "").trim().toUpperCase();
    const food = normFood(cells[foodI >= 0 ? foodI : 2]);
    const rollNo = rollI >= 0 ? String(cells[rollI] ?? "").trim().toUpperCase() : "";
    if (!name && !serial) continue;
    if (!serial) serial = `A${String(out.length + 1).padStart(2, "0")}`;
    out.push({ name: name || "—", serial, food, rollNo });
  }
  // serial order, de-dupe by serial (keep first)
  const seen = new Set<string>();
  return out
    .sort((a, b) => serialCmp(a.serial, b.serial))
    .filter((r) => (seen.has(r.serial) ? false : (seen.add(r.serial), true)));
}

function parseCsv(text: string): { header: string[]; data: string[][] } {
  const rows: string[][] = [];
  let cur = "";
  let row: string[] = [];
  let quoted = false;
  const push = () => {
    row.push(cur);
    cur = "";
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") push();
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      push();
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cur += ch;
  }
  push();
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  if (rows.length === 0) return { header: [], data: [] };
  return { header: rows[0].map((c) => c.trim()), data: rows.slice(1) };
}

/**
 * POST multipart: file (.xlsx / .csv) → normalized food-token rows.
 * Accepts flexible headers: name, serial/sr/barcode, food/veg/meal, roll.
 * Admin cookie required.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Send multipart with a `file` field." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  const filename = (file as File).name?.toLowerCase() ?? "";
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) return NextResponse.json({ error: "Empty file." }, { status: 400 });

  try {
    if (filename.endsWith(".csv") || !filename.endsWith(".xlsx")) {
      const text = buf.toString("utf8").replace(/^\uFEFF/, "");
      // xlsx mislabeled as csv guard: binary → reject
      if (text.includes("PK\x03\x04")) throw new Error("That looks like .xlsx — rename to .xlsx and retry.");
      const { header, data } = parseCsv(text);
      if (header.length === 0) return NextResponse.json({ error: "No rows found." }, { status: 400 });
      return NextResponse.json({ rows: normalizeTable(header, data), count: data.length });
    }
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    if (!ws) return NextResponse.json({ error: "Workbook has no sheets." }, { status: 400 });
    const raw: string[][] = [];
    ws.eachRow((r) => {
      const vals: string[] = [];
      r.eachCell({ includeEmpty: true }, (c) => vals.push(String(c.value ?? "").trim()));
      raw.push(vals);
    });
    if (raw.length < 2) return NextResponse.json({ error: "Sheet needs a header row + data rows." }, { status: 400 });
    const rows = normalizeTable(raw[0], raw.slice(1));
    return NextResponse.json({ rows, count: rows.length });
  } catch (err) {
    console.error("[food-tokens/parse]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Parse failed. Use .xlsx or .csv." },
      { status: 400 },
    );
  }
}
