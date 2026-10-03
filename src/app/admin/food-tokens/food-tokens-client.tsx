"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import type { PDFDocument, PDFImage, PDFPage } from "pdf-lib";
import { Download, Loader2, Printer, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import AdminLogin from "@/components/AdminLogin";
import { cn } from "@/lib/utils";

interface TokenRow {
  name: string;
  serial: string;
  food: "Veg" | "Non-veg";
  rollNo: string;
  /** Late-addition / buffer token printed after the main sheets. */
  extra?: boolean;
  /** Auto buffer from live pull (rebuilt each pull) vs hand-typed extra (kept). */
  auto?: boolean;
}

/** Next free X-series serial (X01, X02…) — never collides with A-series passes. */
function nextExtraSerial(rows: TokenRow[]): string {
  let n = 0;
  for (const r of rows) {
    const m = /^X(\d+)$/i.exec(r.serial.trim());
    if (m) n = Math.max(n, Number(m[1]));
  }
  return `X${String(n + 1).padStart(2, "0")}`;
}

const DENSITY: { label: string; perPage: number; cols: number }[] = [
  { label: "10 / page", perPage: 10, cols: 2 },
  { label: "12 / page", perPage: 12, cols: 2 },
  { label: "15 / page", perPage: 15, cols: 3 },
  { label: "20 / page", perPage: 20, cols: 2 },
  { label: "24 / page", perPage: 24, cols: 3 },
  { label: "30 / page", perPage: 30, cols: 3 },
];

function normFood(v: string): "Veg" | "Non-veg" {
  return /non/i.test(v) ? "Non-veg" : "Veg";
}

/** Real scannable Code128 barcode of the serial — gate scanner reads it. */
function Barcode({ code, height, moduleWidth = 2 }: { code: string; height: number; moduleWidth?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      JsBarcode(ref.current, code, {
        format: "CODE128",
        width: moduleWidth,
        height,
        displayValue: false,
        margin: 0,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch {
      // leave blank; big serial text still printed below
    }
  }, [code, height, moduleWidth]);
  return (
    <svg
      ref={ref}
      role="img"
      aria-label={`Barcode for ${code}`}
      className="block max-h-full w-full"
      style={{ shapeRendering: "crispEdges" }}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

/** Serial order that survives A100+: compare the numeric tail, not the string. */
function serialCmp(a: string, b: string): number {
  const na = Number(/^A(\d+)$/i.exec(a.trim())?.[1]);
  const nb = Number(/^A(\d+)$/i.exec(b.trim())?.[1]);
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
  return a.localeCompare(b);
}

function Token({ row, compact, tiny }: { row: TokenRow; compact: boolean; tiny?: boolean }) {
  const veg = row.food === "Veg";
  return (
    <div
      className="relative flex h-full flex-col justify-start overflow-hidden rounded-md bg-white text-black"
      style={{ border: "1.5px solid #111" }}
    >
      <div className={cn("w-full shrink-0", veg ? "bg-green-600" : "bg-red-600", tiny ? "h-1" : "h-1.5")} />
      <div className={cn("flex min-h-0 items-start justify-between gap-2 px-2.5", tiny ? "pt-1" : "pt-1.5")}>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className={cn("truncate font-bold tracking-[0.18em] whitespace-nowrap text-neutral-500 uppercase", tiny ? "text-[8px]" : "text-[9px]")}>
            {tiny ? "AWS SCD 26 · Food" : "AWS Community Day · Food token"}
          </p>
          <p className={cn("font-bold leading-tight text-black", tiny ? "truncate text-[11px] whitespace-nowrap" : compact ? "text-[13px] break-words line-clamp-2" : "text-[15px] break-words line-clamp-2")}>{row.name}</p>
          {row.rollNo ? <p className={cn("truncate font-mono text-neutral-600", tiny ? "text-[8px]" : "mt-0.5 text-[10px]")}>{row.rollNo}</p> : null}
        </div>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 text-[10px] font-black tracking-wider whitespace-nowrap",
              veg ? "border-green-700 text-green-700" : "border-red-700 text-red-700",
            )}
          >
            {veg ? "VEG" : "NON-VEG"}
          </span>
          {row.extra && !tiny ? (
            <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-black tracking-wider whitespace-nowrap text-black">
              EXTRA
            </span>
          ) : null}
        </span>
      </div>
      <div className={cn("mt-auto flex shrink-0 items-center justify-between px-3", tiny ? "gap-2 py-0.5" : "gap-3 py-2")}>
        <div className="min-w-0 shrink-0">
          <p className={cn("font-mono font-black leading-none tracking-tight whitespace-nowrap text-black", tiny ? "text-[18px]" : compact ? "text-[28px]" : "text-[32px]")}>
            {row.serial}
          </p>
          {row.extra ? (
            <span className="mt-1 inline-block rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-black">
              EXTRA
            </span>
          ) : !tiny ? (
            <p className="mt-1 text-[9px] leading-tight whitespace-nowrap text-neutral-500">
              Show at food counter
            </p>
          ) : null}
        </div>
        <div
          className="flex min-w-0 flex-1 items-center justify-end overflow-hidden rounded-sm bg-white"
          style={{ height: tiny ? 28 : compact ? 48 : 60 }}
        >
          <Barcode code={row.serial} height={tiny ? 28 : compact ? 48 : 60} moduleWidth={tiny ? 1.4 : 1.8} />
        </div>
      </div>
    </div>
  );
}

export default function FoodTokensClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<TokenRow[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [foodFilter, setFoodFilter] = useState<"ALL" | "Veg" | "Non-veg">("ALL");
  const [density, setDensity] = useState(DENSITY[1]); // 12 / page default
  const [scope, setScope] = useState<"together" | "veg" | "nonveg" | "split" | "extras">("together");
  const [sortMode, setSortMode] = useState<"serial" | "name">("serial");
  const [extraName, setExtraName] = useState("");
  const [extraFood, setExtraFood] = useState<"Veg" | "Non-veg">("Veg");
  const [extraQty, setExtraQty] = useState(1);
  const [bufVeg, setBufVeg] = useState(5);
  const [bufNonveg, setBufNonveg] = useState(5);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAuthed(Boolean(d.admin)))
      .catch(() => setAuthed(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (foodFilter !== "ALL" && r.food !== foodFilter) return false;
      if (!needle) return true;
      const hay = `${r.name} ${r.serial} ${r.rollNo}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, foodFilter, q]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) =>
      sortMode === "name" ? a.name.localeCompare(b.name) : serialCmp(a.serial, b.serial),
    );
    return list;
  }, [filtered, sortMode]);

  if (authed === null) {
    return (
      <div className="rank-card flex items-center gap-3 p-6 text-sm text-fog print:hidden">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Checking admin…
      </div>
    );
  }
  if (!authed) return <AdminLogin onDone={() => setAuthed(true)} />;

  function chunk(list: TokenRow[]): TokenRow[][] {
    const out: TokenRow[][] = [];
    for (let i = 0; i < list.length; i += density.perPage) out.push(list.slice(i, i + density.perPage));
    return out;
  }

  // Print groups: split mode → veg sheets then non-veg sheets, numbered separately
  const printGroups: { label: string; pages: TokenRow[][] }[] =
    scope === "veg"
      ? [{ label: "VEG", pages: chunk(sorted.filter((r) => r.food === "Veg")) }]
      : scope === "nonveg"
        ? [{ label: "NON-VEG", pages: chunk(sorted.filter((r) => r.food === "Non-veg")) }]
        : scope === "split"
          ? [
              { label: "VEG", pages: chunk(sorted.filter((r) => r.food === "Veg")) },
              { label: "NON-VEG", pages: chunk(sorted.filter((r) => r.food === "Non-veg")) },
            ]
          : scope === "extras"
            ? [{ label: "EXTRA", pages: chunk(sorted.filter((r) => r.extra)) }]
            : [{ label: "", pages: chunk(sorted) }];
  const pages: TokenRow[][] = printGroups.flatMap((g) => g.pages);
  const totalSheets = pages.length;
  const rowsPerSheet = density.perPage / density.cols;
  const compact = rowsPerSheet >= 6;
  const tiny = rowsPerSheet >= 8;
  // 281mm usable height on A4 after 8mm margins; 2mm gaps + ~10mm footer
  const cellMm = Math.floor((281 - (rowsPerSheet - 1) * 2 - 10) / rowsPerSheet);
  const vegCount = filtered.filter((r) => r.food === "Veg").length;

  /** Fresh roster from upload/live pull must not wipe hand-added extras.
   * Auto buffers are rebuilt (not kept) so re-pulls don't stack duplicates. */
  function mergeKeepExtras(fresh: TokenRow[], prev: TokenRow[]): TokenRow[] {
    const extras = prev.filter((r) => r.extra && !r.auto);
    if (extras.length === 0) return fresh;
    const taken = new Set(fresh.map((r) => r.serial.toUpperCase()));
    const kept: TokenRow[] = [];
    for (const e of extras) {
      if (!taken.has(e.serial.toUpperCase())) {
        kept.push(e);
        taken.add(e.serial.toUpperCase());
      } else {
        // serial clash with roster (e.g. re-upload) → re-issue next X serial
        const serial = nextExtraSerial([...fresh, ...kept]);
        kept.push({ ...e, serial });
        taken.add(serial.toUpperCase());
      }
    }
    return [...fresh, ...kept];
  }

  function addExtras() {
    const qty = Math.min(Math.max(Math.floor(extraQty) || 1, 1), 50);
    const label = extraName.trim() || "EXTRA";
    pushExtras(label, extraFood, qty);
    setExtraName("");
    setMsg(`Added ${qty} extra ${extraFood} token${qty > 1 ? "s" : ""} — prints with the sheets below.`);
  }

  /** One-tap walk-in buffer: 5 blank tokens, no typing. */
  function addBuffer(food: "Veg" | "Non-veg") {
    pushExtras("EXTRA", food, 5);
    setScope("extras");
    setMsg(`Added 5 extra ${food} buffer tokens — print scope switched to extras only.`);
  }

  function pushExtras(label: string, food: "Veg" | "Non-veg", qty: number) {
    setRows((prev) => {
      const out = [...prev];
      for (let i = 0; i < qty; i++) {
        out.push({
          name: qty > 1 ? `${label} ${i + 1}` : label,
          serial: nextExtraSerial(out),
          food,
          rollNo: "",
          extra: true,
          auto: false,
        });
      }
      return out;
    });
  }

  async function uploadFile(f: File) {
    setBusy(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/admin/food-tokens/parse", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Parse failed.");
      setRows((prev) => mergeKeepExtras(d.rows as TokenRow[], prev));
      setMsg(`Loaded ${d.rows.length} tokens from ${f.name}. Extras kept.`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function loadLive() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/passes?q=&type=ENTRY&status=ALL&limit=1000", {
        cache: "no-store",
      });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const d = await res.json();
      const mapped: TokenRow[] = (d.rows as { name: string; serial: string; food: string; rollNo: string }[])
        .filter((r) => r.serial && r.serial !== "—")
        .map((r) => ({
          name: r.name,
          serial: r.serial.toUpperCase(),
          food: normFood(r.food),
          rollNo: r.rollNo === "—" ? "" : r.rollNo,
        }))
        .sort((a, b) => serialCmp(a.serial, b.serial));
      // On-the-spot buffers ride in the same pull — one print covers roster + extras.
      const v = Math.min(Math.max(Math.floor(bufVeg) || 0, 0), 50);
      const n = Math.min(Math.max(Math.floor(bufNonveg) || 0, 0), 50);
      const withBuffers = [...mapped];
      for (let i = 0; i < v; i++) {
        withBuffers.push({ name: `EXTRA ${i + 1}`, serial: nextExtraSerial(withBuffers), food: "Veg", rollNo: "", extra: true, auto: true });
      }
      for (let i = 0; i < n; i++) {
        withBuffers.push({ name: `EXTRA ${i + 1}`, serial: nextExtraSerial(withBuffers), food: "Non-veg", rollNo: "", extra: true, auto: true });
      }
      setRows((prev) => mergeKeepExtras(withBuffers, prev));
      setMsg(
        `Pulled ${mapped.length} live registrations` +
          (v + n > 0 ? ` + ${v + n} buffer extras (${v} veg / ${n} non-veg).` : ".") +
          " Hand-added extras kept.",
      );
    } catch {
      setMsg("Live pull failed — check network, or upload Excel instead.");
    } finally {
      setBusy(false);
    }
  }

  /** One-file A4 PDF of the current print scope — same sheets as Print, no dialog. */
  async function downloadPdf() {
    if (pages.length === 0 || busy) return;
    setBusy(true);
    setMsg("Building PDF…");
    try {
      const { PDFDocument: Doc, rgb: RGB, StandardFonts: SF } = await import("pdf-lib");
      const doc: PDFDocument = await Doc.create();
      const font = await doc.embedFont(SF.Helvetica);
      const bold = await doc.embedFont(SF.HelveticaBold);
      const mono = await doc.embedFont(SF.CourierBold);
      const PT = 2.83465; // 1mm in pt
      const M = 8 * PT;
      const PW = 210 * PT;
      const PH = 297 * PT;
      const W = PW - 2 * M;
      const H = PH - 2 * M;
      const cols = density.cols;
      const perRow = density.perPage / density.cols;
      const gap = 2 * PT;
      const footerH = 12 * PT;
      const cellW = (W - (cols - 1) * gap) / cols;
      const cellH = (H - (perRow - 1) * gap - footerH) / perRow;
      const barcodeCache = new Map<string, PDFImage>();

      const barcodePng = async (serial: string) => {
        const hit = barcodeCache.get(serial);
        if (hit) return hit;
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, serial, { format: "CODE128", width: 3, height: 90, displayValue: false, margin: 0 });
        const img = await doc.embedPng(canvas.toDataURL("image/png"));
        barcodeCache.set(serial, img);
        return img;
      };

      const fitName = (name: string, maxW: number, start: number): { text: string; size: number } => {
        let size = start;
        let text = name;
        while (size > 7) {
          const w = bold.widthOfTextAtSize(text, size);
          if (w <= maxW) break;
          if (text.length > 24 && size === start) text = `${text.slice(0, 23)}…`;
          else size -= 0.5;
        }
        return { text, size };
      };

      const drawToken = async (page: PDFPage, r: TokenRow, x: number, y: number) => {
        const veg = r.food === "Veg";
        const dark = veg ? RGB(0.08, 0.55, 0.25) : RGB(0.8, 0.15, 0.15);
        const tint = veg ? RGB(0.93, 0.98, 0.93) : RGB(0.99, 0.93, 0.93);
        const black = RGB(0, 0, 0);
        const gray = RGB(0.35, 0.35, 0.35);
        page.drawRectangle({ x, y, width: cellW, height: cellH, color: tint, borderColor: black, borderWidth: 1 });
        page.drawRectangle({ x, y, width: 5, height: cellH, color: dark });
        const pad = 6;
        const innerX = x + 5 + pad;
        const innerW = cellW - 5 - pad * 2;
        let cy = y + cellH - pad - 9;
        // food label (right) + kicker share the top line
        const label = veg ? "VEG" : "NON-VEG";
        const labelW = bold.widthOfTextAtSize(label, 10) + 10;
        page.drawRectangle({ x: x + cellW - pad - labelW, y: cy - 3, width: labelW, height: 15, color: dark });
        page.drawText(label, { x: x + cellW - pad - labelW + 5, y: cy + 1.5, size: 10, font: bold, color: RGB(1, 1, 1) });
        page.drawText("FOOD TOKEN", { x: innerX, y: cy, size: 8, font: bold, color: dark });
        cy -= 13;
        const { text: name, size: nameSize } = fitName(r.name.toUpperCase(), innerW, 12);
        page.drawText(name, { x: innerX, y: cy, size: nameSize, font: bold, color: black });
        cy -= nameSize + 3;
        if (r.rollNo) {
          page.drawText(r.rollNo.toUpperCase(), { x: innerX, y: cy, size: 8, font, color: gray });
          cy -= 11;
        }
        const serialSize = Math.min(22, cellH * 0.16);
        page.drawText(r.serial.toUpperCase(), { x: innerX, y: cy - serialSize, size: serialSize, font: mono, color: black });
        if (r.extra) {
          const ex = "EXTRA";
          const exW = bold.widthOfTextAtSize(ex, 8) + 8;
          page.drawRectangle({ x: innerX, y: cy - serialSize - 13, width: exW, height: 11, color: RGB(1, 0.75, 0.25) });
          page.drawText(ex, { x: innerX + 4, y: cy - serialSize - 10.5, size: 8, font: bold, color: black });
        }
        // barcode bottom-right
        const img = await barcodePng(r.serial);
        const bh = Math.min(44, cellH * 0.32);
        const bw = Math.min(innerW * 0.62, (bh / img.height) * img.width);
        page.drawImage(img, { x: x + cellW - pad - bw, y: y + pad, width: bw, height: bh });
      };

      for (const group of printGroups) {
        for (let pi = 0; pi < group.pages.length; pi++) {
          const page = doc.addPage([PW, PH]);
          const list = group.pages[pi];
          for (let i = 0; i < list.length; i++) {
            const col = i % cols;
            const rowI = Math.floor(i / cols);
            const cx = M + col * (cellW + gap);
            const cyTop = PH - M - rowI * (cellH + gap);
            await drawToken(page, list[i], cx, cyTop - cellH);
          }
          page.drawText(
            `${group.label ? `${group.label} · ` : ""}${pi + 1} / ${group.pages.length} · ${filtered.length} tokens`,
            { x: M, y: M - 14, size: 8, font, color: RGB(0.4, 0.4, 0.4) },
          );
        }
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "food-tokens.pdf";
      a.click();
      URL.revokeObjectURL(a.href);
      setMsg(`PDF ready — ${totalSheets} page${totalSheets === 1 ? "" : "s"}, ${filtered.length} tokens.`);
    } catch {
      setMsg("PDF failed — use Print → Save as PDF instead.");
    } finally {
      setBusy(false);
    }
  }

  function downloadCsv() {    const head = "serial,name,roll_no,food";
    const body = filtered
      .map((r) => [r.serial, `"${r.name.replace(/"/g, '""')}"`, r.rollNo, r.food].join(","))
      .join("\n");
    const blob = new Blob([`${head}\n${body}`], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "food-tokens.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <style>{`
        @page { size: A4; margin: 8mm; }
        @media print {
          body { background: #fff !important; }
          body * { visibility: hidden; }
          #food-print-area, #food-print-area * { visibility: visible; }
          #food-print-area { position: absolute; left: 0; right: 0; top: 0; }
          .food-page { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; height: 281mm !important; overflow: hidden !important; page-break-after: always; page-break-inside: avoid; }
          .food-page:last-child { page-break-after: auto; }
        }
      `}</style>

      {/* controls — screen only */}
      <div className="space-y-4 print:hidden">
        <div className="rank-card space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
              Upload Excel / CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadFile(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => void loadLive()}
              disabled={busy}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-5 py-2 text-sm text-fog hover:text-cream disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Live registrations + buffers
            </button>
            <label className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300">
              +VEG
              <input
                type="number"
                min={0}
                max={50}
                value={bufVeg}
                onChange={(e) => setBufVeg(Number(e.target.value))}
                aria-label="Extra veg buffer tokens"
                className="w-14 rounded-lg border border-line bg-surface px-2 py-1 text-center text-sm text-cream"
              />
            </label>
            <label className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-red-400/40 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-300">
              +NON-VEG
              <input
                type="number"
                min={0}
                max={50}
                value={bufNonveg}
                onChange={(e) => setBufNonveg(Number(e.target.value))}
                aria-label="Extra non-veg buffer tokens"
                className="w-14 rounded-lg border border-line bg-surface px-2 py-1 text-center text-sm text-cream"
              />
            </label>
            <span className="flex-1" aria-hidden />
            <button
              type="button"
              onClick={() => void downloadPdf()}
              disabled={busy || filtered.length === 0}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-60"
            >
              <Download className="h-4 w-4" aria-hidden />
              PDF file
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={filtered.length === 0}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60"
            >
              <Printer className="h-4 w-4" aria-hidden />
              Print {totalSheets > 0 ? `${totalSheets} page${totalSheets > 1 ? "s" : ""}` : ""}
            </button>
          </div>
          <p className="text-xs text-faint">
            Excel headers accepted: name · serial / sr / barcode · food / veg / meal · roll. Wrong food
            spellings default to Veg — fix in review table below before printing.
          </p>
          {msg ? <p role="status" className="text-xs text-fog">{msg}</p> : null}
        </div>

        <div className="rank-card space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-cream">Late additions / extras</p>
            <span className="rounded bg-amber-400/15 px-2 py-0.5 text-[11px] font-bold text-amber-200">
              X-series · never collides with A-serials
            </span>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addExtras();
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              value={extraName}
              onChange={(e) => setExtraName(e.target.value)}
              placeholder="Name — e.g. Volunteer, Guest, Buffer (blank = EXTRA)"
              autoComplete="off"
              maxLength={40}
              className="w-full min-h-[44px] flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-cream placeholder:text-faint focus:ring-2 focus:ring-brand"
            />
            <select
              value={extraFood}
              onChange={(e) => setExtraFood(e.target.value as typeof extraFood)}
              aria-label="Extra food preference"
              className="min-h-[44px] rounded-xl border border-line bg-surface px-3 py-2 text-sm text-cream focus:ring-2 focus:ring-brand"
            >
              <option value="Veg">VEG</option>
              <option value="Non-veg">NON-VEG</option>
            </select>
            <input
              type="number"
              min={1}
              max={50}
              value={extraQty}
              onChange={(e) => setExtraQty(Number(e.target.value))}
              aria-label="How many extra tokens"
              title="How many"
              className="min-h-[44px] w-24 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-cream focus:ring-2 focus:ring-brand"
            />
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-amber-400 px-5 py-2 text-sm font-bold text-black hover:bg-amber-300"
            >
              Add extra
            </button>
          </form>
          <p className="text-xs text-faint">
            For walk-ins, volunteers, recount buffers. Extras print with amber EXTRA tag and survive
            Excel re-uploads + live pulls.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => addBuffer("Veg")}
              className="inline-flex min-h-[44px] items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/20"
            >
              +5 VEG buffer, no typing
            </button>
            <button
              type="button"
              onClick={() => addBuffer("Non-veg")}
              className="inline-flex min-h-[44px] items-center rounded-full border border-red-400/40 bg-red-400/10 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-400/20"
            >
              +5 NON-VEG buffer, no typing
            </button>
          </div>
        </div>

        {rows.length > 0 ? (
          <div className="rank-card flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name / serial…"
                className="w-full min-h-[44px] rounded-xl border border-line bg-surface py-2 pr-3 pl-9 text-sm text-cream placeholder:text-faint focus:ring-2 focus:ring-brand"
              />
            </div>
            <select
              value={foodFilter}
              onChange={(e) => setFoodFilter(e.target.value as typeof foodFilter)}
              aria-label="Food filter"
              className="min-h-[44px] rounded-xl border border-line bg-surface px-3 py-2 text-sm text-cream focus:ring-2 focus:ring-brand"
            >
              <option value="ALL">All ({rows.length})</option>
              <option value="Veg">Veg only</option>
              <option value="Non-veg">Non-veg only</option>
            </select>
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-line px-4 py-2 text-sm text-fog hover:text-cream"
            >
              <Download className="h-4 w-4" aria-hidden /> CSV
            </button>
            <div role="group" aria-label="Tokens per page" className="flex overflow-hidden rounded-xl border border-line">
              {DENSITY.map((d) => (
                <button
                  key={d.perPage}
                  type="button"
                  onClick={() => setDensity(d)}
                  aria-pressed={density.perPage === d.perPage}
                  className={cn(
                    "min-h-[44px] px-3 py-2 text-xs font-bold",
                    density.perPage === d.perPage ? "bg-brand text-black" : "text-fog hover:text-cream",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div role="group" aria-label="Token order" className="flex overflow-hidden rounded-xl border border-line">
              {(
                [
                  ["serial", "Serial order"],
                  ["name", "Name A–Z"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSortMode(v)}
                  aria-pressed={sortMode === v}
                  title={v === "name" ? "Alphabetical — fastest for finding random people" : "Registration order"}
                  className={cn(
                    "min-h-[44px] px-3 py-2 text-xs font-bold",
                    sortMode === v ? "bg-brand text-black" : "text-fog hover:text-cream",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <div className="rank-card overflow-hidden">
            <div className="border-b border-line px-4 py-3 text-sm text-fog">
              {filtered.length} tokens · {vegCount} veg · {filtered.length - vegCount} non-veg
              {filtered.some((r) => r.extra) ? (
                <> · <span className="font-bold text-amber-200">{filtered.filter((r) => r.extra).length} extra</span></>
              ) : null}{" "}
              · {totalSheets} A4 page{totalSheets === 1 ? "" : "s"}
            </div>
            <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3 print:hidden" role="group" aria-label="Print scope">
              {(
                [
                  ["together", "Print: main sheets (all incl. extras)"],
                  ["veg", "VEG only"],
                  ["nonveg", "NON-VEG only"],
                  ["split", "Veg + Non-veg split"],
                  ["extras", "Extras only — walk-ins"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setScope(v)}
                  aria-pressed={scope === v}
                  className={cn(
                    "inline-flex min-h-[40px] items-center rounded-full border px-4 py-1.5 text-xs font-bold",
                    scope === v
                      ? "border-amber-400 bg-amber-400/15 text-amber-200"
                      : "border-line text-fog hover:text-cream",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="max-h-72 overflow-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="text-xs text-faint uppercase">
                    <th className="px-4 py-2">Serial</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Food (tap to toggle)</th>
                    <th className="px-4 py-2"><span className="sr-only">Remove</span></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => (
                    <tr key={r.serial} className="border-t border-line">
                      <td className="px-4 py-2 font-mono text-xs font-bold text-brand">
                        {r.serial}
                        {r.extra ? (
                          <span className="ml-1.5 rounded bg-amber-400 px-1.5 py-0.5 align-middle font-sans text-[10px] font-black text-black">
                            EXTRA
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2 text-cream">{r.name}</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() =>
                            setRows((prev) =>
                              prev.map((p) =>
                                p.serial === r.serial
                                  ? { ...p, food: p.food === "Veg" ? "Non-veg" : "Veg" }
                                  : p,
                              ),
                            )
                          }
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-xs font-bold",
                            r.food === "Veg"
                              ? "border-emerald-400/40 text-emerald-300"
                              : "border-red-400/40 text-red-300",
                          )}
                        >
                          {r.food === "Veg" ? "VEG" : "NON-VEG"}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          aria-label={`Remove ${r.serial}`}
                          onClick={() => setRows((prev) => prev.filter((p) => p.serial !== r.serial))}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-faint hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {/* A4 pages — preview on screen, print target */}
      {totalSheets > 0 ? (
        <div id="food-print-area" className="mt-6 space-y-6 print:mt-0 print:space-y-0">
          {printGroups.map((group) =>
            group.pages.map((pageRows, pi) => (
              <section
                key={`${group.label}-${pi}`}
                className="food-page mx-auto flex w-full max-w-[820px] flex-col bg-white p-4 shadow-xl print:p-0 print:shadow-none"
                style={{ height: "281mm" }}
                aria-label={`Food token sheet ${group.label} ${pi + 1} of ${group.pages.length}`}
              >
                <div
                  className="grid flex-1 gap-3"
                  style={{ gridTemplateColumns: `repeat(${density.cols}, minmax(0, 1fr))`, alignContent: "start" }}
                >
                  {pageRows.map((r) => (
                    <div
                      key={r.serial}
                      className="border border-dashed border-neutral-400 p-1.5"
                      style={{ height: `${cellMm}mm` }}
                    >
                      <Token row={r} compact={compact} tiny={tiny} />
                    </div>
                  ))}
                </div>
                <p className="mt-2 shrink-0 text-center font-mono text-[10px] text-neutral-500 print:text-neutral-600">
                  {pi + 1} / {group.pages.length}
                </p>
              </section>
            )),
          )}
        </div>
      ) : (
        <div className="rank-card mt-6 p-8 text-center text-sm text-fog print:hidden">
          No tokens yet — upload Excel or pull live registrations.
        </div>
      )}
    </>
  );
}
