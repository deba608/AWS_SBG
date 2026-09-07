"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import Modal from "@/components/Modal";
import { SITE } from "@/lib/constants";
import {
  normalizedContact,
  validateContact,
  type ContactErrors,
} from "@/lib/validate-contact";

const STORAGE_KEY = "scdRegistration";
const SHEET_URL = process.env.NEXT_PUBLIC_SCD_SHEET_URL ?? "";

type Status = "form" | "submitting";

interface StoredRegistration {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  submitted: boolean;
  meetupDone: boolean;
}

function readStored(): StoredRegistration | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRegistration & { name?: string };
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.firstName && typeof parsed.name === "string") {
      const parts = parsed.name.trim().split(/\s+/).filter(Boolean);
      return {
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" "),
        email: parsed.email ?? "",
        mobile: parsed.mobile ?? "",
        submitted: Boolean(parsed.submitted),
        meetupDone: false,
      };
    }
    return { ...parsed, meetupDone: Boolean(parsed.meetupDone) };
  } catch {
    return null;
  }
}

function persist(data: StoredRegistration) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Private mode etc.
  }
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

  const openModal = () => {
    const stored = readStored();
    if (stored) {
      setFirstName(stored.firstName);
      setLastName(stored.lastName);
      setEmail(stored.email);
      setMobile(stored.mobile);
    }
    setStatus("form");
    setErrors({});
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setStatus("form");
    setErrors({});
  };

  async function submit() {
    const fieldErrors = validateContact({ firstName, lastName, email, mobile });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    const contact = normalizedContact({ firstName, lastName, email, mobile });
    setStatus("submitting");

    // Save details locally immediately
    const stored: StoredRegistration = {
      ...contact,
      submitted: true,
      meetupDone: true,
    };
    persist(stored);

    // Save to Google Sheets (if configured) with 2.5s max timeout so user is never stalled
    if (SHEET_URL) {
      try {
        const ctrl = new AbortController();
        const timer = window.setTimeout(() => ctrl.abort(), 2500);
        await fetch(SHEET_URL, {
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
      } catch (err) {
        console.error("[SCD] sheet save failed:", err);
      }
    }

    // Direct redirection to Meetup
    window.location.href = SITE.links.eventCommunityDay;
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
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="space-y-4"
        >
          <p className="text-sm leading-relaxed text-fog">
            Enter your details below — then you will be redirected directly to
            Meetup to complete your RSVP.
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
                placeholder="e.g. Priya"
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
                placeholder="e.g. Sharma"
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
              placeholder="you@college.edu"
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
          <div className="flex flex-col gap-3 pt-1">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-brandhover disabled:opacity-70"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Redirecting to Meetup…
                </>
              ) : (
                <>
                  Continue to Meetup
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
      </Modal>
    </>
  );
}
