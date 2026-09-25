"use client";

import { useState } from "react";
import { Loader2, Printer, RotateCcw } from "lucide-react";
import Container from "@/components/Container";
import PassCard from "@/components/PassCard";
import {
  validateContact,
  type ContactErrors,
} from "@/lib/validate-contact";

interface IssuedPass {
  type: "ENTRY" | "FOOD";
  token: string;
  qrContent: string;
  qrImage: string;
  status: string;
}

interface IssuedUser {
  name: string;
  email: string;
  mobile: string;
}

const inputCls = (bad: boolean) =>
  `w-full min-h-[44px] rounded-xl border bg-surface px-3 py-3 text-base text-cream placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm ${
    bad ? "border-red-400/70" : "border-line"
  }`;

export default function PassesClient() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<"form" | "busy" | "done">("form");
  const [apiError, setApiError] = useState("");
  const [user, setUser] = useState<IssuedUser | null>(null);
  const [passes, setPasses] = useState<IssuedPass[]>([]);
  const [wasDuplicate, setWasDuplicate] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fe = validateContact({ firstName, lastName, email, mobile });
    setErrors(fe);
    if (Object.keys(fe).length > 0) return;
    setStatus("busy");
    setApiError("");
    try {
      const res = await fetch("/api/passes/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, mobile }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors as ContactErrors);
        throw new Error(data.error ?? "Issue failed.");
      }
      setUser(data.user as IssuedUser);
      setPasses(data.passes as IssuedPass[]);
      setWasDuplicate(Boolean(data.duplicate));
      setStatus("done");
      try {
        localStorage.setItem(
          "awsPasses",
          JSON.stringify({ user: data.user, passes: data.passes }),
        );
      } catch {
        // ignore
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Issue failed.");
      setStatus("form");
    }
  }

  function reset() {
    setStatus("form");
    setUser(null);
    setPasses([]);
    setApiError("");
  }

  if (status === "done" && user) {
    return (
      <div className="space-y-5">
        <div className="rank-card border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200 print:hidden">
          {wasDuplicate
            ? "Pass already existed — showing existing QRs. Same QRs work at gate."
            : "Passes issued. Download/print now — each QR scans once."}
        </div>
        <div className="print:space-y-6">
          {passes.map((p) => (
            <PassCard
              key={p.type}
              name={user.name}
              email={user.email}
              mobile={user.mobile}
              type={p.type}
              qrImage={p.qrImage}
              token={p.token}
            />
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black hover:bg-brandhover"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Print / Save PDF
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm text-fog hover:text-cream"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            New pass
          </button>
        </div>
        <p className="text-xs text-faint print:hidden">
          Tip: phone Print → Save as PDF works. Keep QRs private — anyone with
          image can scan first and burn your pass.
        </p>
      </div>
    );
  }

  return (
    <Container className="rank-card p-5 sm:p-6">
      <form noValidate onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="pass-first" className="mb-1.5 block text-sm font-medium text-cream">
              First name *
            </label>
            <input
              id="pass-first"
              autoComplete="given-name"
              placeholder="e.g. Debashish"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              aria-invalid={Boolean(errors.firstName)}
              className={inputCls(Boolean(errors.firstName))}
            />
            {errors.firstName ? (
              <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.firstName}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="pass-last" className="mb-1.5 block text-sm font-medium text-cream">
              Last name *
            </label>
            <input
              id="pass-last"
              autoComplete="family-name"
              placeholder="e.g. Pradhan"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              aria-invalid={Boolean(errors.lastName)}
              className={inputCls(Boolean(errors.lastName))}
            />
            {errors.lastName ? (
              <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.lastName}</p>
            ) : null}
          </div>
        </div>
        <div>
          <label htmlFor="pass-email" className="mb-1.5 block text-sm font-medium text-cream">
            Email *
          </label>
          <input
            id="pass-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="24btcse26@suiit.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            className={inputCls(Boolean(errors.email))}
          />
          {errors.email ? (
            <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.email}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="pass-mobile" className="mb-1.5 block text-sm font-medium text-cream">
            Mobile *
          </label>
          <input
            id="pass-mobile"
            type="tel"
            autoComplete="tel-national"
            inputMode="numeric"
            maxLength={13}
            placeholder="98765 43210"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            aria-invalid={Boolean(errors.mobile)}
            className={inputCls(Boolean(errors.mobile))}
          />
          {errors.mobile ? (
            <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.mobile}</p>
          ) : null}
        </div>
        {apiError ? (
          <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
            {apiError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={status === "busy"}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-70"
        >
          {status === "busy" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Generating QRs…
            </>
          ) : (
            "Generate my passes"
          )}
        </button>
      </form>
    </Container>
  );
}
