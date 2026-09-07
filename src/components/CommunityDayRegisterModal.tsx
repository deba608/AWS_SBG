"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Modal from "@/components/Modal";
import { SITE } from "@/lib/constants";
import {
  normalizedContact,
  validateContact,
  type ContactErrors,
} from "@/lib/validate-contact";

const STORAGE_KEY = "scdRegistration";
const SHEET_URL = process.env.NEXT_PUBLIC_SCD_SHEET_URL ?? "";

type Status = "form" | "submitting" | "success" | "error";

interface StoredRegistration {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  submitted: boolean;
}

function readStored(): StoredRegistration | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRegistration & { name?: string };
    if (!parsed || typeof parsed !== "object") return null;
    // Migrate old single-name shape { name } → { firstName, lastName }.
    if (!parsed.firstName && typeof parsed.name === "string") {
      const parts = parsed.name.trim().split(/\s+/).filter(Boolean);
      return {
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" "),
        email: parsed.email ?? "",
        mobile: parsed.mobile ?? "",
        submitted: Boolean(parsed.submitted),
      };
    }
    return parsed as StoredRegistration;
  } catch {
    return null;
  }
}

function persist(data: StoredRegistration) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Private mode etc. — prefill just won't work, flow still continues.
  }
}

const inputClasses = (invalid: boolean) =>
  `w-full rounded-xl border bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-brand ${
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
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<ContactErrors & { consent?: string }>({});
  const [status, setStatus] = useState<Status>("form");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [successName, setSuccessName] = useState("");

  const openModal = () => {
    const stored = readStored();
    if (stored) {
      setFirstName(stored.firstName);
      setLastName(stored.lastName);
      setEmail(stored.email);
      setMobile(stored.mobile);
      if (stored.submitted) {
        // Already gave details from this browser — straight to success state.
        setSuccessName(stored.firstName);
        setIsDuplicate(true);
        setStatus("success");
      } else {
        setStatus("form");
      }
    } else {
      setStatus("form");
    }
    setErrors({});
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    // Reset transient states so a fresh open starts clean (fields reprefill).
    setStatus("form");
    setIsDuplicate(false);
    setErrors({});
  };

  async function submit() {
    const fieldErrors = validateContact({ firstName, lastName, email, mobile });
    const next: ContactErrors & { consent?: string } = { ...fieldErrors };
    if (!consent) {
      next.consent = "Please accept so we can send event updates.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const contact = normalizedContact({ firstName, lastName, email, mobile });
    setStatus("submitting");

    try {
      if (SHEET_URL) {
        const ctrl = new AbortController();
        const timer = window.setTimeout(() => ctrl.abort(), 9000);
        // text/plain avoids a CORS preflight — Apps Script Web Apps
        // don't answer OPTIONS, but accept simple POSTs.
        const res = await fetch(SHEET_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            mobile: contact.mobile,
            source: "sbg-site",
          }),
          signal: ctrl.signal,
        });
        window.clearTimeout(timer);
        const data = (await res.json().catch(() => null)) as {
          status?: string;
        } | null;
        if (!res.ok || (data?.status !== "ok" && data?.status !== "duplicate")) {
          throw new Error("submit-failed");
        }
        setIsDuplicate(data?.status === "duplicate");
      }
      persist({ ...contact, submitted: true });
      setSuccessName(contact.firstName);
      setStatus("success");
    } catch {
      persist({ ...contact, submitted: false });
      setStatus("error");
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
            Register on Meetup — Free
            <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>

      <Modal open={open} onClose={close} title="Register for Community Day">
        {status === "success" ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" aria-hidden />
            <p className="mt-4 text-lg font-semibold text-cream">
              {isDuplicate ? "You're already on the list!" : "You're on the list!"}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fog">
              {isDuplicate
                ? "We already have your details — no need to fill the form again."
                : `Thanks${successName ? `, ${successName}` : ""}! Your details are with the organizers.`}{" "}
              One last step: RSVP on Meetup and show it at entry.
            </p>
            <a
              href={SITE.links.eventCommunityDay}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-brandhover"
            >
              Continue to Meetup
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <p className="mt-3 text-xs text-faint">
              Opens Meetup in a new tab · show RSVP + college ID at entry
            </p>
          </div>
        ) : status === "error" ? (
          <div className="text-center" role="alert">
            <p className="text-lg font-semibold text-cream">Couldn&apos;t save your details</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fog">
              Network hiccup — your info is still in the form. Retry, or skip
              ahead to Meetup so you don&apos;t lose your spot.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void submit()}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-brandhover"
              >
                Retry
              </button>
              <a
                href={SITE.links.eventCommunityDay}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-cream transition-colors hover:border-brand/60"
              >
                Skip — go straight to Meetup
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
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
              Takes 30 seconds — we use this for headcount, lunch/swag and event
              updates. Then you RSVP on Meetup.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="scd-first-name" className="mb-1.5 block text-sm font-medium text-cream">
                  First name *
                </label>
                <input
                  id="scd-first-name"
                  name="firstName"
                  autoComplete="given-name"
                  placeholder="e.g. Priya"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={errors.firstName ? "scd-first-name-error" : undefined}
                  className={inputClasses(Boolean(errors.firstName))}
                />
                {errors.firstName ? (
                  <p id="scd-first-name-error" role="alert" className="mt-1.5 text-xs text-red-300">
                    {errors.firstName}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="scd-last-name" className="mb-1.5 block text-sm font-medium text-cream">
                  Last name *
                </label>
                <input
                  id="scd-last-name"
                  name="lastName"
                  autoComplete="family-name"
                  placeholder="e.g. Sharma"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby={errors.lastName ? "scd-last-name-error" : undefined}
                  className={inputClasses(Boolean(errors.lastName))}
                />
                {errors.lastName ? (
                  <p id="scd-last-name-error" role="alert" className="mt-1.5 text-xs text-red-300">
                    {errors.lastName}
                  </p>
                ) : null}
              </div>
            </div>
            <div>
              <label htmlFor="scd-email" className="mb-1.5 block text-sm font-medium text-cream">
                Email *
              </label>
              <input
                id="scd-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "scd-email-error" : undefined}
                className={inputClasses(Boolean(errors.email))}
              />
              {errors.email ? (
                <p id="scd-email-error" role="alert" className="mt-1.5 text-xs text-red-300">
                  {errors.email}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="scd-mobile" className="mb-1.5 block text-sm font-medium text-cream">
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
                <p id="scd-mobile-error" role="alert" className="mt-1.5 text-xs text-red-300">
                  {errors.mobile}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="scd-consent" className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-fog">
                <input
                  id="scd-consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  aria-describedby={errors.consent ? "scd-consent-error" : undefined}
                  className="mt-1 h-4 w-4 shrink-0 accent-brand"
                />
                <span>
                  I agree to be contacted by AWS SBG SUIIT about Community Day
                  (reminders, venue updates) on email/SMS/WhatsApp. *
                </span>
              </label>
              {errors.consent ? (
                <p id="scd-consent-error" role="alert" className="mt-1.5 text-xs text-red-300">
                  {errors.consent}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-3 pt-1">
              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-brandhover disabled:opacity-70"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  <>
                    Submit & Continue
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={close}
                  className="min-h-[44px] rounded-full px-4 py-2 text-sm text-fog transition-colors hover:text-cream"
                >
                  Cancel
                </button>
                <a
                  href={SITE.links.eventCommunityDay}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center text-sm font-medium text-fog transition-colors hover:text-brand"
                >
                  Skip — go straight to Meetup
                </a>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
