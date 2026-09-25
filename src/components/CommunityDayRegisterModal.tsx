"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import Modal from "@/components/Modal";
import PassCard from "@/components/PassCard";
import {
  normalizedContact,
  validateContact,
  type ContactErrors,
} from "@/lib/validate-contact";

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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>("form");
  const [apiError, setApiError] = useState("");
  const [pass, setPass] = useState<IssuedPass | null>(null);
  const [passName, setPassName] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const openModal = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<Record<string, string>>;
        if (s.firstName) setFirstName(String(s.firstName));
        if (s.lastName) setLastName(String(s.lastName));
        if (s.email) setEmail(String(s.email));
        if (s.mobile) setMobile(String(s.mobile));
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
    const fieldErrors = validateContact({ firstName, lastName, email, mobile });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    const contact = normalizedContact({ firstName, lastName, email, mobile });
    setStatus("submitting");
    setApiError("");

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contact));
    } catch {
      // private mode etc.
    }

    // Organizer backup: contact list sheet, 2.5s max, never blocks pass.
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
      setPassName((data.user as { name: string }).name);
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
              name={passName}
              email={email}
              mobile={mobile}
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="scd-first-name"
                  className="mb-1.5 block text-sm font-medium text-cream"
                >
                  First name *
                </label>
                <input
                  id="scd-first-name"
                  name="firstName"
                  autoComplete="given-name"
                  placeholder="e.g. Debashish"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={
                    errors.firstName ? "scd-first-name-error" : undefined
                  }
                  className={inputClasses(Boolean(errors.firstName))}
                />
                {errors.firstName ? (
                  <p
                    id="scd-first-name-error"
                    role="alert"
                    className="mt-1.5 text-xs text-red-300"
                  >
                    {errors.firstName}
                  </p>
                ) : null}
              </div>
              <div>
                <label
                  htmlFor="scd-last-name"
                  className="mb-1.5 block text-sm font-medium text-cream"
                >
                  Last name *
                </label>
                <input
                  id="scd-last-name"
                  name="lastName"
                  autoComplete="family-name"
                  placeholder="e.g. Pradhan"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby={
                    errors.lastName ? "scd-last-name-error" : undefined
                  }
                  className={inputClasses(Boolean(errors.lastName))}
                />
                {errors.lastName ? (
                  <p
                    id="scd-last-name-error"
                    role="alert"
                    className="mt-1.5 text-xs text-red-300"
                  >
                    {errors.lastName}
                  </p>
                ) : null}
              </div>
            </div>
            <div>
              <label
                htmlFor="scd-email"
                className="mb-1.5 block text-sm font-medium text-cream"
              >
                Email *
              </label>
              <input
                id="scd-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="24btcse26@suiit.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "scd-email-error" : undefined}
                className={inputClasses(Boolean(errors.email))}
              />
              {errors.email ? (
                <p
                  id="scd-email-error"
                  role="alert"
                  className="mt-1.5 text-xs text-red-300"
                >
                  {errors.email}
                </p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="scd-mobile"
                className="mb-1.5 block text-sm font-medium text-cream"
              >
                Mobile number *
              </label>
              <input
                id="scd-mobile"
                name="mobile"
                type="tel"
                autoComplete="tel-national"
                inputMode="numeric"
                maxLength={13}
                placeholder="98765 43210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                aria-invalid={Boolean(errors.mobile)}
                aria-describedby={errors.mobile ? "scd-mobile-error" : undefined}
                className={inputClasses(Boolean(errors.mobile))}
              />
              {errors.mobile ? (
                <p
                  id="scd-mobile-error"
                  role="alert"
                  className="mt-1.5 text-xs text-red-300"
                >
                  {errors.mobile}
                </p>
              ) : null}
            </div>
            {apiError ? (
              <p
                role="alert"
                className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200"
              >
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
