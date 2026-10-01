"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, Printer, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import AdminLogin from "@/components/AdminLogin";
import { cn } from "@/lib/utils";

interface TokenRow {
  name: string;
  serial: string;
  food: "Veg" | "Non-veg";
  rollNo: string;
}

const DENSITY: { label: string; perPage: number; cols: number }[] = [
  { label: "10 / page", perPage: 10, cols: 2 },
  { label: "12 / page", perPage: 12, cols: 2 },
  { label: "15 / page", perPage: 15, cols: 3 },
];

function normFood(v: string): "Veg" | "Non-veg" {
  return /non/i.test(v) ? "Non-veg" : "Veg";
}

/** Deterministic barcode-look stripes from serial. Manual-match aid, not a scan standard. */
function Barcode({ code, compact }: { code: string; compact?: boolean }) {
  const bars = useMemo(() => {
    const seed = `*${code.toUpperCase()}*`;
    const out: { w: number; black: boolean }[] = [];
    // quiet zone
    out.push({ w: 6, black: false });
    for (const ch of seed) {
      let n = ch.charCodeAt(0);
      for (let b = 0; b < 8; b++) {
        const bit = (n >> (7 - b)) & 1;
        out.push({ w: bit ? 4 : 2, black: b % 2 === 0 ? bit === 1 : bit === 0 });
        if (b % 2 === 1) out.push({ w: 2, black: false });
      }
      out.push({ w: 3, black: false });
    }
    return out;
  }, [code]);
  return (
    <div className={cn("flex items-stretch", compact ? "h-7" : "h-9")} role="img" aria-label={`Barcode for ${code}`}>
      {bars.map((b, i) => (
        <span
          key={i}
          style={{ width: b.w, background: b.black ? "#111" : "transparent" }}
          className="h-full shrink-0"
        />
      ))}
    </div>
  );
}

function Token({ row, compact }: { row: TokenRow; compact: boolean }) {
  const veg = row.food === "Veg";
  return (
    <div
      className="relative flex h-full flex-col justify-between overflow-hidden rounded-md bg-white text-black"
      style={{ border: "1.5px solid #111" }}
    >
      <div className={cn("w-full", veg ? "bg-green-600" : "bg-red-600", compact ? "h-1" : "h-1.5")} />
      <div className="flex items-start justify-between gap-2 px-2.5 pt-1.5">
        <div className="min-w-0">
          <p className="text-[9px] font-bold tracking-[0.18em] text-neutral-500 uppercase">
            AWS Community Day · Food token
          </p>
          <p className={cn("truncate font-bold leading-tight", compact ? "text-[11px]" : "text-[13px]")}>{row.name}</p>
          {row.rollNo ? <p className="text-[10px] text-neutral-600">{row.rollNo}</p> : null}
        </div>
        <span
          className={cn(
            "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-black tracking-wider",
            veg ? "border-green-700 text-green-700" : "border-red-700 text-red-700",
          )}
        >
          {veg ? "VEG" : "NON-VEG"}
        </span>
      </div>
      <div className="flex items-end justify-between gap-2 px-2.5 pb-2">
        <div>
          <p className={cn("font-mono font-black leading-none tracking-tight", compact ? "text-[20px]" : "text-[26px]")}>{row.serial}</p>
          <div className="mt-1 max-w-[150px] overflow-hidden">
            <Barcode code={row.serial} compact={compact} />
          </div>
        </div>
        <div className="pb-0.5 text-right">
          <p className="text-[9px] leading-tight text-neutral-500">
            Show at
            <br />
            food counter
          </p>
          <div
            className={cn(
              "mx-auto mt-1 h-4 w-4 rounded-full border-2",
              veg ? "border-green-700" : "border-red-700",
            )}
            aria-hidden
          >
            <div className={cn("m-[2px] h-2 w-2 rounded-full", veg ? "bg-green-600" : "bg-red-600")} />
          </div>
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
  const [scope, setScope] = useState<"together" | "veg" | "nonveg" | "split">("together");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAuthed(Boolean(d.admin)))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <div className="rank-card flex items-center gap-3 p-6 text-sm text-fog print:hidden">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Checking admin…
      </div>
    );
  }
  if (!authed) return <AdminLogin onDone={() => setAuthed(true)} />;

  const filtered = rows.filter((r) => {
    if (foodFilter !== "ALL" && r.food !== foodFilter) return false;
    if (!q.trim()) return true;
    const hay = `${r.name} ${r.serial} ${r.rollNo}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  function chunk(list: TokenRow[]): TokenRow[][] {
    const out: TokenRow[][] = [];
    for (let i = 0; i < list.length; i += density.perPage) out.push(list.slice(i, i + density.perPage));
    return out;
  }

  // Print groups: split mode → veg sheets then non-veg sheets, numbered separately
  const printGroups: { label: string; pages: TokenRow[][] }[] =
    scope === "veg"
      ? [{ label: "VEG", pages: chunk(filtered.filter((r) => r.food === "Veg")) }]
      : scope === "nonveg"
        ? [{ label: "NON-VEG", pages: chunk(filtered.filter((r) => r.food === "Non-veg")) }]
        : scope === "split"
          ? [
              { label: "VEG", pages: chunk(filtered.filter((r) => r.food === "Veg")) },
              { label: "NON-VEG", pages: chunk(filtered.filter((r) => r.food === "Non-veg")) },
            ]
          : [{ label: "", pages: chunk(filtered) }];
  const pages: TokenRow[][] = printGroups.flatMap((g) => g.pages);
  const totalSheets = pages.length;
  const rowsPerSheet = density.perPage / density.cols;
  const compact = rowsPerSheet >= 6;
  // 281mm usable height on A4 after 8mm margins; 2mm gaps + ~10mm footer
  const cellMm = Math.floor((281 - (rowsPerSheet - 1) * 2 - 10) / rowsPerSheet);
  const vegCount = filtered.filter((r) => r.food === "Veg").length;

  async function uploadFile(f: File) {
    setBusy(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/admin/food-tokens/parse", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Parse failed.");
      setRows(d.rows as TokenRow[]);
      setMsg(`Loaded ${d.rows.length} tokens from ${f.name}.`);
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
        .sort((a, b) => a.serial.localeCompare(b.serial));
      setRows(mapped);
      setMsg(`Pulled ${mapped.length} live registrations.`);
    } catch {
      setMsg("Live pull failed — check network, or upload Excel instead.");
    } finally {
      setBusy(false);
    }
  }

  function downloadCsv() {
    const head = "serial,name,roll_no,food";
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
          .food-page { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; page-break-after: always; }
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
              Use live registrations
            </button>
            <span className="flex-1" aria-hidden />
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
          </div>
        ) : null}

        {rows.length > 0 ? (
          <div className="rank-card overflow-hidden">
            <div className="border-b border-line px-4 py-3 text-sm text-fog">
              {filtered.length} tokens · {vegCount} veg · {filtered.length - vegCount} non-veg ·{" "}
              {totalSheets} A4 page{totalSheets === 1 ? "" : "s"}
            </div>
            <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3 print:hidden" role="group" aria-label="Print scope">
              {(
                [
                  ["together", "Print: all together"],
                  ["veg", "VEG only"],
                  ["nonveg", "NON-VEG only"],
                  ["split", "Veg + Non-veg split"],
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
                  {filtered.map((r) => (
                    <tr key={r.serial} className="border-t border-line">
                      <td className="px-4 py-2 font-mono text-xs font-bold text-brand">{r.serial}</td>
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
                className="food-page mx-auto w-full max-w-[820px] bg-white p-4 shadow-xl print:p-0 print:shadow-none"
                aria-label={`Food token sheet ${group.label} ${pi + 1} of ${group.pages.length}`}
              >
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: `repeat(${density.cols}, minmax(0, 1fr))` }}
                >
                  {pageRows.map((r) => (
                    <div
                      key={r.serial}
                      className="border border-dashed border-neutral-400 p-1.5"
                      style={{ height: `${cellMm}mm` }}
                    >
                      <Token row={r} compact={compact} />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-center font-mono text-[10px] text-neutral-500 print:text-neutral-600">
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
