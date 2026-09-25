"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Printer, RotateCcw } from "lucide-react";
import Container from "@/components/Container";
import PassCard from "@/components/PassCard";
import {
  validateContact,
  type ContactErrors,
} from "@/lib/validate-contact";
import FoodSelect from "@/components/FoodSelect";
import GenderSelect from "@/components/GenderSelect";
import { cn } from "@/lib/utils";

interface IssuedPass {
  type: "ENTRY" | "FOOD";
  token: string;
  qrContent: string;
  qrImage: string;
  status: string;
}

interface IssuedUser {
  name: string;
  serial: string;
  email: string;
  mobile: string;
  rollNo: string;
  gender: string;
  food: string;
}

const inputCls = (bad: boolean) =>
  `w-full min-h-[44px] rounded-xl border bg-surface px-3 py-3 text-base text-cream placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm ${
    bad ? "border-red-400/70" : "border-line"
  }`;

export default function PassesClient() {
  const [fullName, setFullName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState("");
  const [food, setFood] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<"form" | "busy" | "done">("form");
  const [apiError, setApiError] = useState("");
  const [user, setUser] = useState<IssuedUser | null>(null);
  const [passes, setPasses] = useState<IssuedPass[]>([]);
  const [wasDuplicate, setWasDuplicate] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [slots, setSlots] = useState<{ registered: number; limit: number; open: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/passes/issue?count=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.registered === "number") setSlots(d);
      })
      .catch(() => {});
  }, []);

  async function resendEmail() {
    if (!user || resending || passes.length === 0) return;
    setResending(true);
    try {
      const p = passes[0];
      const ok = await emailExactPass({
        serial: user.serial ?? "",
        name: user.name,
        email: user.email,
        rollNo: user.rollNo,
        food: user.food,
        qrDataUrl: p.qrImage,
        token: p.token,
      });
      if (ok) setEmailSent(true);
    } finally {
      setResending(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fe = validateContact({ fullName, rollNo, email, mobile, gender, food });
    setErrors(fe);
    if (Object.keys(fe).length > 0) return;
    setStatus("busy");
    setApiError("");
    try {
      const res = await fetch("/api/passes/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, rollNo, email, mobile, gender, food }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors as ContactErrors);
        throw new Error(data.error ?? "Issue failed.");
      }
      setUser(data.user as IssuedUser);
      setPasses(data.passes as IssuedPass[]);
      setWasDuplicate(Boolean(data.duplicate));
      setEmailSent(Boolean(data.email?.sent));
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
    setEmailSent(false);
  }

  if (status === "done" && user) {
    return (
      <div className="space-y-5">
        <div className="rank-card border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200 print:hidden">
          {wasDuplicate
            ? "Pass already existed — showing your QR. Same QR works at gate."
            : "Entry pass ready. One-time use only — invalid after gate scan. Download image or take a screenshot."}
        </div>
        <div className={`rank-card flex items-center gap-3 p-4 text-sm print:hidden ${emailSent ? "border-sky-400/30 bg-sky-400/10 text-sky-200" : "border-amber-400/30 bg-amber-400/10 text-amber-200"}`}>
          <Mail className="h-5 w-5 shrink-0" aria-hidden />
          <div className="flex-1">
            {emailSent ? (
              <p>Pass emailed to <span className="font-semibold">{user.email}</span> — check inbox + spam.</p>
            ) : (
              <p>Mail not sent to <span className="font-semibold">{user.email}</span> yet — keep the downloaded image + screenshot.</p>
            )}
          </div>
          {!emailSent ? (
            <button
              type="button"
              onClick={resendEmail}
              disabled={resending}
              className="inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-current px-4 py-2 text-xs font-bold disabled:opacity-60"
            >
              {resending ? "Sending…" : "Resend email"}
            </button>
          ) : null}
        </div>
        <div id="pass-print-area" className="print:space-y-6">
          {passes.map((p) => (
            <PassCard
              key={p.type}
              name={user.name}
              serial={user.serial ?? ""}
              email={user.email}
              mobile={user.mobile ?? ""}
              rollNo={user.rollNo}
              food={user.food}
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
          Tip: download the image + take a screenshot as backup. Keep QR
          private — anyone with image can scan first and burn your pass.
        </p>
      </div>
    );
  }

  return (
    <Container className="rank-card p-5 sm:p-6">
      {slots && !slots.open ? (
        <p role="alert" className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
          Registrations full — retrieve your pass below if already registered.
        </p>
      ) : null}
      <form noValidate onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="pass-name" className="mb-1.5 block text-sm font-medium text-cream">
            Full name *
          </label>
          <input
            id="pass-name"
            autoComplete="name"
            maxLength={60}
              placeholder="Debashish Pradhan"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            className={inputCls(Boolean(errors.fullName))}
          />
          {errors.fullName ? (
            <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.fullName}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="pass-roll" className="mb-1.5 block text-sm font-medium text-cream">
            Roll number *
          </label>
          <input
            id="pass-roll"
            autoComplete="off"
            maxLength={20}
              placeholder="24BTCSE26"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            aria-invalid={Boolean(errors.rollNo)}
            className={cn(inputCls(Boolean(errors.rollNo)), "uppercase")}
          />
          {errors.rollNo ? (
            <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.rollNo}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="pass-email" className="mb-1.5 block text-sm font-medium text-cream">
            College mail *
          </label>
          <input
            id="pass-email"
            type="email"
            autoComplete="email"
            maxLength={100}
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
            Mobile number *
          </label>
          <input
            id="pass-mobile"
            type="tel"
            autoComplete="tel-national"
            inputMode="numeric"
            maxLength={13}
            placeholder="9437512345"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            aria-invalid={Boolean(errors.mobile)}
            className={inputCls(Boolean(errors.mobile))}
          />
          {errors.mobile ? (
            <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.mobile}</p>
          ) : null}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <GenderSelect
              value={gender}
              onChange={setGender}
              error={errors.gender}
            />
          </div>
          <div>
            <FoodSelect
              value={food}
              onChange={setFood}
              labelId="pass-food-label"
              error={errors.food}
            />
          </div>
        </div>
        {apiError ? (
          <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
            {apiError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={status === "busy" || (slots !== null && !slots.open)}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black hover:bg-brandhover disabled:opacity-70"
        >
          {status === "busy" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Generating pass…
            </>
          ) : (
            "Register + get my pass"
          )}
        </button>
      </form>
    </Container>
  );
}
