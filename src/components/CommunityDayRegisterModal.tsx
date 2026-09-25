"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import Modal from "@/components/Modal";
import PassCard from "@/components/PassCard";
import {
  FOODS,
  GENDERS,
  normalizedContact,
  validateContact,
  type ContactErrors,
} from "@/lib/validate-contact";
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
  `w-full min-h-[44px] rounded-xl border bg-surface px-3 py-3 text-base text-cream placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm ${
    invalid ? "border-red-400/70" : "border-line"
  }`;

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
  const [gender, setGender] = useState("");
  const [food, setFood] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>("form");
  const [apiError, setApiError] = useState("");
  const [pass, setPass] = useState<IssuedPass | null>(null);
  const [passUser, setPassUser] = useState({ name: "", rollNo: "", food: "" });
  const [emailSent, setEmailSent] = useState(false);

  const openModal = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<Record<string, string>>;
        if (s.fullName) setFullName(String(s.fullName));
        if (s.rollNo) setRollNo(String(s.rollNo));
        if (s.email) setEmail(String(s.email));
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
  };

  const close = () => {
    setOpen(false);
    setStatus("form");
    setErrors({});
    setApiError("");
  };

  async function submit() {
    const fieldErrors = validateContact({ fullName, rollNo, email, gender, food });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    const contact = normalizedContact({ fullName, rollNo, email, gender, food });
    setStatus("submitting");
    setApiError("");

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contact));
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
        body: JSON.stringify(contact),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors as ContactErrors);
        throw new Error(data.error ?? "Pass issue failed.");
      }
      const issued = (data.passes as IssuedPass[])[0];
      setPass(issued);
      setPassUser({
        name: (data.user as { name: string }).name,
        rollNo: (data.user as { rollNo: string }).rollNo,
        food: (data.user as { food: string }).food,
      });
      setEmailSent(Boolean(data.email?.sent));
      setStatus("done");
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
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
              Entry pass ready. Download image or take a screenshot — QR scans
              once at gate.
              {emailSent ? " A copy was also emailed to you." : null}
            </div>
            <PassCard
              name={passUser.name}
              email={email}
              rollNo={passUser.rollNo}
              food={passUser.food}
              type={pass.type}
              qrImage={pass.qrImage}
              token={pass.token}
            />
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
            <p className="text-sm leading-relaxed text-fog">
              Enter details — your QR entry pass generates instantly, shows
              here, and emails to you.
            </p>

            <div>
              <label htmlFor="scd-name" className="mb-1.5 block text-sm font-medium text-cream">
                Full name *
              </label>
              <input
                id="scd-name"
                autoComplete="name"
                placeholder="e.g. Debashish Pradhan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                aria-invalid={Boolean(errors.fullName)}
                className={inputClasses(Boolean(errors.fullName))}
              />
              {errors.fullName ? (
                <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.fullName}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="scd-roll" className="mb-1.5 block text-sm font-medium text-cream">
                Roll number *
              </label>
              <input
                id="scd-roll"
                autoComplete="off"
                placeholder="e.g. 24BTCSE26"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                aria-invalid={Boolean(errors.rollNo)}
                className={cn(inputClasses(Boolean(errors.rollNo)), "uppercase")}
              />
              {errors.rollNo ? (
                <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.rollNo}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="scd-email" className="mb-1.5 block text-sm font-medium text-cream">
                College mail *
              </label>
              <input
                id="scd-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="24btcse26@suiit.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                className={inputClasses(Boolean(errors.email))}
              />
              {errors.email ? (
                <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.email}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="scd-gender" className="mb-1.5 block text-sm font-medium text-cream">
                  Gender *
                </label>
                <select
                  id="scd-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  aria-invalid={Boolean(errors.gender)}
                  className={inputClasses(Boolean(errors.gender))}
                >
                  <option value="">Select…</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {errors.gender ? (
                  <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.gender}</p>
                ) : null}
              </div>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-cream" id="scd-food-label">
                  Food *
                </span>
                <div role="radiogroup" aria-labelledby="scd-food-label" className="flex gap-2">
                  {FOODS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      role="radio"
                      aria-checked={food === f}
                      onClick={() => setFood(f)}
                      className={cn(
                        "min-h-[44px] flex-1 rounded-xl border px-3 text-sm font-semibold transition-colors",
                        food === f
                          ? f === "Veg"
                            ? "border-green-500 bg-green-500/15 text-green-200"
                            : "border-amber-500 bg-amber-500/15 text-amber-200"
                          : "border-line text-fog hover:text-cream",
                      )}
                    >
                      {f === "Veg" ? "Veg" : "Non-veg"}
                    </button>
                  ))}
                </div>
                {errors.food ? (
                  <p role="alert" className="mt-1.5 text-xs text-red-300">{errors.food}</p>
                ) : null}
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
                disabled={status === "submitting"}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-brandhover disabled:opacity-70"
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
