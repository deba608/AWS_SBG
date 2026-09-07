# Community Day Pre-Registration Add-on — Plan (name / email / mobile before Meetup)

> Created 2026-09-07. Funnel today: Register click → `CommunityDayRegisterModal` → Meetup.
> Related: `plan-aws-student-community-day.md`.

## 0. Current state + the core problem

`src/components/CommunityDayRegisterModal.tsx` already collects first/middle/last
name, email, mobile — but `onSubmit` only writes to the visitor's **own
`localStorage`** and then `window.open`s Meetup. **Organizers never receive the
data.** That defeats the purpose of the form and adds friction for zero benefit.

Also broken right now (fix first, 5 min):
- `src/app/events/aws-student-community-day-suiit-2026/page.tsx` uses `SITE`
  (JSON-LD line ~95, RSVP links) but has **no `import { SITE }`** — `tsc` fails.
- No validation (any string passes mobile), no consent text, no fallback if the
  popup is blocked, no "skip" path.

## 1. Goal & Non-Goals

**Goal:** every Register click → short on-site form (name, email, mobile) →
data lands where organizers can use it (headcount, lunch/swag, reminders) →
visitor continues to Meetup RSVP with minimum drop-off.

**Non-goals (v1):**
- No seat allocation, ticketing, QR, or payment.
- No OTP verification (SMS costs + complexity; Meetup RSVP remains the gate).
- No full DB/CMS before Oct 3.

## 2. Where should the data go? (decision needed)

| Option | Organizers get | Effort | Verdict |
|---|---|---|---|
| A. **Google Form redirect** — form on site replaced by/redirecting to a Google Form, then auto-link to Meetup on confirmation | Spreadsheet instantly, zero backend | ~1 hr | Fallback only — two hops hurt conversion |
| B. **On-site modal → Google Sheets via Apps Script** (recommended) | Spreadsheet instantly, zero backend, keeps on-site UX | ~2–3 hrs | **Recommended v1** — free, no new deps, organizers already live in Sheets |
| C. On-site modal → Formspree/Basin/Tally endpoint | Dashboard + email alerts | ~1–2 hrs + free-tier limits | Good backup if Apps Script is blocked |
| D. Next API route + Supabase/Neon | Real DB | 1–2 days (schema, keys, RLS, dashboard) | Overkill pre-Oct 3; revisit for 2027 |

**Recommended: B.** Modal posts JSON with `fetch` to a Google Apps Script Web App
URL (stored in **env var**, not code: `NEXT_PUBLIC_SCD_SHEET_URL`). Script
appends `timestamp, name, email, mobile, source` to a Sheet owned by the lead.
Meetup stays the source of truth for attendance; the Sheet is the contact list
for reminders + lunch/swag headcount.

## 3. UX flow — Meetup is a mandatory, unskippable step (all Register CTAs → same modal)

> Design decision: no auto-opened tabs (popup-blocker wars, fragile). Instead a
> 2-step modal with a confirmation gate. Server-side RSVP verification is
> impossible without Meetup API access, so this is the strongest enforceable UX:
> the success screen is unreachable until the user passes the Meetup step in
> this browser. `localStorage` (`scdRegistration`: details + `submitted` +
> `rsvpConfirmed`) makes the gate survive refresh/close/reopen.

1. Click **Register** (hero, sticky card, spotlight, final CTA, navbar) → modal opens.
   Resume logic: `submitted && rsvpConfirmed` → success screen; `submitted &&
   !rsvpConfirmed` → Step 2 (Meetup); otherwise Step 1 (form). Old records
   without the flag migrate to `rsvpConfirmed: false` — everyone confirms.
2. **Step 1 of 2 — Your details.** Form: **First name**, **Last name**, **Email**,
   **Mobile (10-digit)**. Inline validation → `Submit & Continue` → POST to Sheet
   → persist `submitted: true` → advance to Step 2 (NOT to success).
3. **Step 2 of 2 — RSVP on Meetup (required).** States plainly: entry needs a
   Meetup RSVP; the form alone reserves nothing. Contents:
   - **Open Meetup RSVP** button — explicit click → `window.open` in the user
     gesture (never blocked) + sets `meetupOpened`. Confirm stays disabled until
     this is clicked at least once per modal open.
   - Copyable Meetup URL fallback text (manual fallback, no dependency on tabs).
   - Required checkbox **"I've completed my RSVP on Meetup"** + **Confirm RSVP**
     button (disabled until checkbox AND Meetup opened) → persist
     `rsvpConfirmed: true` → Step 3.
   - **Back to details** link (edits return to Step 1; must re-submit — never a skip).
4. **Step 3 — Registered.** Reachable ONLY via Confirm. Checklist: details saved ✓,
   Meetup RSVP confirmed ✓, plus "show RSVP + college ID at entry".
5. Cancel/close any time (never trapped); reopening resumes at the furthest
   incomplete step. Prefill from `localStorage`; duplicates skip re-submit but
   must still pass the Meetup confirm gate.

New step 0 wording on the detail page (`COMMUNITY_DAY_STEPS[0]`): "Tell us who
you are (30 sec) → RSVP on Meetup".

## 4. Validation rules

- **Name:** first + last parts, letters only (allow `.` `'` `-`).
- **Email:** trim + lowercase, HTML5 `type=email` + regex check, reject obvious
  typos? (v1: just normalize; block `+`-alias duplicates at dedupe step).
- **Mobile:** strip spaces/`+91`/leading `0`, must match `^[6-9]\d{9}$`
  (Indian 10-digit). `inputMode="numeric"`, `maxLength={13}` for paste tolerance.
- Server (Apps Script): re-validate, dedupe by email OR mobile (return
  `{ status: "duplicate" }` → show "already on the list" + Meetup button).
- Network failure: show error, keep data in fields, offer **retry** (Cancel
  closes the modal; user is never trapped).

## 5. Privacy note — phone numbers are PII

> Organizer decision: consent checkbox + skip link removed from the form to
> minimize friction. The form still collects PII (name/email/mobile), so:
> keep the Sheet shared with leads only, no public links, collect minimum
> (no college/branch/year), and honor deletion requests (contact [EMAIL]).

- India's DPDP Act applies: Sheet shared with leads only, no public links.
- Add `SITE.email` contact if missing in `constants.ts`.

## 6. Implementation phases

- **Phase 0 — Unbreak (15 min):** add missing `SITE` import to detail page;
  `npx tsc --noEmit`, `npm run lint`, `npm run build` green.
- **Phase 1 — Form hardening (1 hr):** first-name + last-name fields, validation +
  inline errors (`aria-describedby`, `aria-invalid`),
  prefill/"already registered" via `localStorage`, explicit
  Continue-to-Meetup success state (remove auto `window.open`).
  Extract to `src/lib/validate-contact.ts` for reuse + unit-testability.
- **Phase 2 — Sheet backend (1–2 hrs):** Apps Script Web App (validate →
  dedupe → append), `NEXT_PUBLIC_SCD_SHEET_URL` in `.env.local` (+document in
  README, never commit the URL), `fetch` POST with timeout + retry-once,
  success/duplicate/error states. Test with 3 real submits incl. a duplicate.
- **Phase 3 — Rollout (30 min):** route **all** Register CTAs (hero modal,
  sticky RSVP card, `/events` spotlight, final CTA, navbar) through the modal;
  update `COMMUNITY_DAY_STEPS`; `tsc` + `lint` + `build` green; mobile 360px
  check; keyboard/focus-trap check on `Modal`.

`Modal.tsx` already exists — reuse it; no new dependencies.

## 7. Acceptance checklist

- [ ] `tsc`, `lint` (0 errors), `build` green; new route still prerenders
- [ ] Submit with valid data → row appears in Sheet (< 10 s) → lands on Step 2 (Meetup), NOT success
- [ ] Step 2: Confirm disabled until Meetup opened + checkbox checked; no skip path exists
- [ ] Close modal on Step 2 without confirming → reopen lands on Step 2, never success
- [ ] Confirm → success screen with details-saved + RSVP-confirmed checklist
- [ ] Reopen after full completion → success screen directly
- [ ] Old stored records (no flag) → forced through Step 2 confirm on next open
- [ ] Duplicate email/mobile → "already on the list" + Meetup button, no double row
- [ ] Offline/submit-fail → error + retry (Cancel closes modal; user never stuck)
- [ ] Flow works with popup-blockers on (only explicit user-gesture opens, no auto-open)
- [ ] Mobile 360px: steps, checkbox, copy fallback all usable; keyboard + screen-reader pass
- [ ] Invalid mobile (`123`, `+91` + 9 digits) blocked inline with message
- [ ] No PII in code/logs/localStorage beyond prefill; Sheet shared with leads only

## 8. Open questions for organizers

1. Sheet backend approved — who owns the Google Sheet + Apps Script (account)?
2. Extra fields wanted (college, year, branch)? Recommendation: no — keep 4 fields for conversion.
3. WhatsApp reminders — which number sends them?
4. Fallback if Apps Script is blocked on event Wi-Fi — Formspree backup account?
