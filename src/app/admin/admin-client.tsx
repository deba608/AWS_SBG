"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronDown, Download, Loader2, LogOut, Printer, RotateCw, Search, Trash2, UserPlus } from "lucide-react";
import AdminLogin from "@/components/AdminLogin";
import FoodSelect from "@/components/FoodSelect";
import GenderSelect from "@/components/GenderSelect";
import YearSelect from "@/components/YearSelect";
import { YEARS, deriveYearFromRollNo } from "@/lib/validate-contact";
import { cn } from "@/lib/utils";

interface YearSlot {
  registered: number;
  limit: number;
  open: boolean;
}

interface Stats {
  issued: number;
  users: number;
  entryActive: number;
  entryUsed: number;
  veg: number;
  nonveg: number;
  male: number;
  female: number;
  foodUsed: number;
  foodActive: number;
  years: Record<string, number>;
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
  userId: string | null;
  serial: string;
  email: string;
  mobile: string;
  rollNo: string;
  gender: string;
  food: string;
  year: string;
}

interface RegSettings {
  maxPasses: number | null;
  registrationsOpen: boolean | null;
  registered: number;
  limit: number;
  open: boolean;
  perYear?: Record<string, YearSlot>;
  yearLimits?: Record<string, number | null>;
  defaultYearLimit?: number;
}

interface Daywise {
  day1: { label: string; teams: number; teamLimit: number; teamsOpen: boolean; members: number; lunchVeg: number; lunchNonveg: number; href: string };
  day2: { label: string; note: string; forms: { label: string; url: string }[] };
  day3: {
    label: string;
    registered: number;
    limit: number;
    open: boolean;
    perYear: Record<string, { registered: number; limit: number; open: boolean }>;
    lunchVeg: number;
    lunchNonveg: number;
    href: string;
  };
}

const selectCls =
  "min-h-[44px] rounded-xl border border-line bg-surface px-3 py-2 text-sm text-cream focus:ring-2 focus:ring-brand";

function Bar({ label, v, total, tone }: { label: string; v: number; total: number; tone: string }) {  const pct = total > 0 ? Math.round((v / total) * 100) : 0;
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

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section aria-label={label} className="space-y-3">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
        {"//"} {label}
      </h2>
      {children}
    </section>
  );
}

export default function AdminClient() {  const [authed, setAuthed] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [scans, setScans] = useState<Scan[]>([]);
  const [openToken, setOpenToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<RegSettings | null>(null);
  const [limitDraft, setLimitDraft] = useState("");
  const [yearDrafts, setYearDrafts] = useState<Record<string, string>>({});
  const [migrating, setMigrating] = useState(false);
  const [migrateMsg, setMigrateMsg] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", mobile: "", rollNo: "", gender: "", food: "", year: "" });
  const [editErr, setEditErr] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [dangerArmed, setDangerArmed] = useState(false);
  const [dangerText, setDangerText] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);
  const [dangerMsg, setDangerMsg] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", email: "", mobile: "", rollNo: "", gender: "", food: "", year: "" });
  const [addErr, setAddErr] = useState("");
  const [savingAdd, setSavingAdd] = useState(false);
  const [addMsg, setAddMsg] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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
      const [s, l, r, g] = await Promise.all([
        fetch("/api/admin/stats", { cache: "no-store" }),
        fetch(
          `/api/admin/passes?q=${encodeURIComponent(q)}&type=${type}&status=${status}&year=${yearFilter}&limit=200`,
          { cache: "no-store" },
        ),
        fetch("/api/admin/recent?limit=10", { cache: "no-store" }),
        fetch("/api/admin/settings", { cache: "no-store" }),
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
      if (g.ok) {
        const d = (await g.json()) as RegSettings;
        setSettings(d);
        setLimitDraft((prev) => (prev === "" ? String(d.limit) : prev));
        setYearDrafts((prev) => {
          if (Object.keys(prev).length > 0) return prev;
          const init: Record<string, string> = {};
          for (const y of YEARS) {
            const slot = d.perYear?.[y];
            init[y] = String(slot?.limit ?? d.yearLimits?.[y] ?? d.defaultYearLimit ?? 60);
          }
          return init;
        });
      }
    } finally {
      setLoading(false);
    }
  }, [q, type, status, yearFilter]);

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

  useEffect(() => {
    // debounced search as admin types / flips filters
    if (!authed) return;
    const t = window.setTimeout(() => {
      void load();
    }, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, q, type, status, yearFilter]);

  useEffect(() => {
    // live gate view: stats + scans refresh every 15s
    if (!authed) return;
    const t = window.setInterval(() => {
      void load();
    }, 15000);
    return () => window.clearInterval(t);
  }, [authed, load]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setRows([]);
    setStats(null);
    setScans([]);
    setOpenToken(null);
    setSettings(null);
    setEditingUserId(null);
  }

  async function saveSettings(patch: { maxPasses?: number | null; registrationsOpen?: boolean | null; yearLimits?: Record<string, number | null> }) {
    setSavingSettings(true);
    setSettingsMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Save failed.");
      setSettings(d as RegSettings);
      setLimitDraft(String((d as RegSettings).limit));
      const per = (d as RegSettings).perYear;
      if (per) {
        const next: Record<string, string> = {};
        for (const y of YEARS) next[y] = String(per[y]?.limit ?? 60);
        setYearDrafts(next);
      }
      setSettingsMsg("Saved.");
    } catch (err) {
      setSettingsMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function migrateYears() {
    setMigrating(true);
    setMigrateMsg("");
    try {
      const res = await fetch("/api/admin/migrate-years", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Migration failed.");
      const byYear = d.byYear as Record<string, number> | undefined;
      const parts = byYear ? Object.entries(byYear).map(([y, n]) => `${y}: ${n}`).join(" · ") : "";
      setMigrateMsg(`Fixed ${d.fixed} of ${d.total} registrations. ${parts}`);
      await load();
    } catch (err) {
      setMigrateMsg(err instanceof Error ? err.message : "Migration failed.");
    } finally {
      setMigrating(false);
    }
  }

  function startEdit(r: Row) {
    if (!r.userId) return;
    setEditErr("");
    setEditForm({
      name: r.name,
      email: r.email,
      mobile: r.mobile === "—" ? "" : r.mobile,
      rollNo: r.rollNo,
      gender: r.gender,
      food: r.food,
      year: YEARS.includes(r.year as (typeof YEARS)[number]) ? r.year : "",
    });
    setEditingUserId(r.userId);
  }

  async function saveEdit() {
    if (!editingUserId) return;
    setSavingEdit(true);
    setEditErr("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUserId,
          patch: {
            name: editForm.name,
            email: editForm.email,
            mobile: editForm.mobile,
            rollNo: editForm.rollNo,
            gender: editForm.gender,
            food: editForm.food,
            year: editForm.year,
          },
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        const fieldErr = d.errors ? Object.values(d.errors as Record<string, string>).join(" ") : "";
        throw new Error(fieldErr || d.error || "Update failed.");
      }
      setEditingUserId(null);
      await load();
    } catch (err) {
      setEditErr(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteAll() {
    if (dangerText !== "DELETE ALL") {
      setDangerMsg('Type DELETE ALL to confirm.');
      return;
    }
    if (!window.confirm(`Delete ALL ${settings?.registered ?? rows.length} registrations? Export CSV first — this cannot be undone.`)) return;
    setDeletingAll(true);
    setDangerMsg("");
    try {
      const res = await fetch("/api/admin/passes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE ALL" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Delete failed.");
      setDangerMsg(`Deleted ${d.removedUsers} registrations (${d.removedPasses} passes).`);
      setDangerArmed(false);
      setDangerText("");
      await load();
    } catch (err) {
      setDangerMsg(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingAll(false);
    }
  }

  async function saveNew() {
    setSavingAdd(true);
    setAddErr("");
    setAddMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newForm.name,
          email: newForm.email,
          mobile: newForm.mobile,
          rollNo: newForm.rollNo,
          gender: newForm.gender,
          food: newForm.food,
          year: newForm.year,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        const fieldErr = d.errors ? Object.values(d.errors as Record<string, string>).join(" ") : "";
        throw new Error(fieldErr || d.error || "Create failed.");
      }
      setAddMsg(`Added ${d.user.name} · serial ${d.user.serial}.`);
      setNewForm({ name: "", email: "", mobile: "", rollNo: "", gender: "", food: "", year: "" });
      await load();
    } catch (err) {
      setAddErr(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setSavingAdd(false);
    }
  }

  async function removeUser(userId: string, name: string) {
    if (!window.confirm(`Delete registration for ${name}? Their pass stops working. Cannot undo.`)) return;
    setDeletingUserId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Delete failed.");
      setOpenToken(null);
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingUserId(null);
    }
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
        { label: "Food served", v: stats.foodUsed, sub: `${stats.foodActive} pending` },
        { label: "Veg lunch", v: stats.veg },
        { label: "Non-veg lunch", v: stats.nonveg },
      ]
    : [];
  const yearCards =
    stats && settings?.perYear
      ? YEARS.map((y) => ({
          label: `${y} year`,
          v: settings.perYear?.[y]?.registered ?? stats.years?.[y] ?? 0,
          sub: `limit ${settings.perYear?.[y]?.limit ?? 60}`,
        }))
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
        <Link
          href="/admin/hackathon"
          className="inline-flex min-h-[44px] items-center rounded-full border border-line px-5 py-2 text-sm font-semibold text-fog hover:text-cream"
        >
          Hackathon teams
        </Link>
        {settings ? (
          <span
            className={cn(
              "inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-xs font-bold",
              settings.open ? "border-green-500/40 text-green-300" : "border-red-500/40 text-red-300",
            )}
          >
            <span aria-hidden className={cn("mr-2 h-2 w-2 rounded-full", settings.open ? "bg-green-400" : "bg-red-400")} />
            {settings.open ? `OPEN · ${settings.registered}/${settings.limit}` : "CLOSED"}
          </span>
        ) : null}
        <span className="flex-1" aria-hidden />
        <button
          type="button"
          onClick={() => void load()}
          title="Refresh now (auto-refreshes every 15s)"
          aria-label="Refresh dashboard"
          className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-line text-fog hover:text-cream"
        >
          <RotateCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
        </button>
        <button
          type="button"
          onClick={logout}
          title="Lock admin"
          aria-label="Lock admin"
          className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-line text-fog hover:text-cream"
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <Section label="Overview">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
      </Section>

      {yearCards.length > 0 ? (
      <Section label="Year-wise seats">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {yearCards.map((c) => {
          const slot = settings?.perYear?.[c.label.split(" ")[0]];
          const pct = slot && slot.limit > 0 ? Math.round((slot.registered / slot.limit) * 100) : 0;
          return (
          <div key={c.label} className="rank-card p-4 text-center">
            <p className="text-3xl font-bold text-cream">{c.v}</p>
            <p className="mt-1 text-xs text-fog">{c.label}</p>
            {c.sub ? <p className="text-[11px] text-faint">{c.sub}</p> : null}
            <div className="mx-auto mt-2 h-2 max-w-[120px] overflow-hidden rounded-full bg-black/40" role="img" aria-label={`${c.label} seats: ${pct}% filled`}>
              <div className={cn("h-full rounded-full", pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-brand")} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
          );
        })}
      </div>
      </Section>
      ) : null}

      {settings ? (
        <div className="rank-card p-4 sm:p-5 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-cream">Registration control</h2>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex flex-1 items-center gap-2 text-sm text-fog">
              Max passes
              <input
                type="number"
                min={1}
                max={10000}
                value={limitDraft}
                onChange={(e) => setLimitDraft(e.target.value)}
                className="w-full min-h-[44px] max-w-[140px] rounded-xl border border-line bg-surface px-3 py-2 text-sm text-cream focus:ring-2 focus:ring-brand"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={savingSettings}
                onClick={() => void saveSettings({ maxPasses: Number(limitDraft) })}
                className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-60"
              >
                Set limit
              </button>
              <button
                type="button"
                disabled={savingSettings}
                onClick={() => void saveSettings({ registrationsOpen: !settings.open })}
                className={cn(
                  "inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-semibold",
                  settings.open ? "border border-red-400/50 text-red-300 hover:bg-red-500/10" : "bg-green-600 text-white hover:bg-green-500",
                )}
              >
                {settings.open ? "Stop registration" : "Resume registration"}
              </button>
            </div>
          </div>
          {settingsMsg ? <p className="mt-2 text-xs text-fog">{settingsMsg}</p> : null}
          <div className="mt-4 border-t border-line pt-4">
            <h3 className="text-sm font-bold text-cream">Year-wise limits <span className="font-normal text-faint">(customize per year, default 60)</span></h3>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {YEARS.map((y) => {
                const slot = settings.perYear?.[y];
                return (
                  <label key={y} className="block rounded-xl border border-line bg-surface p-3 text-xs text-faint">
                    {y} year
                    <span className="ml-1 font-mono text-faint">({slot?.registered ?? 0}/{slot?.limit ?? 60})</span>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={yearDrafts[y] ?? String(slot?.limit ?? 60)}
                      onChange={(e) => setYearDrafts((d) => ({ ...d, [y]: e.target.value }))}
                      aria-label={`${y} year limit`}
                      className="mt-1.5 w-full min-h-[44px] rounded-xl border border-line bg-ink/60 px-3 py-2 text-sm text-cream focus:ring-2 focus:ring-brand"
                    />
                  </label>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={savingSettings}
                onClick={() => {
                  const parsed: Record<string, number> = {};
                  for (const y of YEARS) parsed[y] = Number(yearDrafts[y] ?? settings.perYear?.[y]?.limit ?? 60);
                  void saveSettings({ yearLimits: parsed });
                }}
                className="mt-3 inline-flex min-h-[44px] items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-60"
              >
                Save year limits
              </button>
              <button
                type="button"
                disabled={migrating}
                onClick={() => void migrateYears()}
                title="Assign 24…→3rd year, 25…→2nd year (26…→1st, 23…→4th) to old registrations saved before the Year field"
                className="mt-3 inline-flex min-h-[44px] items-center rounded-full border border-line px-4 py-2 text-sm font-semibold text-fog hover:text-cream disabled:opacity-60"
              >
                {migrating ? "Assigning…" : "Auto-assign years from roll no"}
              </button>
            </div>
            {migrateMsg ? <p role="status" className="mt-2 text-xs text-fog">{migrateMsg}</p> : null}
          </div>
          <details className="mt-4 border-t border-line pt-4">
            <summary className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold text-fog hover:text-cream">
              Additional settings
            </summary>
            <div className="mt-3">
              <h3 className="text-sm font-bold text-red-300">Danger zone</h3>
            <p className="mt-1 text-xs leading-relaxed text-fog">
              Delete every registration + pass, reset serials to A01. Export CSV/Excel first — cannot undo.
            </p>
            {!dangerArmed ? (
              <button
                type="button"
                onClick={() => { setDangerArmed(true); setDangerMsg(""); }}
                className="mt-3 inline-flex min-h-[44px] items-center rounded-full border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10"
              >
                Delete all registrations…
              </button>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                <label className="text-xs text-fog">
                  Type <code className="font-mono font-bold text-red-300">DELETE ALL</code> to confirm ({settings.registered} regs)
                  <input
                    value={dangerText}
                    onChange={(e) => setDangerText(e.target.value)}
                    placeholder="DELETE ALL"
                    autoComplete="off"
                    className="mt-1.5 w-full min-h-[44px] max-w-xs rounded-xl border border-red-500/50 bg-surface px-3 py-2 font-mono text-sm text-cream placeholder:text-faint focus:ring-2 focus:ring-red-500"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={deletingAll}
                    onClick={() => void deleteAll()}
                    className="inline-flex min-h-[44px] items-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                  >
                    {deletingAll ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Delete everything"}
                  </button>
                  <button
                    type="button"
                    disabled={deletingAll}
                    onClick={() => { setDangerArmed(false); setDangerText(""); setDangerMsg(""); }}
                    className="inline-flex min-h-[44px] items-center rounded-full border border-line px-4 py-2 text-sm text-fog hover:text-cream"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {dangerMsg ? <p role="status" className="mt-2 text-xs text-fog">{dangerMsg}</p> : null}
            </div>
          </details>
        </div>
      ) : null}

      <Section label="Manage registrations">
        <div className="rank-card p-4 sm:p-5 print:hidden">
          <button
            type="button"
            onClick={() => { setAddOpen((v) => !v); setAddErr(""); setAddMsg(""); }}
            aria-expanded={addOpen}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-black hover:bg-brandhover"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            {addOpen ? "Close add form" : "Add registration (walk-in)"}
          </button>
          {addOpen ? (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(
                  [
                    ["name", "Full name *", "Debashish Pradhan"],
                    ["rollNo", "Roll no *", "24BTCSE26"],
                    ["email", "College mail *", "24btcse26@suiit.ac.in"],
                    ["mobile", "Mobile *", "9437512345"],
                  ] as const
                ).map(([k, label, ph]) => (
                  <label key={k} className="block text-xs text-faint">
                    {label}
                    <input
                      value={newForm[k]}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNewForm((f) => {
                          const next = { ...f, [k]: v };
                          if (k === "rollNo" && !f.year) {
                            const detected = deriveYearFromRollNo(v);
                            if (detected) next.year = detected;
                          }
                          return next;
                        });
                      }}
                      placeholder={ph}
                      autoComplete="off"
                      className="mt-1 w-full min-h-[44px] rounded-xl border border-line bg-surface px-3 py-2 text-sm text-cream placeholder:text-faint focus:ring-2 focus:ring-brand"
                    />
                  </label>
                ))}
                <GenderSelect
                  value={newForm.gender}
                  onChange={(g) => setNewForm((f) => ({ ...f, gender: g }))}
                />
                <FoodSelect
                  value={newForm.food}
                  onChange={(f) => setNewForm((s) => ({ ...s, food: f }))}
                  labelId="admin-add-food"
                />
                <YearSelect
                  value={newForm.year}
                  onChange={(y) => setNewForm((s) => ({ ...s, year: y }))}
                  labelId="admin-add-year"
                />
              </div>
              {addErr ? <p role="alert" className="text-xs text-red-300">{addErr}</p> : null}
              {addMsg ? <p role="status" className="text-xs text-green-300">{addMsg}</p> : null}
              <button
                type="button"
                disabled={savingAdd}
                onClick={() => void saveNew()}
                className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-60"
              >
                {savingAdd ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Issue pass"}
              </button>
            </div>
          ) : null}
        </div>
      </Section>

      {stats ? (
      <Section label="Gate live">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rank-card space-y-3 p-4 sm:p-5">
            <h2 className="text-sm font-bold text-cream">Demographics</h2>
            <Bar label="Male" v={stats.male} total={stats.users} tone="bg-sky-500" />
            <Bar label="Female" v={stats.female} total={stats.users} tone="bg-pink-500" />
            <Bar label="Veg" v={stats.veg} total={stats.users} tone="bg-green-500" />
            <Bar label="Non-veg" v={stats.nonveg} total={stats.users} tone="bg-amber-500" />
            {YEARS.map((y) => (
              <Bar key={y} label={`${y} year`} v={stats.years?.[y] ?? 0} total={stats.users} tone="bg-brand" />
            ))}
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
      </Section>
      ) : null}

      <Section label="Pass list">
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
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} aria-label="Year" className={selectCls}>
          <option value="ALL">All years</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y} year</option>
          ))}
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
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-xs text-faint uppercase">
                <th className="px-4 py-2">Sr</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2">Year</th>
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
                    <span className="rounded-full bg-brand/10 border border-brand/40 px-2 py-0.5 font-mono text-xs text-brand">
                      {r.year && r.year !== "—" ? `${r.year} yr` : "—"}
                    </span>
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
                  <td className="px-4 py-2 text-xs text-fog">
                    {r.usedAt
                      ? new Date(r.usedAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "—"}
                  </td>
                </tr>
                {open ? (
                <tr key={`${r.token}-detail`} className="border-t border-dashed border-line bg-black/20">
                  <td colSpan={8} className="px-4 py-3 text-xs">
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                      <div className="flex gap-2"><dt className="shrink-0 text-faint">Serial</dt><dd className="font-mono text-cream">{r.serial}</dd></div>
                      <div className="flex gap-2"><dt className="shrink-0 text-faint">Gender</dt><dd className="text-cream">{r.gender}</dd></div>
                      <div className="flex gap-2"><dt className="shrink-0 text-faint">Year</dt><dd className="text-cream">{r.year}</dd></div>
                      <div className="flex gap-2"><dt className="shrink-0 text-faint">Food</dt><dd className="text-cream">{r.food}</dd></div>
                      <div className="flex gap-2"><dt className="shrink-0 text-faint">Issued</dt><dd className="text-cream">{new Date(r.createdAt).toLocaleString("en-IN")}</dd></div>
                      <div className="flex gap-2"><dt className="shrink-0 text-faint">Gate</dt><dd className="text-cream">{r.scannedBy ?? "—"}</dd></div>
                      <div className="flex gap-2"><dt className="shrink-0 text-faint">Burned</dt><dd className="text-cream">{r.usedAt ? new Date(r.usedAt).toLocaleString("en-IN") : "—"}</dd></div>
                    </dl>
                    <p className="mt-2 break-all font-mono text-[11px] text-faint">{r.token}</p>
                    {r.userId ? (
                      <div className="mt-3">
                        {editingUserId === r.userId ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {(
                                [
                                  ["name", "Full name"],
                                  ["email", "College mail"],
                                  ["mobile", "Mobile"],
                                  ["rollNo", "Roll no"],
                                ] as const
                              ).map(([k, label]) => (
                                <label key={k} className="block text-xs text-faint">
                                  {label}
                                  <input
                                    value={editForm[k]}
                                    onChange={(e) => setEditForm((f) => ({ ...f, [k]: e.target.value }))}
                                    className="mt-1 w-full min-h-[44px] rounded-xl border border-line bg-surface px-3 py-2 text-sm text-cream focus:ring-2 focus:ring-brand"
                                  />
                                </label>
                              ))}
                              <label className="block text-xs text-faint">
                                Gender
                                <select
                                  value={editForm.gender}
                                  onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}
                                  className={selectCls + " mt-1 w-full"}
                                >
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                </select>
                              </label>
                              <label className="block text-xs text-faint">
                                Food
                                <select
                                  value={editForm.food}
                                  onChange={(e) => setEditForm((f) => ({ ...f, food: e.target.value }))}
                                  className={selectCls + " mt-1 w-full"}
                                >
                                  <option value="Veg">Veg</option>
                                  <option value="Non-veg">Non-veg</option>
                                </select>
                              </label>
                              <label className="block text-xs text-faint">
                                Year
                                <select
                                  value={editForm.year}
                                  onChange={(e) => setEditForm((f) => ({ ...f, year: e.target.value }))}
                                  className={selectCls + " mt-1 w-full"}
                                >
                                  <option value="">Select year</option>
                                  {YEARS.map((y) => (
                                    <option key={y} value={y}>{y} year</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                            {editErr ? <p role="alert" className="text-xs text-red-300">{editErr}</p> : null}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={savingEdit}
                                onClick={() => void saveEdit()}
                                className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-60"
                              >
                                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingUserId(null)}
                                className="inline-flex min-h-[44px] items-center rounded-full border border-line px-4 py-2 text-sm text-fog hover:text-cream"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(r)}
                              className="inline-flex min-h-[44px] items-center rounded-full border border-line px-4 py-2 text-xs font-semibold text-fog hover:text-cream"
                            >
                              Modify details
                            </button>
                            <button
                              type="button"
                              disabled={deletingUserId === r.userId}
                              onClick={() => r.userId && void removeUser(r.userId, r.name)}
                              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-red-500/50 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                            >
                              {deletingUserId === r.userId ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              )}
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </td>
                </tr>
                ) : null}
                </Fragment>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-fog">
                    No passes yet. Share <code className="font-mono">/passes</code> link.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      </Section>

      <Section label="Exports & offline">
        <div className="rank-card p-4 sm:p-5 print:hidden">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(["ALL", "ENTRY", "FOOD", "USERS"] as const).map((scope) => (
              <a
                key={scope}
                href={`/api/admin/export?scope=${scope}`}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-line px-4 py-2 text-sm text-fog hover:text-cream"
              >
                <Download className="h-4 w-4" aria-hidden />
                CSV {scope === "ALL" ? "all" : scope.toLowerCase()}
              </a>
            ))}
            <a
              href="/api/admin/export?scope=USERS&format=xlsx"
              title="Excel workbook: registrations + lunch summary sheets"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
            >
              <Download className="h-4 w-4" aria-hidden />
              Excel sheet
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              title="Print full list before event — manual check if network dies"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-line px-4 py-2 text-sm text-fog hover:text-cream"
            >
              <Printer className="h-4 w-4" aria-hidden />
              Print gate list
            </button>
            <Link
              href="/admin/food-tokens"
              title="Upload Excel → food tokens, 10 per A4, print & cut"
              className="col-span-2 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 sm:col-span-3"
            >
              <Printer className="h-4 w-4" aria-hidden />
              Food tokens — print (10–15/A4)
            </Link>
          </div>
          <p className="mt-3 text-xs text-faint">
            CSV opens in Excel/Sheets. Print the gate list before the event as the offline fallback.
          </p>
        </div>
      </Section>
    </div>
  );
}
