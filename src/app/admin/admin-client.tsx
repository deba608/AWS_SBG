"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, LogOut, Search } from "lucide-react";
import AdminLogin from "@/components/AdminLogin";
import { cn } from "@/lib/utils";

interface Stats {
  issued: number;
  users: number;
  entryActive: number;
  entryUsed: number;
  veg: number;
  nonveg: number;
}

interface Row {
  type: "ENTRY" | "FOOD";
  status: "ACTIVE" | "USED";
  token: string;
  createdAt: string;
  usedAt: string | null;
  scannedBy: string | null;
  name: string;
  email: string;
  rollNo: string;
  gender: string;
  food: string;
}

const selectCls =
  "min-h-[44px] rounded-xl border border-line bg-surface px-3 py-2 text-sm text-cream focus:ring-2 focus:ring-brand";

export default function AdminClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(false);

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
      const [s, l] = await Promise.all([
        fetch("/api/admin/stats", { cache: "no-store" }),
        fetch(
          `/api/admin/passes?q=${encodeURIComponent(q)}&type=${type}&status=${status}&limit=200`,
          { cache: "no-store" },
        ),
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
          </div>
        ))}
      </div>

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
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2">Food</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Used at</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.token} className="border-t border-line">
                  <td className="px-4 py-2 font-medium text-cream">{r.name}</td>
                  <td className="px-4 py-2 text-xs text-fog">
                    {r.email}
                    <br />
                    Roll {r.rollNo}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        r.food === "Veg" ? "bg-green-500/15 text-green-300" : "bg-amber-500/15 text-amber-300",
                      )}
                    >
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
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-fog">
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
