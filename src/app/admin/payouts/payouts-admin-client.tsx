"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Download, Loader2, Search, Trash2 } from "lucide-react";
import AdminLogin from "@/components/AdminLogin";
import { cn } from "@/lib/utils";

const STATUSES = ["submitted", "verified", "paid", "rejected"] as const;
const EVENTS = ["DecodeX Hackathon", "Tech Parliament", "Make-A-Bot"] as const;

interface Payout {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  mobile: string;
  event: string;
  position: string;
  teamName: string;
  method: "UPI" | "Bank";
  upiId: string;
  upiMobile: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  status: string;
  amount: number | null;
  note: string;
  createdAt: string;
  updatedAt: string;
}

const selectCls =
  "min-h-[44px] rounded-xl border border-line bg-surface px-3 py-2 text-sm text-cream focus:ring-2 focus:ring-brand";
const inputCls =
  "min-h-[44px] rounded-xl border border-line bg-surface px-3 py-2 text-sm text-cream placeholder:text-faint focus:ring-2 focus:ring-brand";

function statusTone(s: string) {
  if (s === "paid") return "border-green-500/40 bg-green-500/10 text-green-300";
  if (s === "verified") return "border-sky-400/40 bg-sky-400/10 text-sky-300";
  if (s === "rejected") return "border-red-500/40 bg-red-500/10 text-red-300";
  return "border-amber-400/40 bg-amber-400/10 text-amber-300";
}

export default function PayoutsAdminClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [eventFilter, setEventFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { status: string; amount: string; note: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAuthed(Boolean(d.admin)))
      .catch(() => setAuthed(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/payouts", { cache: "no-store" });
      if (r.status === 401) {
        setAuthed(false);
        return;
      }
      if (r.ok) {
        const d = await r.json();
        const list = d.payouts as Payout[];
        setPayouts(list);
        setByStatus((d.byStatus ?? {}) as Record<string, number>);
        setDrafts((prev) => {
          const next = { ...prev };
          for (const p of list) {
            if (!next[p.id]) next[p.id] = { status: p.status, amount: p.amount?.toString() ?? "", note: p.note ?? "" };
          }
          return next;
        });
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
  const filtered = payouts.filter((p) => {
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (eventFilter !== "ALL" && p.event !== eventFilter) return false;
    if (!needle) return true;
    return [p.name, p.email, p.mobile, p.rollNo, p.teamName, p.upiId, p.upiMobile, p.bankName, p.accountHolder, p.id]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
  const pending = payouts.filter((p) => p.status === "submitted").length;

  async function save(id: string) {
    const d = drafts[id];
    if (!d) return;
    setSavingId(id);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: d.status,
          amount: d.amount === "" ? null : Number(d.amount),
          note: d.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSavingId(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete payout request from ${name}? Cannot undo.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed.");
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
          {payouts.length} requests{pending > 0 ? ` · ${pending} pending` : ""}
        </span>
        {STATUSES.map((s) => (
          <span key={s} className={cn("inline-flex min-h-[44px] items-center rounded-full border px-3 py-2 text-xs font-bold", statusTone(s))}>
            {s}: <span className="ml-1 font-mono">{byStatus[s] ?? 0}</span>
          </span>
        ))}
        <span className="flex-1" aria-hidden />
        <a
          href="/api/admin/payouts?format=csv"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-500"
        >
          <Download className="h-4 w-4" aria-hidden />
          CSV export
        </a>
      </div>

      <div className="rank-card flex flex-col gap-2 p-4 sm:flex-row sm:items-center print:hidden">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / email / roll / UPI / ref…"
            className="w-full min-h-[44px] rounded-xl border border-line bg-surface py-2 pr-3 pl-9 text-sm text-cream placeholder:text-faint focus:ring-2 focus:ring-brand"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status" className={selectCls}>
          <option value="ALL">All status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} aria-label="Event" className={selectCls}>
          <option value="ALL">All events</option>
          {EVENTS.map((ev) => (
            <option key={ev} value={ev}>{ev}</option>
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
          {filtered.length} request{filtered.length === 1 ? "" : "s"} · newest first
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="text-[11px] tracking-wider text-faint uppercase">
                <th className="px-4 py-2.5">Winner</th>
                <th className="px-4 py-2.5">Event / Position</th>
                <th className="px-4 py-2.5">Pay to</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const open = openId === p.id;
                const d = drafts[p.id] ?? { status: p.status, amount: p.amount?.toString() ?? "", note: p.note ?? "" };
                return (
                  <Fragment key={p.id}>
                    <tr className="border-t border-line align-top transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setOpenId(open ? null : p.id)}
                          aria-expanded={open}
                          className="group inline-flex min-h-[44px] items-center gap-1.5 text-left hover:text-brand"
                        >
                          <span className="font-semibold text-cream group-hover:text-brand">{p.name}</span>
                          <ChevronDown className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")} aria-hidden />
                        </button>
                        <p className="mt-0.5 text-xs break-all text-fog">{p.email}</p>
                        <p className="mt-0.5 font-mono text-xs text-fog">{p.mobile} · {p.rollNo}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className="font-medium text-cream">{p.event}</p>
                        <p className="mt-0.5 text-fog">{p.position}{p.teamName ? ` · ${p.teamName}` : ""}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-fog">
                        {p.method === "UPI" ? `${p.upiId}${p.upiMobile ? ` · ${p.upiMobile}` : ""}` : `${p.bankName ? `${p.bankName} · ` : ""}${p.accountNumber} · ${p.ifsc}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", statusTone(p.status))}>
                          {p.status.toUpperCase()}
                        </span>
                        {p.amount !== null ? <p className="mt-1 font-mono text-xs text-cream">₹{p.amount.toLocaleString("en-IN")}</p> : null}
                      </td>
                    </tr>
                    {open ? (
                      <tr key={`${p.id}-detail`} className="border-t border-dashed border-line bg-black/20">
                        <td colSpan={4} className="px-4 py-3">
                          <div className="space-y-3">
                            <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
                              <div className="flex gap-2"><dt className="shrink-0 text-faint">Method</dt><dd className="text-cream">{p.method}</dd></div>
                              {p.method === "UPI" ? (
                                <>
                                  <div className="flex gap-2"><dt className="shrink-0 text-faint">UPI ID</dt><dd className="font-mono break-all text-cream">{p.upiId}</dd></div>
                                  <div className="flex gap-2"><dt className="shrink-0 text-faint">UPI mobile</dt><dd className="font-mono text-cream">{p.upiMobile || "—"}</dd></div>
                                </>
                              ) : (
                                <>
                                  <div className="flex gap-2"><dt className="shrink-0 text-faint">Bank</dt><dd className="text-cream">{p.bankName || "—"}</dd></div>
                                  <div className="flex gap-2"><dt className="shrink-0 text-faint">Holder</dt><dd className="text-cream">{p.accountHolder}</dd></div>
                                  <div className="flex gap-2"><dt className="shrink-0 text-faint">Account</dt><dd className="font-mono text-cream">{p.accountNumber}</dd></div>
                                  <div className="flex gap-2"><dt className="shrink-0 text-faint">IFSC</dt><dd className="font-mono text-cream">{p.ifsc}</dd></div>
                                </>
                              )}
                              <div className="flex gap-2"><dt className="shrink-0 text-faint">Submitted</dt><dd className="text-cream">{new Date(p.createdAt).toLocaleString("en-IN")}</dd></div>
                              <div className="flex gap-2"><dt className="shrink-0 text-faint">Ref</dt><dd className="font-mono break-all text-[11px] text-faint">{p.id}</dd></div>
                            </dl>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                              <label className="block text-xs text-faint">
                                Status
                                <select
                                  value={d.status}
                                  onChange={(e) => setDrafts((prev) => ({ ...prev, [p.id]: { ...d, status: e.target.value } }))}
                                  className={selectCls + " mt-1 w-full"}
                                >
                                  {STATUSES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </label>
                              <label className="block text-xs text-faint">
                                Amount (₹)
                                <input
                                  type="number"
                                  min={0}
                                  max={1000000}
                                  value={d.amount}
                                  onChange={(e) => setDrafts((prev) => ({ ...prev, [p.id]: { ...d, amount: e.target.value } }))}
                                  placeholder="7000"
                                  className={inputCls + " mt-1 w-full"}
                                />
                              </label>
                              <label className="block text-xs text-faint">
                                Note (txn id / remark)
                                <input
                                  value={d.note}
                                  onChange={(e) => setDrafts((prev) => ({ ...prev, [p.id]: { ...d, note: e.target.value } }))}
                                  placeholder="UPI ref…"
                                  maxLength={300}
                                  className={inputCls + " mt-1 w-full"}
                                />
                              </label>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={savingId === p.id}
                                onClick={() => void save(p.id)}
                                className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-60"
                              >
                                {savingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Save payout"}
                              </button>
                              <button
                                type="button"
                                disabled={deletingId === p.id}
                                onClick={() => void remove(p.id, p.name)}
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-red-500/50 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                              >
                                {deletingId === p.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                )}
                                Delete
                              </button>
                            </div>
                            <p className="text-[11px] text-faint">Flow: submitted → verified (details checked) → paid (money sent, note txn id).</p>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-fog">
                    No payout requests yet. Share <code className="font-mono">/payouts</code> link with winners.
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
