"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Crop, Loader2, X } from "lucide-react";
import AdminLogin from "@/components/AdminLogin";
import PhotoCropper from "@/components/PhotoCropper";
import type { TeamSubmission } from "@/lib/team-store";
import { cn } from "@/lib/utils";

type Filter = "pending" | "approved" | "rejected" | "all";

export default function TeamAdminClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [subs, setSubs] = useState<TeamSubmission[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [cropFor, setCropFor] = useState<TeamSubmission | null>(null);

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

  const counts = {
    pending: subs.filter((s) => s.status === "pending").length,
    approved: subs.filter((s) => s.status === "approved").length,
    rejected: subs.filter((s) => s.status === "rejected").length,
  };
  const shown = subs.filter((s) => (filter === "all" ? true : s.status === filter));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-5 py-2 text-sm text-fog hover:text-cream"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Dashboard
        </Link>
        <span className="flex-1" aria-hidden />
        {(["pending", "approved", "rejected", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-xs font-bold capitalize",
              filter === f ? "border-brand/60 bg-brand/10 text-cream" : "border-line text-fog hover:text-cream",
            )}
          >
            {f} · {f === "all" ? subs.length : counts[f as keyof typeof counts]}
          </button>
        ))}
      </div>

      {loading && subs.length === 0 ? (
        <div className="rank-card flex items-center gap-3 p-6 text-sm text-fog">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading submissions…
        </div>
      ) : shown.length === 0 ? (
        <div className="rank-card p-6 text-center text-sm text-fog">
          No {filter} submissions. Share <span className="font-mono text-cream">/team/join</span> with members.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {shown.map((s) => (
            <li key={s.id} className="rank-card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.photoDataUrl} alt={s.name} className="aspect-square w-full object-cover" loading="lazy" />
              <div className="space-y-1 p-4">
                <p className="font-semibold text-cream">{s.name}</p>
                <p className="text-sm text-brand">{s.role}</p>
                <p className="text-xs text-faint">{new Date(s.createdAt).toLocaleString()} · {s.status}</p>
                <button
                  type="button"
                  disabled={actingId === s.id}
                  onClick={() => setCropFor(s)}
                  className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-brand/60 bg-brand/10 px-4 py-2 text-xs font-semibold text-cream hover:bg-brand/20 disabled:opacity-60"
                >
                  <Crop className="h-3.5 w-3.5" aria-hidden /> Adjust crop / move
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
          ))}
        </ul>
      )}
      {cropFor ? (
        <PhotoCropper
          src={cropFor.photoDataUrl}
          title={`Crop — ${cropFor.name}`}
          onClose={() => setCropFor(null)}
          onSave={saveCrop}
        />
      ) : null}
    </div>
  );
}
