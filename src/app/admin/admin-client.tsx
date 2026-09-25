"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, Download, Loader2, LogOut, Search } from "lucide-react";
import AdminLogin from "@/components/AdminLogin";
import { cn } from "@/lib/utils";

interface Stats {
  issued: number;
  users: number;
  entryActive: number;
  entryUsed: number;
  veg: number;
  nonveg: number;
  male: number;
  female: number;
}

interface Scan {
  type: string;
  name: string;
  rollNo: string;
  food: string;
  usedAt: string | null;
  scannedBy: string;
}

interface Row {
  type: "ENTRY" | "FOOD";
  status: "ACTIVE" | "USED";
  token: string;
  createdAt: string;
  usedAt: string | null;
  scannedBy: string | null;
  name: string;
  serial: string;
  email: string;
  mobile: string;
  rollNo: string;
  gender: string;
  food: string;
}

const selectCls =
  "min-h-[44px] rounded-xl border border-line bg-surface px-3 py-2 text-sm text-cream focus:ring-2 focus:ring-brand";

function Bar({ label, v, total, tone }: { label: string; v: number; total: number; tone: string }) {
  const pct = total > 0 ? Math.round((v / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-fog">{label}</span>
        <span className="font-mono text-cream">{v} · {pct}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/40" role="img" aria-label={`${label}: ${v} of ${total}`}>
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [scans, setScans] = useState<Scan[]>([]);
  const [openToken, setOpenToken] = useState<string | null>(null);

  const check = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/me", { cache: "no-store" });
      setAuthed(Boolean((await r.json()).admin));
    } catch {
      setAuthed(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l, r] = await Promise.all([
        fetch("/api/admin/stats", { cache: "no-store" }),
        fetch(
          `/api/admin/passes?q=${encodeURIComponent(q)}&type=${type}&status=${status}&limit=200`,
          { cache: "no-store" },
        ),
        fetch("/api/admin/recent?limit=10", { cache: "no-store" }),
      ]);
      if (l.status === 401) {
        setAuthed(false);
        return;
      }
      if (s.ok) setStats((await s.json()) as Stats);
      if (l.ok) {
        const d = await l.json();
        setRows(d.rows as Row[]);
        setTotal(d.total as number);
      }
      if (r.ok) setScans(((await r.json()).rows as Scan[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [q, type, status]);

  useEffect(() => {
    // init once: auth check hits external API
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void check();
  }, [check]);

  useEffect(() => {
    // authed change pulls fresh server data
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (authed) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setRows([]);
    setStats(null);
    setScans([]);
    setOpenToken(null);
  }

  if (authed === null) {
    return (
      <div className="rank-card flex items-center gap-3 p-6 text-sm text-fog">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Checking admin…
      </div>
    );
  }
  if (!authed) return <AdminLogin onDone={() => setAuthed(true)} />;

  const cards = stats
    ? [
        { label: "Registered", v: stats.users },
        { label: "Entry in", v: stats.entryUsed, sub: `${stats.entryActive} pending` },
        { label: "Veg lunch", v: stats.veg },
        { label: "Non-veg lunch", v: stats.nonveg },
      ]
    : [];
  const entryPct = stats && stats.issued > 0 ? Math.round((stats.entryUsed / stats.issued) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Link
          href="/admin/scan"
          className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-black hover:bg-brandhover"
        >
          Open scanner
        </Link>
        {(["ALL", "ENTRY", "FOOD", "USERS"] as const).map((scope) => (
          <a
            key={scope}
            href={`/api/admin/export?scope=${scope}`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-fog hover:text-cream"
          >
            <Download className="h-4 w-4" aria-hidden />
            CSV {scope === "ALL" ? "all" : scope.toLowerCase()}
          </a>
        ))}
        <a
          href="/api/admin/export?scope=USERS&format=xlsx"
          title="Excel workbook: registrations + lunch summary sheets"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
        >
          <Download className="h-4 w-4" aria-hidden />
          Excel sheet
        </a>
        <button
          type="button"
          onClick={logout}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-fog hover:text-cream"
        >
          <LogOut className="h-4 w-4" aria-hidden /> Lock
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          title="Offline fallback: print full list before event, check names manually if network dies"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-fog hover:text-cream"
        >
          Print gate list
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rank-card p-4 text-center">
            <p className="text-3xl font-bold text-cream">{c.v}</p>
            <p className="mt-1 text-xs text-fog">{c.label}</p>
            {c.sub ? <p className="text-[11px] text-faint">{c.sub}</p> : null}
            {c.label === "Entry in" && stats ? (
              <div className="mx-auto mt-2 h-2 max-w-[120px] overflow-hidden rounded-full bg-black/40" role="img" aria-label={`Gate progress: ${entryPct}% entered`}>
                <div className="h-full rounded-full bg-green-500" style={{ width: `${entryPct}%` }} />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {stats ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rank-card space-y-3 p-4 sm:p-5">
            <h2 className="text-sm font-bold text-cream">Demographics</h2>
            <Bar label="Male" v={stats.male} total={stats.users} tone="bg-sky-500" />
            <Bar label="Female" v={stats.female} total={stats.users} tone="bg-pink-500" />
            <Bar label="Veg" v={stats.veg} total={stats.users} tone="bg-green-500" />
            <Bar label="Non-veg" v={stats.nonveg} total={stats.users} tone="bg-amber-500" />
          </div>
          <div className="rank-card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-cream">Recent gate scans</h2>
              <Link href="/admin/scan" className="text-xs text-fog underline decoration-line underline-offset-4 hover:text-cream">
                Open scanner
              </Link>
            </div>
            {scans.length === 0 ? (
              <p className="mt-3 text-sm text-fog">No scans yet — burns appear here live.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {scans.map((s) => (
                  <li key={`${s.rollNo}-${s.usedAt}`} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-cream">{s.name}</p>
                      <p className="truncate text-xs text-faint">
                        Roll {s.rollNo} · {s.food === "Veg" ? "VEG" : "NON-VEG"} · {s.scannedBy}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-fog">
                      {s.usedAt ? new Date(s.usedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
        className="rank-card flex flex-col gap-2 p-4 sm:flex-row sm:items-center print:hidden"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / email / roll no…"
            className="w-full min-h-[44px] rounded-xl border border-line bg-surface py-2 pr-3 pl-9 text-sm text-cream placeholder:text-faint focus:ring-2 focus:ring-brand"
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type" className={selectCls}>
          <option value="ALL">All types</option>
          <option value="ENTRY">Entry</option>
          <option value="FOOD">Food</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className={selectCls}>
          <option value="ALL">All status</option>
          <option value="ACTIVE">Active</option>
          <option value="USED">Used</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Search"}
        </button>
      </form>

      <div className="rank-card overflow-hidden">
        <div className="border-b border-line px-4 py-3 text-sm text-fog">
          {total} match{total === 1 ? "" : "es"} · newest first
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs text-faint uppercase">
                <th className="px-4 py-2">Sr</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2">Food</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Used at</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const open = openToken === r.token;
                return (
                <Fragment key={r.token}>
                <tr className="border-t border-line">
                  <td className="px-4 py-2 font-mono text-xs font-bold text-brand">{r.serial}</td>
                  <td className="px-4 py-2 font-medium text-cream">
                    <button
                      type="button"
                      onClick={() => setOpenToken(open ? null : r.token)}
                      aria-expanded={open}
                      className="inline-flex min-h-[44px] items-center gap-1.5 text-left hover:text-brand"
                    >
                      {r.name}
                      <ChevronDown className={cn("h-4 w-4 text-faint transition-transform", open && "rotate-180")} aria-hidden />
                    </button>
                  </td>
                  <td className="px-4 py-2 text-xs text-fog">
                    {r.email}
                    <br />
                    {r.mobile && r.mobile !== "—" ? <>{r.mobile}<br /></> : null}
                    Roll {r.rollNo}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-bold",
                        r.food === "Veg" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-red-400/40 bg-red-400/10 text-red-300",
                      )}
                    >
                      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", r.food === "Veg" ? "bg-emerald-400" : "bg-red-400")} />
                      {r.food === "Veg" ? "VEG" : "NON-VEG"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-mono text-xs",
                        r.type === "ENTRY" ? "bg-purple-500/15 text-purple-300" : "bg-green-500/15 text-green-300",
                      )}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        r.status === "USED" ? "bg-red-500/15 text-red-300" : "bg-green-500/15 text-green-300",
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-fog">{r.usedAt ?? "—"}</td>
                </tr>
                {open ? (
                <tr key={`${r.token}-detail`} className="border-t border-dashed border-line bg-black/20">
                  <td colSpan={7} className="px-4 py-3 text-xs">
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                      <div className="flex gap-2"><dt className="shrink-0 text-faint">Serial</dt><dd className="font-mono text-cream">{r.serial}</dd></div>
                      <div className="flex gap-2"><dt className="shrink-0 text-faint">Gender</dt><dd className="text-cream">{r.gender}</dd></div>
                      <div className="flex gap-2"><dt className="shrink-0 text-faint">Issued</dt><dd className="text-cream">{new Date(r.createdAt).toLocaleString("en-IN")}</dd></div>
                      <div className="flex gap-2"><dt className="shrink-0 text-faint">Gate</dt><dd className="text-cream">{r.scannedBy ?? "—"}</dd></div>
                      <div className="flex gap-2"><dt className="shrink-0 text-faint">Burned</dt><dd className="text-cream">{r.usedAt ? new Date(r.usedAt).toLocaleString("en-IN") : "—"}</dd></div>
                    </dl>
                    <p className="mt-2 break-all font-mono text-[11px] text-faint">{r.token}</p>
                  </td>
                </tr>
                ) : null}
                </Fragment>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-fog">
                    No passes yet. Share <code className="font-mono">/passes</code> link.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
