"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Download, Loader2, Plus, Search, Trash2, UserPlus } from "lucide-react";
import AdminLogin from "@/components/AdminLogin";
import { YEARS } from "@/lib/validate-contact";
import type { MemberErrors, TeamErrors } from "@/lib/hackathon-store";
import { cn } from "@/lib/utils";

const PREFS = ["Hardware", "Software", "Both"] as const;

interface Member {
  name: string;
  email: string;
  mobile: string;
  rollNo: string;
  year: string;
  gender?: string;
  githubUrl?: string;
  lunch?: string;
}

interface Team {
  id: string;
  teamName: string;
  preference?: string;
  leader: Member;
  members: Member[];
  createdAt: string;
}

interface MemberDraft {
  name: string;
  email: string;
  mobile: string;
  rollNo: string;
  year: string;
  gender: string;
  githubUrl: string;
  lunch: string;
}

interface TeamDraft {
  teamName: string;
  preference: string;
  leader: MemberDraft;
  members: MemberDraft[];
}

const blankMember = (): MemberDraft => ({
  name: "",
  email: "",
  mobile: "",
  rollNo: "",
  year: "",
  gender: "",
  githubUrl: "",
  lunch: "",
});

const blankTeam = (): TeamDraft => ({
  teamName: "",
  preference: "",
  leader: blankMember(),
  members: [blankMember(), blankMember(), blankMember()],
});

function allMembers(t: Team): Member[] {
  return [t.leader, ...t.members];
}

function toDraft(t: Team): TeamDraft {
  const m = (x: Member): MemberDraft => ({
    name: x.name,
    email: x.email,
    mobile: x.mobile,
    rollNo: x.rollNo,
    year: x.year ?? "",
    gender: x.gender ?? "",
    githubUrl: x.githubUrl ?? "",
    lunch: x.lunch ?? "",
  });
  return { teamName: t.teamName, preference: t.preference ?? "", leader: m(t.leader), members: t.members.map(m) };
}

const inputCls =
  "mt-1 w-full min-h-[44px] rounded-xl border border-line bg-surface px-3 py-2 text-sm text-cream placeholder:text-faint focus:ring-2 focus:ring-brand";
const selectCls =
  "min-h-[44px] rounded-xl border border-line bg-surface px-3 py-2 text-sm text-cream focus:ring-2 focus:ring-brand";

function MemberEditor({
  title,
  value,
  onChange,
  errors,
  showGithub,
  onRemove,
  removable,
}: {
  title: string;
  value: MemberDraft;
  onChange: (v: MemberDraft) => void;
  errors?: MemberErrors;
  showGithub?: boolean;
  onRemove?: () => void;
  removable?: boolean;
}) {
  const set = (k: keyof MemberDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...value, [k]: e.target.value });
  return (
    <div className="rounded-xl border border-line bg-ink/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-cream">{title}</p>
        {removable ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${title}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-faint hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block text-xs text-faint">
          Full name *
          <input value={value.name} onChange={set("name")} placeholder="Aarav Sharma" autoComplete="off" className={inputCls} />
          {errors?.name ? <span className="text-red-300">{errors.name}</span> : null}
        </label>
        <label className="block text-xs text-faint">
          Roll no *
          <input value={value.rollNo} onChange={set("rollNo")} placeholder="24BTCSE01" autoComplete="off" className={inputCls} />
          {errors?.rollNo ? <span className="text-red-300">{errors.rollNo}</span> : null}
        </label>
        <label className="block text-xs text-faint">
          College mail *
          <input value={value.email} onChange={set("email")} placeholder="24btcse01@suiit.ac.in" autoComplete="off" className={inputCls} />
          {errors?.email ? <span className="text-red-300">{errors.email}</span> : null}
        </label>
        <label className="block text-xs text-faint">
          Mobile *
          <input value={value.mobile} onChange={set("mobile")} placeholder="9437100001" autoComplete="off" className={inputCls} />
          {errors?.mobile ? <span className="text-red-300">{errors.mobile}</span> : null}
        </label>
        <label className="block text-xs text-faint">
          Year *
          <select value={value.year} onChange={set("year")} className={selectCls + " mt-1 w-full"}>
            <option value="">Select year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y} year</option>
            ))}
          </select>
          {errors?.year ? <span className="text-red-300">{errors.year}</span> : null}
        </label>
        <label className="block text-xs text-faint">
          Gender *
          <select value={value.gender} onChange={set("gender")} className={selectCls + " mt-1 w-full"}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors?.gender ? <span className="text-red-300">{errors.gender}</span> : null}
        </label>
        <label className="block text-xs text-faint">
          Day-1 lunch *
          <select value={value.lunch} onChange={set("lunch")} className={selectCls + " mt-1 w-full"}>
            <option value="">Select lunch</option>
            <option value="Veg">Veg</option>
            <option value="Non-veg">Non-veg</option>
          </select>
          {errors?.lunch ? <span className="text-red-300">{errors.lunch}</span> : null}
        </label>
        {showGithub ? (
          <label className="block text-xs text-faint sm:col-span-2">
            Leader GitHub profile URL *
            <input value={value.githubUrl} onChange={set("githubUrl")} placeholder="https://github.com/username" autoComplete="off" className={inputCls} />
            {errors?.githubUrl ? <span className="text-red-300">{errors.githubUrl}</span> : null}
          </label>
        ) : null}
      </div>
    </div>
  );
}

function TeamForm({
  draft,
  onChange,
  errors,
  idPrefix,
}: {
  draft: TeamDraft;
  onChange: (d: TeamDraft) => void;
  errors: TeamErrors;
  idPrefix: string;
}) {
  const total = 1 + draft.members.length;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block text-xs text-faint">
          Team name *
          <input
            value={draft.teamName}
            onChange={(e) => onChange({ ...draft, teamName: e.target.value })}
            placeholder="Binary Builders"
            autoComplete="off"
            className={inputCls}
          />
          {errors.teamName ? <span className="text-red-300">{errors.teamName}</span> : null}
        </label>
        <label className="block text-xs text-faint">
          Project preference *
          <select
            value={draft.preference}
            onChange={(e) => onChange({ ...draft, preference: e.target.value })}
            className={selectCls + " mt-1 w-full"}
          >
            <option value="">Select track</option>
            {PREFS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {errors.preference ? <span className="text-red-300">{errors.preference}</span> : null}
        </label>
      </div>
      <MemberEditor
        title="Team leader"
        value={draft.leader}
        onChange={(v) => onChange({ ...draft, leader: v })}
        errors={errors.leader}
        showGithub
      />
      {draft.members.map((m, i) => (
        <MemberEditor
          key={`${idPrefix}-m-${i}`}
          title={`Teammate ${i + 1}`}
          value={m}
          onChange={(v) => onChange({ ...draft, members: draft.members.map((p, j) => (j === i ? v : p)) })}
          errors={errors.members?.[i]}
          removable={draft.members.length > 1}
          onRemove={() => onChange({ ...draft, members: draft.members.filter((_, j) => j !== i) })}
        />
      ))}
      {total < 4 ? (
        <button
          type="button"
          onClick={() => onChange({ ...draft, members: [...draft.members, blankMember()] })}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-fog hover:text-cream"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add teammate ({total}/4)
        </button>
      ) : null}
      {errors.team ? <p role="alert" className="text-xs text-red-300">{errors.team}</p> : null}
      <p className="text-xs text-faint">Squad must be exactly 4 (leader + 3 teammates) to save.</p>
    </div>
  );
}

export default function HackathonAdminClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(0);
  const [lunch, setLunch] = useState<{ veg: number; nonveg: number; total: number } | null>(null);
  const [q, setQ] = useState("");
  const [prefFilter, setPrefFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<TeamDraft | null>(null);
  const [editErrors, setEditErrors] = useState<TeamErrors>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<TeamDraft>(blankTeam());
  const [addErrors, setAddErrors] = useState<TeamErrors>({});
  const [savingAdd, setSavingAdd] = useState(false);
  const [addMsg, setAddMsg] = useState("");

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
        if (d.lunch) setLunch(d.lunch as { veg: number; nonveg: number; total: number });
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
  const filtered = teams.filter((t) => {
    if (prefFilter !== "ALL" && (t.preference ?? "") !== prefFilter) return false;
    if (!needle) return true;
    return [t.teamName, t.preference ?? "", t.leader.name, t.leader.rollNo, t.leader.email, ...t.members.flatMap((m) => [m.name, m.rollNo, m.email])]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
  const prefCounts = PREFS.map((p) => ({ p, n: teams.filter((t) => t.preference === p).length }));

  function startEdit(t: Team) {
    setEditErrors({});
    setEditDraft(toDraft(t));
    setEditingId(t.id);
    setOpenId(t.id);
  }

  async function saveEdit() {
    if (!editingId || !editDraft) return;
    setSavingEdit(true);
    setEditErrors({});
    try {
      const res = await fetch("/api/admin/hackathon", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, patch: editDraft }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d.errors) {
          setEditErrors(d.errors as TeamErrors);
          return;
        }
        throw new Error(d.error ?? "Update failed.");
      }
      setEditingId(null);
      setEditDraft(null);
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function saveNew() {
    setSavingAdd(true);
    setAddErrors({});
    setAddMsg("");
    try {
      const res = await fetch("/api/admin/hackathon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addDraft),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d.errors) {
          setAddErrors(d.errors as TeamErrors);
          return;
        }
        throw new Error(d.error ?? "Create failed.");
      }
      setAddMsg(`Added team ${d.team.teamName}.`);
      setAddDraft(blankTeam());
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setSavingAdd(false);
    }
  }

  async function removeTeam(id: string, name: string) {
    if (!window.confirm(`Delete team ${name}? All ${4} member slots free up. Cannot undo.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/hackathon", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Delete failed.");
      if (openId === id) setOpenId(null);
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

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
        {prefCounts.map(({ p, n }) => (
          <span key={p} className="inline-flex min-h-[44px] items-center rounded-full border border-line px-3 py-2 text-xs text-fog">
            {p}: <span className="ml-1 font-mono font-bold text-cream">{n}</span>
          </span>
        ))}
        {lunch ? (
          <span className="inline-flex min-h-[44px] items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300" title="Hackathon Day-1 lunch only — not Community Day lunch">
            Day-1 lunch · VEG {lunch.veg} / NON-VEG {lunch.nonveg}
          </span>
        ) : null}
        <span className="flex-1" aria-hidden />
        <a
          href="/api/admin/hackathon?format=csv"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-500"
        >
          <Download className="h-4 w-4" aria-hidden />
          CSV export
        </a>
      </div>

      <div className="rank-card p-4 sm:p-5 print:hidden">
        <button
          type="button"
          onClick={() => { setAddOpen((v) => !v); setAddErrors({}); setAddMsg(""); }}
          aria-expanded={addOpen}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-black hover:bg-brandhover"
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          {addOpen ? "Close add form" : "Add team (walk-in)"}
        </button>
        {addOpen ? (
          <div className="mt-4 space-y-3">
            <TeamForm draft={addDraft} onChange={setAddDraft} errors={addErrors} idPrefix="hack-add" />
            {addMsg ? <p role="status" className="text-xs text-green-300">{addMsg}</p> : null}
            <button
              type="button"
              disabled={savingAdd}
              onClick={() => void saveNew()}
              className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-60"
            >
              {savingAdd ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Register team"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="rank-card flex flex-col gap-2 p-4 sm:flex-row sm:items-center print:hidden">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search team / name / roll no…"
            className="w-full min-h-[44px] rounded-xl border border-line bg-surface py-2 pr-3 pl-9 text-sm text-cream placeholder:text-faint focus:ring-2 focus:ring-brand"
          />
        </div>
        <select value={prefFilter} onChange={(e) => setPrefFilter(e.target.value)} aria-label="Track" className={selectCls}>
          <option value="ALL">All tracks</option>
          {PREFS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-60"
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
              {filtered.map((t) => {
                const open = openId === t.id;
                const editing = editingId === t.id;
                return (
                <Fragment key={t.id}>
                <tr className="border-t border-line align-top">
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : t.id)}
                      aria-expanded={open}
                      className="inline-flex min-h-[44px] items-center gap-1.5 text-left hover:text-brand"
                    >
                      <span className="font-semibold text-cream">{t.teamName}</span>
                      <ChevronDown className={cn("h-4 w-4 text-faint transition-transform", open && "rotate-180")} aria-hidden />
                    </button>
                    {t.preference ? (
                      <span className="ml-2 inline-block rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 align-middle text-[11px] font-bold text-brand">{t.preference}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-xs text-fog">
                    <span className="font-medium text-cream">{t.leader.name}</span>
                    <br />{t.leader.email}<br />{t.leader.mobile} · {t.leader.rollNo} · {t.leader.year} yr
                    {t.leader.lunch ? (
                      <span className={cn(
                        "ml-1.5 inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold",
                        t.leader.lunch === "Veg" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-red-400/40 bg-red-400/10 text-red-300",
                      )}>
                        {t.leader.lunch === "Veg" ? "VEG" : "NON-VEG"}
                      </span>
                    ) : null}
                    {t.leader.githubUrl ? (
                      <><br /><a href={t.leader.githubUrl} target="_blank" rel="noopener noreferrer" className="break-all text-brand underline decoration-brand/50 underline-offset-4 hover:decoration-cream">GitHub</a></>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-xs text-fog">
                    {t.members.length === 0 ? "—" : (
                      <ul className="space-y-1">
                        {t.members.map((m) => (
                          <li key={m.rollNo}>
                            <span className="font-medium text-cream">{m.name}</span> · {m.rollNo} · {m.year} yr{m.lunch ? ` · ${m.lunch}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-fog">
                    {new Date(t.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}
                  </td>
                </tr>
                {open ? (
                <tr key={`${t.id}-detail`} className="border-t border-dashed border-line bg-black/20">
                  <td colSpan={4} className="px-4 py-3">
                    {editing && editDraft ? (
                      <div className="space-y-3">
                        <TeamForm draft={editDraft} onChange={setEditDraft} errors={editErrors} idPrefix={`hack-edit-${t.id}`} />
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
                            onClick={() => { setEditingId(null); setEditDraft(null); setEditErrors({}); }}
                            className="inline-flex min-h-[44px] items-center rounded-full border border-line px-4 py-2 text-sm text-fog hover:text-cream"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
                        <div className="flex gap-2"><dt className="shrink-0 text-faint">Track</dt><dd className="text-cream">{t.preference ?? "—"}</dd></div>
                        <div className="flex gap-2"><dt className="shrink-0 text-faint">Registered</dt><dd className="text-cream">{new Date(t.createdAt).toLocaleString("en-IN")}</dd></div>
                        <div className="flex gap-2"><dt className="shrink-0 text-faint">Day-1 lunch</dt><dd className="text-cream">VEG {allMembers(t).filter((m) => m.lunch === "Veg").length} / NON-VEG {allMembers(t).filter((m) => m.lunch === "Non-veg").length}</dd></div>
                        <div className="flex gap-2"><dt className="shrink-0 text-faint">Team ID</dt><dd className="break-all font-mono text-[11px] text-faint">{t.id}</dd></div>
                      </dl>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-xs">
                          <thead>
                            <tr className="text-[11px] uppercase text-faint">
                              <th className="px-2 py-1.5">Name</th>
                              <th className="px-2 py-1.5">Roll no</th>
                              <th className="px-2 py-1.5">Food pref</th>
                              <th className="px-2 py-1.5">Contact</th>
                              <th className="px-2 py-1.5">Year</th>
                              <th className="px-2 py-1.5">GitHub</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[{ ...t.leader, role: "Leader" }, ...t.members.map((m) => ({ ...m, role: "Member" }))].map((m) => (
                              <tr key={`${m.role}-${m.rollNo}`} className="border-t border-line/60">
                                <td className="px-2 py-1.5">
                                  <span className="font-semibold text-cream">{m.name}</span>
                                  <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-fog">{m.role}</span>
                                </td>
                                <td className="px-2 py-1.5 font-mono text-fog">{m.rollNo}</td>
                                <td className="px-2 py-1.5">
                                  {m.lunch ? (
                                    <span className={cn(
                                      "inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold",
                                      m.lunch === "Veg" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-red-400/40 bg-red-400/10 text-red-300",
                                    )}>
                                      {m.lunch === "Veg" ? "VEG" : "NON-VEG"}
                                    </span>
                                  ) : "—"}
                                </td>
                                <td className="px-2 py-1.5 text-fog">
                                  <span className="break-all">{m.email}</span><br />
                                  <span className="font-mono">{m.mobile}</span>
                                </td>
                                <td className="px-2 py-1.5 text-cream">{m.year}{m.gender ? ` · ${m.gender}` : ""}</td>
                                <td className="px-2 py-1.5">
                                  {m.githubUrl ? (
                                    <a href={m.githubUrl} target="_blank" rel="noopener noreferrer" className="break-all text-brand underline decoration-brand/50 underline-offset-4 hover:decoration-cream">Open</a>
                                  ) : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-line">
                              <td colSpan={6} className="px-2 py-2 text-xs font-bold text-cream">
                                Team total: {1 + t.members.length} members ·{" "}
                                <span className="text-emerald-300">VEG {allMembers(t).filter((m) => m.lunch === "Veg").length}</span>
                                {" / "}
                                <span className="text-red-300">NON-VEG {allMembers(t).filter((m) => m.lunch === "Non-veg").length}</span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(t)}
                          className="inline-flex min-h-[44px] items-center rounded-full border border-line px-4 py-2 text-xs font-semibold text-fog hover:text-cream"
                        >
                          Modify details
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === t.id}
                          onClick={() => void removeTeam(t.id, t.teamName)}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-red-500/50 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                        >
                          {deletingId === t.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          )}
                          Delete team
                        </button>
                      </div>
                      </div>
                    )}
                  </td>
                </tr>
                ) : null}
                </Fragment>
                );
              })}
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
