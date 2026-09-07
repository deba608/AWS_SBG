"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
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
  /** True once Meetup was opened/clicked from this browser. */
  meetupDone: boolean;
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
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>("form");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [successName, setSuccessName] = useState("");
  /** Success shown but Meetup step not yet confirmed from this browser. */
  const [awaitingMeetup, setAwaitingMeetup] = useState(false);
  /** Meetup tab was auto-opened right after this session's save. */
  const [autoOpened, setAutoOpened] = useState(false);

  const openModal = () => {
    const stored = readStored();
    if (stored) {
      setFirstName(stored.firstName);
      setLastName(stored.lastName);
      setEmail(stored.email);
      setMobile(stored.mobile);
      if (stored.submitted) {
        // Details already given from this browser — resume at the mandatory
        // Meetup step unless it was completed here before.
        setSuccessName(stored.firstName);
        setIsDuplicate(false);
        setAwaitingMeetup(!stored.meetupDone);
        setAutoOpened(false);
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
    setAwaitingMeetup(false);
    setAutoOpened(false);
    setErrors({});
  };

  /** User confirmed the Meetup step — persist so reminders stop. */
  const markMeetupDone = () => {
    const stored = readStored();
    if (stored) persist({ ...stored, meetupDone: true });
    setAwaitingMeetup(false);
  };

  async function submit() {
    const fieldErrors = validateContact({ firstName, lastName, email, mobile });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    const contact = normalizedContact({ firstName, lastName, email, mobile });
    // Open a blank tab synchronously inside the click gesture so popup
    // blockers permit it — it navigates to Meetup after the save attempt.
    const placeholderTab = window.open("about:blank", "_blank", "noopener");
    if (!placeholderTab && process.env.NODE_ENV === "development") {
      console.warn("[SCD] placeholder tab blocked — showing manual Continue button");
    }
    setStatus("submitting");

    let saveOk = false;
    let duplicate = false;
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
        duplicate = data?.status === "duplicate";
      } else if (process.env.NODE_ENV === "development") {
        console.warn("[SCD] NEXT_PUBLIC_SCD_SHEET_URL is empty — skipping Sheet save");
      }
      saveOk = true;
    } catch (err) {
      // Save failed (ad-blocker, network, Apps Script hiccup). Details stay
      // in the form + localStorage for Retry — registration still proceeds.
      console.error(
        "[SCD] sheet save failed:",
        err instanceof Error ? err.message : err
      );
      saveOk = false;
    }

    // Mandatory step wins: Meetup opens whether or not the save worked.
    let opened = false;
    if (placeholderTab && !placeholderTab.closed) {
      try {
        placeholderTab.location.href = SITE.links.eventCommunityDay;
        opened = true;
      } catch {
        try {
          placeholderTab.close();
        } catch {
          // Tab already gone — manual Continue button covers it.
        }
        opened = false;
      }
    }

    const stored: StoredRegistration = {
      ...contact,
      // Failed saves stay submitted:false so a reopen shows the prefilled
      // form (not a false "done") — Retry then appends exactly one row.
      submitted: saveOk,
      meetupDone: opened,
    };
    persist(stored);
    setIsDuplicate(duplicate);
    setAutoOpened(opened);
    setSuccessName(contact.firstName);
    if (saveOk) {
      // Meetup RSVP is mandatory — success always lands on the reminder
      // state until the step is confirmed (auto-open or Continue click).
      setAwaitingMeetup(true);
      setStatus("success");
    } else {
      setStatus("error");
    }
  }

  const greeting = successName ? `, ${successName}` : "";

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
            {awaitingMeetup ? (
              <AlertTriangle className="mx-auto h-12 w-12 text-brand" aria-hidden />
            ) : (
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" aria-hidden />
            )}
            <p className="mt-4 text-lg font-semibold text-cream">
              {awaitingMeetup ? "One step left — mandatory!" : "You're fully registered!"}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fog">
              {awaitingMeetup ? (
                autoOpened ? (
                  <>
                    Thanks{greeting}! Details saved.{" "}
                    <strong className="text-cream">
                      We&apos;ve opened Meetup in a new tab — hit Attend there
                      now.
                    </strong>{" "}
                    The form alone does NOT reserve your seat.
                  </>
                ) : (
                  <>
                    Thanks{greeting}! Details saved.{" "}
                    <strong className="text-cream">
                      RSVP on Meetup is mandatory — without it you don&apos;t
                      have a seat.
                    </strong>{" "}
                    Your browser blocked the auto-open, so tap below.
                  </>
                )
              ) : isDuplicate ? (
                <>
                  We already had your details{greeting} — and Meetup was opened
                  from this browser before. Just make sure you hit{" "}
                  <strong className="text-cream">Attend</strong> on Meetup. See
                  you Oct 3!
                </>
              ) : (
                <>
                  Thanks{greeting}! Details saved and Meetup opened. Just make
                  sure you hit <strong className="text-cream">Attend</strong>{" "}
                  there. See you Oct 3!
                </>
              )}
            </p>
            <a
              href={SITE.links.eventCommunityDay}
              target="_blank"
              rel="noopener noreferrer"
              onClick={markMeetupDone}
              autoFocus={awaitingMeetup}
              className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-brandhover"
            >
              {awaitingMeetup ? "RSVP on Meetup now — required" : "Open Meetup again"}
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
              Network hiccup — your info is still in the form.{" "}
              {autoOpened
                ? "We've still opened Meetup in a new tab so you don't lose your spot — come back here and hit Retry."
                : "Hit Retry to send it again."}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void submit()}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-brandhover"
              >
                Retry
              </button>
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
              updates. Then RSVP on Meetup is <strong className="text-cream">mandatory</strong> —
              the form alone doesn&apos;t reserve your seat.
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
