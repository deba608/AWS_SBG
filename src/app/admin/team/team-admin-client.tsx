"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Crop, Link2, Loader2, Pencil, Trash2, X } from "lucide-react";
import AdminLogin from "@/components/AdminLogin";
import PhotoCropper from "@/components/PhotoCropper";
import type { TeamSubmission } from "@/lib/team-store";
import { cn } from "@/lib/utils";

type Filter = "approved" | "rejected" | "all";

interface DetailsDraft {
  id: string;
  name: string;
  role: string;
  linkedin: string;
  github: string;
  email: string;
}

interface RoleOption {
  role: string;
  section: string;
}

const SECTION_TITLES: Record<string, string> = {
  leadership: "Leadership",
  domain: "Domain leads",
  ops: "Events, PR & media",
  coordinators: "Co-ordinators",
};

export default function TeamAdminClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [subs, setSubs] = useState<TeamSubmission[]>([]);
  const [filter, setFilter] = useState<Filter>("approved");
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [cropFor, setCropFor] = useState<TeamSubmission | null>(null);
  const [detailsDraft, setDetailsDraft] = useState<DetailsDraft | null>(null);
  const [detailsError, setDetailsError] = useState("");
  const [rosterNames, setRosterNames] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);

  useEffect(() => {
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAuthed(Boolean(d.admin)))
      .catch(() => setAuthed(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/team", { cache: "no-store" });
      if (r.status === 401) {
        setAuthed(false);
        return;
      }
      if (r.ok) {
        const d = await r.json();
        setSubs(d.submissions as TeamSubmission[]);
        if (Array.isArray(d.meta?.members)) setRosterNames(d.meta.members as string[]);
        if (Array.isArray(d.meta?.roles)) setRoleOptions(d.meta.roles as RoleOption[]);
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

  async function saveCrop(blob: Blob) {
    if (!cropFor) return;
    setActingId(cropFor.id);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read cropped photo."));
        reader.readAsDataURL(blob);
      });
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cropFor.id, photoDataUrl: dataUrl }),
      });
      if (res.ok) {
        setCropFor(null);
        await load();
      }
    } finally {
      setActingId(null);
    }
  }
  async function act(id: string, status: "approved" | "rejected") {
    setActingId(id);
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) await load();
    } finally {
      setActingId(null);
    }
  }

  async function saveDetails() {
    if (!detailsDraft) return;
    setActingId(detailsDraft.id);
    setDetailsError("");
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: detailsDraft.id,
          name: detailsDraft.name.trim(),
          role: detailsDraft.role,
          linkedin: detailsDraft.linkedin.trim(),
          github: detailsDraft.github.trim(),
          email: detailsDraft.email.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDetailsError(data.error ?? "Could not save details.");
        return;
      }
      setDetailsDraft(null);
      await load();
    } finally {
      setActingId(null);
    }
  }

  async function removeSubmission(s: TeamSubmission) {
    if (!window.confirm(`Delete submission for ${s.name}? Approved photos go off /team. This cannot be undone.`)) return;
    setActingId(s.id);
    try {
      const res = await fetch("/api/admin/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id }),
      });
      if (res.ok) {
        if (detailsDraft?.id === s.id) setDetailsDraft(null);
        if (cropFor?.id === s.id) setCropFor(null);
        await load();
      }
    } finally {
      setActingId(null);
    }
  }

  const counts = {
    approved: subs.filter((s) => s.status === "approved").length,
    rejected: subs.filter((s) => s.status === "rejected").length,
  };
  // Requests: member update queue (pending) — always its own section.
  const requests = subs.filter((s) => s.status === "pending");
  // Members: decided records for profile management.
  const members = subs.filter((s) => (filter === "all" ? s.status !== "pending" : s.status === filter));

  function SubmissionCard({ s }: { s: TeamSubmission }) {
    return (
      <li className="rank-card overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.photoDataUrl} alt={s.name} className="aspect-square w-full object-cover" loading="lazy" />
              <div className="space-y-1 p-4">
                <p className="font-semibold text-cream">{s.name}</p>
                <p className="text-sm text-brand">{s.role}</p>
                <p className="text-xs text-faint">{new Date(s.createdAt).toLocaleString()} · {s.status}</p>
                {/* Links submitted with photo — verify before approve */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs">
                  {s.linkedin ? (
                    <a href={s.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-fog underline hover:text-cream">
                      <Link2 className="h-3 w-3" aria-hidden /> LinkedIn
                    </a>
                  ) : null}
                  {s.github ? (
                    <a href={s.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-fog underline hover:text-cream">
                      <Link2 className="h-3 w-3" aria-hidden /> GitHub
                    </a>
                  ) : null}
                  {s.email ? (
                    <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1 text-fog underline hover:text-cream">
                      {s.email}
                    </a>
                  ) : null}
                  {!s.linkedin && !s.github && !s.email ? (
                    <span className="text-faint">No links submitted.</span>
                  ) : null}
                </div>
                {detailsDraft?.id === s.id ? (
                  <div className="space-y-2 rounded-xl border border-line p-3">
                    <p className="text-xs text-faint">Edits on approved rows go live on /team instantly.</p>
                    <label className="block text-xs text-fog">
                      Name
                      <input
                        type="text"
                        value={detailsDraft.name}
                        onChange={(e) => setDetailsDraft({ ...detailsDraft, name: e.target.value })}
                        placeholder="Member name"
                        list="team-roster-names"
                        className="mt-1 min-h-[44px] w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-cream"
                      />
                    </label>
                    <label className="block text-xs text-fog">
                      Position
                      <select
                        value={detailsDraft.role}
                        onChange={(e) => setDetailsDraft({ ...detailsDraft, role: e.target.value })}
                        className="mt-1 min-h-[44px] w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-cream"
                      >
                        {roleOptions.length === 0 ? <option value={detailsDraft.role}>{detailsDraft.role}</option> : null}
                        {Object.keys(SECTION_TITLES)
                          .filter((sec) => roleOptions.some((o) => o.section === sec))
                          .map((sec) => (
                            <optgroup key={sec} label={SECTION_TITLES[sec]}>
                              {roleOptions
                                .filter((o) => o.section === sec)
                                .map((o) => (
                                  <option key={o.role} value={o.role}>{o.role}</option>
                                ))}
                            </optgroup>
                          ))}
                      </select>
                    </label>
                    <label className="block text-xs text-fog">
                      LinkedIn
                      <input
                        type="url"
                        value={detailsDraft.linkedin}
                        onChange={(e) => setDetailsDraft({ ...detailsDraft, linkedin: e.target.value })}
                        placeholder="linkedin.com/in/…"
                        className="mt-1 min-h-[44px] w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-cream"
                      />
                    </label>
                    <label className="block text-xs text-fog">
                      GitHub
                      <input
                        type="url"
                        value={detailsDraft.github}
                        onChange={(e) => setDetailsDraft({ ...detailsDraft, github: e.target.value })}
                        placeholder="github.com/…"
                        className="mt-1 min-h-[44px] w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-cream"
                      />
                    </label>
                    <label className="block text-xs text-fog">
                      Email
                      <input
                        type="email"
                        value={detailsDraft.email}
                        onChange={(e) => setDetailsDraft({ ...detailsDraft, email: e.target.value })}
                        placeholder="you@example.com"
                        className="mt-1 min-h-[44px] w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-cream"
                      />
                    </label>
                    {detailsError ? <p role="alert" className="text-xs text-red-300">{detailsError}</p> : null}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={actingId === s.id}
                        onClick={() => void saveDetails()}
                        className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-full bg-brand px-4 py-2 text-xs font-bold text-black hover:bg-brandhover disabled:opacity-60"
                      >
                        Save details
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDetailsDraft(null); setDetailsError(""); }}
                        className="inline-flex min-h-[44px] items-center rounded-full border border-line px-4 py-2 text-xs text-fog hover:text-cream"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={actingId === s.id}
                    onClick={() => setDetailsDraft({ id: s.id, name: s.name, role: s.role, linkedin: s.linkedin ?? "", github: s.github ?? "", email: s.email ?? "" })}
                    className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-semibold text-fog hover:text-cream disabled:opacity-60"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit name / role / links
                  </button>
                )}
                <button
                  type="button"
                  disabled={actingId === s.id}
                  onClick={() => setCropFor(s)}
                  className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-brand/60 bg-brand/10 px-4 py-2 text-xs font-semibold text-cream hover:bg-brand/20 disabled:opacity-60"
                >
                  <Crop className="h-3.5 w-3.5" aria-hidden /> Adjust crop / move
                </button>
                <button
                  type="button"
                  disabled={actingId === s.id}
                  onClick={() => void removeSubmission(s)}
                  className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-red-400/30 px-4 py-2 text-xs font-semibold text-red-300/80 hover:bg-red-500/10 hover:text-red-200 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete submission
                </button>
                {s.status === "pending" ? (
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      disabled={actingId === s.id}
                      onClick={() => void act(s.id, "approved")}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-bold text-black hover:bg-green-400 disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" aria-hidden /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={actingId === s.id}
                      onClick={() => void act(s.id, "rejected")}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border border-red-400/50 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-500/10 disabled:opacity-60"
                    >
                      <X className="h-4 w-4" aria-hidden /> Reject
                    </button>
                  </div>
                ) : s.status === "approved" ? (
                  <p className="pt-1 text-xs text-green-300">Live on /team.</p>
                ) : null}
              </div>
      </li>
    );
  }

  return (
    <div className="space-y-5">
      <datalist id="team-roster-names">
        {rosterNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-5 py-2 text-sm text-fog hover:text-cream"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Dashboard
        </Link>
        <span className="flex-1" aria-hidden />
        <span className="text-xs font-mono text-faint">{requests.length} open requests · {counts.approved} live</span>
      </div>

      {loading && subs.length === 0 ? (
        <div className="rank-card flex items-center gap-3 p-6 text-sm text-fog">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading team updates…
        </div>
      ) : (
        <>
          <section aria-labelledby="team-requests">
            <h2 id="team-requests" className="font-mono text-xs uppercase tracking-widest text-brand">{"// requests"}</h2>
            {requests.length === 0 ? (
              <div className="rank-card mt-2 p-6 text-center text-sm text-fog">
                No open requests. Share <span className="font-mono text-cream">/team/update</span> with members.
              </div>
            ) : (
              <ul className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {requests.map((s) => (
                  <SubmissionCard key={s.id} s={s} />
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="team-members">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="team-members" className="font-mono text-xs uppercase tracking-widest text-brand">{"// members"}</h2>
              <span className="flex-1" aria-hidden />
              {(["approved", "rejected", "all"] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-xs font-bold capitalize",
                    filter === f ? "border-brand/60 bg-brand/10 text-cream" : "border-line text-fog hover:text-cream",
                  )}
                >
                  {f} · {f === "all" ? counts.approved + counts.rejected : counts[f]}
                </button>
              ))}
            </div>
            {members.length === 0 ? (
              <div className="rank-card mt-2 p-6 text-center text-sm text-fog">
                No {filter === "all" ? "decided" : filter} records yet.
              </div>
            ) : (
              <ul className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {members.map((s) => (
                  <SubmissionCard key={s.id} s={s} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      {cropFor ? (
        <PhotoCropper
          src={cropFor.originalDataUrl ?? cropFor.photoDataUrl}
          title={`Crop — ${cropFor.name}`}
          onClose={() => setCropFor(null)}
          onSave={saveCrop}
        />
      ) : null}
    </div>
  );
}
