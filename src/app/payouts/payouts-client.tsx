"use client";

import { useState } from "react";
import { ArrowRight, BadgeIndianRupee, Loader2, ShieldCheck } from "lucide-react";
import Container from "@/components/Container";
import { cn } from "@/lib/utils";

const EVENTS = ["DecodeX Hackathon", "Tech Parliament", "Make-A-Bot"] as const;
const POSITIONS = ["1st", "2nd", "3rd"] as const;

type Errors = Partial<Record<string, string>>;

const inputCls = (bad: boolean) =>
  `w-full min-h-[44px] rounded-xl border bg-surface px-3 py-3 text-base text-cream placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm ${
    bad ? "border-red-400/70" : "border-line"
  }`;

export default function PayoutsClient() {
  const [form, setForm] = useState({
    name: "",
    rollNo: "",
    email: "",
    mobile: "",
    event: "",
    position: "",
    teamName: "",
    method: "UPI",
    upiId: "",
    upiMobile: "",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifsc: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: string; event: string } | null>(null);

  const set = (k: string) => (v: string | boolean) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      // switching method clears the other branch so stale data never submits
      if (k === "method") {
        if (v === "UPI") {
          next.bankName = "";
          next.accountHolder = "";
          next.accountNumber = "";
          next.confirmAccountNumber = "";
          next.ifsc = "";
        } else {
          next.upiId = "";
          next.upiMobile = "";
        }
      }
      return next;
    });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setApiError("");
    setErrors({});
    try {
      const res = await fetch("/api/payouts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors as Errors);
        throw new Error(data.error ?? "Submit failed.");
      }
      setDone({ id: data.id as string, event: data.event as string });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Submit failed.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-center">
          <span className="animate-check-pop mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-green-500/20">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-300" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <p className="mt-2 text-base font-bold text-cream">Payment details received!</p>
          <p className="mt-1 text-xs leading-relaxed text-green-200/80">
            {done.event} · Ref <span className="font-mono font-bold">{done.id}</span>
          </p>
          <p className="mt-2 text-sm text-fog">
            Organizers will verify and transfer the prize. Save the reference ID — contact organizers for corrections.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Container className="rank-card p-5 sm:p-6">
      <form noValidate onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-cream">Full name *</label>
            <input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="Aarav Sharma" maxLength={60} autoComplete="name" aria-invalid={Boolean(errors.name)} className={inputCls(Boolean(errors.name))} />
            {errors.name ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.name}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-cream">Roll number *</label>
            <input value={form.rollNo} onChange={(e) => set("rollNo")(e.target.value)} placeholder="24BTCSE01" maxLength={20} autoComplete="off" aria-invalid={Boolean(errors.rollNo)} className={cn(inputCls(Boolean(errors.rollNo)), "uppercase")} />
            {errors.rollNo ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.rollNo}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-cream">College mail *</label>
            <input value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="24btcse01@suiit.ac.in" type="email" maxLength={100} autoComplete="email" aria-invalid={Boolean(errors.email)} className={inputCls(Boolean(errors.email))} />
            {errors.email ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.email}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-cream">Mobile *</label>
            <input value={form.mobile} onChange={(e) => set("mobile")(e.target.value)} placeholder="9437100001" type="tel" maxLength={13} autoComplete="tel-national" aria-invalid={Boolean(errors.mobile)} className={inputCls(Boolean(errors.mobile))} />
            {errors.mobile ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.mobile}</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-cream">Event *</label>
            <select value={form.event} onChange={(e) => set("event")(e.target.value)} aria-invalid={Boolean(errors.event)} className={inputCls(Boolean(errors.event))}>
              <option value="">Select event</option>
              {EVENTS.map((ev) => (
                <option key={ev} value={ev}>{ev}</option>
              ))}
            </select>
            {errors.event ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.event}</p> : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-cream">Position *</label>
            <select value={form.position} onChange={(e) => set("position")(e.target.value)} aria-invalid={Boolean(errors.position)} className={inputCls(Boolean(errors.position))}>
              <option value="">Select position</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {errors.position ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.position}</p> : null}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-cream">Team name <span className="font-normal text-faint">(if team event)</span></label>
          <input value={form.teamName} onChange={(e) => set("teamName")(e.target.value)} placeholder="Binary Builders" maxLength={40} autoComplete="off" aria-invalid={Boolean(errors.teamName)} className={inputCls(Boolean(errors.teamName))} />
          {errors.teamName ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.teamName}</p> : null}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-cream" id="payout-method-label">Receive money via *</span>
          <div role="radiogroup" aria-labelledby="payout-method-label" className="grid grid-cols-2 gap-2">
            {(["UPI", "Bank"] as const).map((m) => {
              const active = form.method === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => set("method")(m)}
                  className={cn(
                    "flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-2 py-2 text-sm font-semibold transition-all",
                    active
                      ? "border-brand/60 bg-brand/10 text-cream shadow-[0_0_20px_rgba(173,92,255,0.18)]"
                      : "border-line bg-surface text-fog hover:border-faint hover:text-cream",
                  )}
                >
                  <BadgeIndianRupee className="h-4 w-4" aria-hidden />
                  {m === "UPI" ? "UPI ID" : "Bank account"}
                </button>
              );
            })}
          </div>
          {errors.method ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.method}</p> : null}
        </div>

        {form.method === "UPI" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-cream">UPI ID *</label>
              <input value={form.upiId} onChange={(e) => set("upiId")(e.target.value)} placeholder="name@okhdfcbank" maxLength={100} autoComplete="off" aria-invalid={Boolean(errors.upiId)} className={inputCls(Boolean(errors.upiId))} />
              {errors.upiId ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.upiId}</p> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-cream">UPI-linked mobile number *</label>
              <input value={form.upiMobile} onChange={(e) => set("upiMobile")(e.target.value)} placeholder="9437100001" type="tel" maxLength={13} autoComplete="tel-national" aria-invalid={Boolean(errors.upiMobile)} className={inputCls(Boolean(errors.upiMobile))} />
              {errors.upiMobile ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.upiMobile}</p> : null}
            </div>
            <p className="text-xs text-faint sm:col-span-2">Double-check both — money sent here cannot be reversed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-cream">Bank name *</label>
              <input value={form.bankName} onChange={(e) => set("bankName")(e.target.value)} placeholder="State Bank of India" maxLength={60} autoComplete="off" aria-invalid={Boolean(errors.bankName)} className={inputCls(Boolean(errors.bankName))} />
              {errors.bankName ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.bankName}</p> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-cream">Account holder name *</label>
              <input value={form.accountHolder} onChange={(e) => set("accountHolder")(e.target.value)} placeholder="As per bank records" maxLength={60} autoComplete="off" aria-invalid={Boolean(errors.accountHolder)} className={inputCls(Boolean(errors.accountHolder))} />
              {errors.accountHolder ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.accountHolder}</p> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-cream">Account number *</label>
              <input value={form.accountNumber} onChange={(e) => set("accountNumber")(e.target.value)} placeholder="9–18 digits" inputMode="numeric" maxLength={18} autoComplete="off" aria-invalid={Boolean(errors.accountNumber)} className={inputCls(Boolean(errors.accountNumber))} />
              {errors.accountNumber ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.accountNumber}</p> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-cream">Confirm account number *</label>
              <input value={form.confirmAccountNumber} onChange={(e) => set("confirmAccountNumber")(e.target.value)} placeholder="Re-enter account number" inputMode="numeric" maxLength={18} autoComplete="off" aria-invalid={Boolean(errors.confirmAccountNumber)} className={inputCls(Boolean(errors.confirmAccountNumber))} />
              {errors.confirmAccountNumber ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.confirmAccountNumber}</p> : null}
              {!errors.confirmAccountNumber && form.accountNumber && form.confirmAccountNumber && form.accountNumber.replace(/\s/g, "") !== form.confirmAccountNumber.replace(/\s/g, "") ? (
                <p role="alert" className="mt-1.5 text-xs text-red-300">Account numbers do not match.</p>
              ) : null}
              {!errors.confirmAccountNumber && form.accountNumber && form.confirmAccountNumber && form.accountNumber.replace(/\s/g, "") === form.confirmAccountNumber.replace(/\s/g, "") ? (
                <p className="mt-1.5 text-xs text-green-300">Account numbers match.</p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-cream">IFSC *</label>
              <input value={form.ifsc} onChange={(e) => set("ifsc")(e.target.value.toUpperCase())} placeholder="SBIN0062015" maxLength={11} autoComplete="off" aria-invalid={Boolean(errors.ifsc)} className={cn(inputCls(Boolean(errors.ifsc)), "uppercase font-mono")} />
              {errors.ifsc ? <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.ifsc}</p> : null}
            </div>
          </div>
        )}

        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-relaxed ${errors.consent ? "border-red-400/70 bg-red-500/10" : "border-line bg-ink/40"}`}>
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => set("consent")(e.target.checked)}
            aria-invalid={Boolean(errors.consent)}
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[#ad5cff]"
          />
          <span className="text-fog">
            <span className="font-semibold text-cream">Declaration: </span>
            I am the prize winner (or authorised team representative), these payment details are correct and belong to me, and I consent to the organizers using them only for the prize transfer. *
          </span>
        </label>
        {errors.consent ? <p role="alert" className="-mt-2 text-xs text-red-300">{errors.consent}</p> : null}

        {apiError ? (
          <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{apiError}</p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-70"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Submitting…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Submit payment details
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
        <p className="text-center text-xs text-faint">One submission per email per event. Details visible only to admins.</p>
      </form>
    </Container>
  );
}
