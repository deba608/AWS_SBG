"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, Search } from "lucide-react";
import AdminLogin from "@/components/AdminLogin";

interface Team {
  id: string;
  teamName: string;
  leader: { name: string; email: string; mobile: string; rollNo: string; year: string };
  members: { name: string; email: string; mobile: string; rollNo: string; year: string }[];
  createdAt: string;
}

export default function HackathonAdminClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAuthed(Boolean(d.admin)))
      .catch(() => setAuthed(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/hackathon", { cache: "no-store" });
      if (r.status === 401) {
        setAuthed(false);
        return;
      }
      if (r.ok) {
        const d = await r.json();
        setTeams(d.teams as Team[]);
        setTotal(d.total as number);
        setLimit(d.limit as number);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // authed change pulls fresh server data
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (authed) void load();
  }, [authed, load]);

  if (authed === null) {
    return (
      <div className="rank-card flex items-center gap-3 p-6 text-sm text-fog">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Checking admin…
      </div>
    );
  }
  if (!authed) return <AdminLogin onDone={() => setAuthed(true)} />;

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? teams.filter((t) =>
        [t.teamName, t.leader.name, t.leader.rollNo, t.leader.email, ...t.members.flatMap((m) => [m.name, m.rollNo, m.email])]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : teams;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Link
          href="/admin"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-5 py-2 text-sm text-fog hover:text-cream"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Dashboard
        </Link>
        <span className="inline-flex min-h-[44px] items-center rounded-full border border-brand/40 px-4 py-2 text-xs font-bold text-brand">
          {total}/{limit} teams
        </span>
        <span className="flex-1" aria-hidden />
        <a
          href="/api/admin/hackathon?format=csv"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-500"
        >
          <Download className="h-4 w-4" aria-hidden />
          CSV export
        </a>
      </div>

      <div className="rank-card flex items-center gap-2 p-4 print:hidden">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search team / name / roll no…"
            className="w-full min-h-[44px] rounded-xl border border-line bg-surface py-2 pr-3 pl-9 text-sm text-cream placeholder:text-faint focus:ring-2 focus:ring-brand"
          />
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Refresh"}
        </button>
      </div>

      <div className="rank-card overflow-hidden">
        <div className="border-b border-line px-4 py-3 text-sm text-fog">
          {filtered.length} team{filtered.length === 1 ? "" : "s"} · newest first
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs text-faint uppercase">
                <th className="px-4 py-2">Team</th>
                <th className="px-4 py-2">Leader</th>
                <th className="px-4 py-2">Members</th>
                <th className="px-4 py-2">Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t border-line align-top">
                  <td className="px-4 py-2 font-semibold text-cream">{t.teamName}</td>
                  <td className="px-4 py-2 text-xs text-fog">
                    <span className="font-medium text-cream">{t.leader.name}</span>
                    <br />{t.leader.email}<br />{t.leader.mobile} · {t.leader.rollNo} · {t.leader.year} yr
                  </td>
                  <td className="px-4 py-2 text-xs text-fog">
                    {t.members.length === 0 ? "—" : (
                      <ul className="space-y-1">
                        {t.members.map((m) => (
                          <li key={m.rollNo}>
                            <span className="font-medium text-cream">{m.name}</span> · {m.rollNo} · {m.year} yr
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-fog">
                    {new Date(t.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-fog">
                    No teams yet. Share <code className="font-mono">/hackathon</code> link.
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
