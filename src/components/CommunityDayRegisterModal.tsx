"use client";

import { useState } from "react";
import { ArrowRight, Hash, Loader2, Mail, Phone, ShieldCheck, User } from "lucide-react";
import Modal from "@/components/Modal";
import PassCard from "@/components/PassCard";
import {
  normalizedContact,
  validateContact,
  type ContactErrors,
} from "@/lib/validate-contact";
import FoodSelect from "@/components/FoodSelect";
import GenderSelect from "@/components/GenderSelect";
import { emailExactPass } from "@/lib/pass-image";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "scdRegistration";
const SHEET_URL = process.env.NEXT_PUBLIC_SCD_SHEET_URL ?? "";

type Status = "form" | "submitting" | "done";

interface IssuedPass {
  type: "ENTRY" | "FOOD";
  token: string;
  qrContent: string;
  qrImage: string;
  status: string;
}

const inputClasses = (invalid: boolean) =>
  `w-full min-h-[44px] rounded-xl border bg-ink/60 py-3 pl-10 pr-3 text-base text-cream transition-colors placeholder:text-faint/50 hover:border-faint focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/40 sm:text-sm ${
    invalid ? "border-red-400/70" : "border-line"
  }`;

const iconClasses =
  "pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint";

export default function CommunityDayRegisterModal({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState("");
  const [food, setFood] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>("form");
  const [apiError, setApiError] = useState("");
  const [pass, setPass] = useState<IssuedPass | null>(null);
  const [passUser, setPassUser] = useState({ name: "", serial: "", rollNo: "", food: "" });
  const [emailSent, setEmailSent] = useState(false);
  const [slots, setSlots] = useState<{ registered: number; limit: number; open: boolean } | null>(null);

  const openModal = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<Record<string, string>>;
        if (s.fullName ?? s.name) setFullName(String(s.fullName ?? s.name));
        if (s.rollNo) setRollNo(String(s.rollNo));
        if (s.email) setEmail(String(s.email));
        if (s.mobile) setMobile(String(s.mobile));
        if (s.gender) setGender(String(s.gender));
        if (s.food) setFood(String(s.food));
      }
    } catch {
      // ignore
    }
    setStatus("form");
    setErrors({});
    setApiError("");
    setPass(null);
    setOpen(true);
    fetch("/api/passes/issue?count=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.registered === "number") setSlots(d);
      })
      .catch(() => {});
  };

  const close = () => {
    setOpen(false);
    setStatus("form");
    setErrors({});
    setApiError("");
  };

  async function submit() {
    const fieldErrors = validateContact({ fullName, rollNo, email, mobile, gender, food });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    const contact = normalizedContact({ fullName, rollNo, email, mobile, gender, food });
    setStatus("submitting");
    setApiError("");

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ fullName, rollNo, email, mobile, gender, food }),
      );
    } catch {
      // private mode etc.
    }

    // Organizer backup: contact sheet, 2.5s max, never blocks pass.
    if (SHEET_URL) {
      try {
        const ctrl = new AbortController();
        const timer = window.setTimeout(() => ctrl.abort(), 2500);
        await fetch(SHEET_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ ...contact, source: "sbg-site" }),
          signal: ctrl.signal,
        });
        window.clearTimeout(timer);
      } catch (err) {
        console.error("[SCD] sheet save failed:", err);
      }
    }

    // Issue entry pass directly — no Meetup step.
    try {
      const res = await fetch("/api/passes/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, rollNo, email, mobile, gender, food }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors as ContactErrors);
        throw new Error(data.error ?? "Pass issue failed.");
      }
      const issued = (data.passes as IssuedPass[])[0];
      const u = data.user as { name: string; serial?: string; rollNo: string; food: string };
      setPass(issued);
      setPassUser({
        name: u.name,
        serial: u.serial ?? "",
        rollNo: u.rollNo,
        food: u.food,
      });
      setEmailSent(false);
      setStatus("done");
      // Email the exact on-screen pass (fire-and-forget).
      void emailExactPass({
        serial: u.serial ?? "",
        name: u.name,
        email,
        rollNo: u.rollNo,
        food: u.food,
        qrDataUrl: issued.qrImage,
        token: issued.token,
      }).then((ok) => {
        if (ok) setEmailSent(true);
      });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Pass issue failed.");
      setStatus("form");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          className ||
          "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black shadow-[0_2px_16px_rgba(173,92,255,0.32)] transition-colors duration-150 hover:bg-brandhover"
        }
      >
        {children || (
          <>
            Get event pass — Free
            <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>

      <Modal open={open} onClose={close} title="Register for Community Day">
        {status === "done" && pass ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-center">
              <span className="animate-check-pop mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-green-500/20">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-300" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <p className="mt-2 text-base font-bold text-cream">You&apos;re in, {passUser.name.split(" ")[0]}!</p>
              <p className="mt-0.5 text-xs leading-relaxed text-green-200/80">
                Entry pass ready · one-time use, invalid after gate scan.
              </p>
            </div>
            <div className={`flex items-start gap-2.5 rounded-xl border p-3 text-sm ${emailSent ? "border-sky-400/30 bg-sky-400/10 text-sky-200" : "border-amber-400/30 bg-amber-400/10 text-amber-200"}`}>
              <Mail className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              {emailSent ? (
                <p className="min-w-0 break-words [overflow-wrap:anywhere]">Pass emailed to <span className="font-semibold break-all">{email}</span> — check inbox + spam.</p>
              ) : (
                <p className="min-w-0 break-words [overflow-wrap:anywhere]">Mail not sent to <span className="font-semibold break-all">{email}</span> yet — keep the screenshot.</p>
              )}
            </div>
            <div id="pass-print-area">
              <PassCard
                name={passUser.name}
                serial={passUser.serial}
                email={email}
                mobile={mobile}
                rollNo={passUser.rollNo}
                food={passUser.food}
                type={pass.type}
                qrImage={pass.qrImage}
                token={pass.token}
              />
            </div>
            <button
              type="button"
              onClick={close}
              className="min-h-[44px] w-full rounded-full border border-line px-4 py-2 text-sm text-fog transition-colors hover:text-cream"
            >
              Done
            </button>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="space-y-4"
          >
            {slots && !slots.open ? (
              <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
                Registrations full — retrieve your pass below if already registered.
              </p>
            ) : null}

            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
            </p>
            <div>
              <label htmlFor="scd-name" className="mb-1.5 block text-sm font-medium text-cream">
                Full name *
              </label>
              <div className="relative">
                <User className={iconClasses} aria-hidden />
                <input
                  id="scd-name"
                  autoComplete="name"
                  maxLength={60}
                  placeholder="Debashish Pradhan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  aria-invalid={Boolean(errors.fullName)}
                  className={inputClasses(Boolean(errors.fullName))}
                />
              </div>
              {errors.fullName ? (
                <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.fullName}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="scd-roll" className="mb-1.5 block text-sm font-medium text-cream">
                Roll number *
              </label>
              <div className="relative">
                <Hash className={iconClasses} aria-hidden />
                <input
                  id="scd-roll"
                  autoComplete="off"
                  maxLength={20}
                  placeholder="24BTCSE26"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  aria-invalid={Boolean(errors.rollNo)}
                  aria-describedby="scd-roll-hint"
                  className={cn(inputClasses(Boolean(errors.rollNo)), "uppercase")}
                />
              </div>
              {errors.rollNo ? (
                <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.rollNo}</p>
              ) : (
                <p id="scd-roll-hint" className="mt-1.5 text-xs text-faint">As on your ID card.</p>
              )}
            </div>
            <div>
              <label htmlFor="scd-email" className="mb-1.5 block text-sm font-medium text-cream">
                College mail *
              </label>
              <div className="relative">
                <Mail className={iconClasses} aria-hidden />
                <input
                  id="scd-email"
                  type="email"
                  autoComplete="email"
                  maxLength={100}
                  inputMode="email"
                  placeholder="24btcse26@suiit.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby="scd-email-hint"
                  className={inputClasses(Boolean(errors.email))}
                />
              </div>
              {errors.email ? (
                <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.email}</p>
              ) : (
                <p id="scd-email-hint" className="mt-1.5 text-xs text-faint">Must end with @suiit.ac.in — pass emails here.</p>
              )}
            </div>
            <div>
              <label htmlFor="scd-mobile" className="mb-1.5 block text-sm font-medium text-cream">
                Mobile number *
              </label>
              <div className="relative">
                <Phone className={iconClasses} aria-hidden />
                <input
                  id="scd-mobile"
                  type="tel"
                  autoComplete="tel-national"
                  inputMode="numeric"
                  maxLength={13}
                  placeholder="9437512345"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  aria-invalid={Boolean(errors.mobile)}
                  className={inputClasses(Boolean(errors.mobile))}
                />
              </div>
              {errors.mobile ? (
                <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.mobile}</p>
              ) : null}
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
            </p>
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
                  labelId="scd-food-label"
                  error={errors.food}
                />
              </div>
            </div>
            {apiError ? (
              <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
                {apiError}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 pt-1">
              <button
                type="submit"
                disabled={status === "submitting" || (slots !== null && !slots.open)}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand to-purple-500 px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_24px_rgba(173,92,255,0.4)] transition-all hover:shadow-[0_4px_32px_rgba(173,92,255,0.55)] disabled:opacity-70"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Generating pass…
                  </>
                ) : (
                  <>
                    Get my entry pass
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-faint">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
                Free entry · One pass per student · Screenshot works as backup
              </p>
              <div>
                <button
                  type="button"
                  onClick={close}
                  className="min-h-[44px] rounded-full px-4 py-2 text-sm text-fog transition-colors hover:text-cream"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
