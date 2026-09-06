# AWS Student Community Day SUIIT 2026 — Event Page + Registration Plan

> Created 2026-09-06. Source of truth for registration: https://meetu.ps/e/Qgc6f/1fcHtj/i
> Canonical: https://www.meetup.com/aws-sbg-at-sambalpur-university-institute-of-info-technology/events/316398069/

## 0. Event Snapshot (from Meetup)

- **Name:** AWS Student Community Day SUIIT 2026
- **Date:** Saturday, Oct 3, 2026, 9:00 AM – 4:00 PM IST
- **Venue:** APJ Abdul Kalam Auditorium, SUIIT, Jyoti Vihar, Burla, Sambalpur
- **Host:** Pratik Samal / AWS SBG at SUIIT
- **Entry:** FREE, Expected: 300+ students + devs
- **Themes:** Cloud Computing, AI, Generative AI, DevOps, AWS ecosystem
- **Perks (confirmed on Meetup):** sessions by AWS pros/community leaders, hands-on + interactive activities, networking, swag/goodies, lunch for registered participants, participation certificate
- **Audience:** Students (no prior AWS needed), devs, AI/ML + GenAI enthusiasts, DevOps, open-source contributors
- **Social:** Instagram https://www.instagram.com/awssbg_suiit — Event website: TBA
- **Registration:** Meetup RSVP only (no custom backend in v1)

## 1. Goal & Non-Goals

**Goal:** Ship a student-registration funnel for Community Day on the existing Next.js site:
Discover (Home + `/events`) → Details (`/events/aws-student-community-day-suiit-2026`) → Register on Meetup (external, new tab) → Know what to bring / where to go.

**Non-goals (v1):**
- No custom form / DB / auth / ticket QR — Meetup handles RSVP + headcount.
- No payment, no seat-selection, no email pipeline.
- No speaker CMS — hardcode in `src/data/` with `TBA` fallbacks.
- No separate mobile app.

## 2. Registration Strategy (Meetup as Source of Truth)

1. Single constant — add to `src/lib/constants.ts`:
   ```ts
   eventCommunityDay: "https://meetu.ps/e/Qgc6f/1fcHtj/i",
   instagram: "https://www.instagram.com/awssbg_suiit",
   ```
   All CTAs import from `SITE.links` — never hardcode URL in components.
2. Every Register CTA: `target="_blank" rel="noopener noreferrer"`, `aria-label="Register for AWS Student Community Day on Meetup"`, min-height 44px.
3. Add `?utm_source=sbg-site&utm_medium=event-page&utm_campaign=scd-2026` to Meetup link for attribution (Meetup preserves query on redirect — verify).
4. Registration explainer (3 steps) on detail page:
   1. Click Register → opens Meetup → Sign in / Join group
   2. RSVP Attend + answer headcount question (lunch/swag)
   3. Show Meetup RSVP confirmation at entry + bring college ID
5. Fallback states: if Meetup hits capacity → button flips to `status: "closed"` tone (`Registrations closed — Join waitlist`) but still links to Meetup. If link rots → falls back to `SITE.links.eventDefault`.

## 3. IA & Routes

| Surface | Change |
|---|---|
| `/` Home hero | Add `Badge`: `Oct 3 · SUIIT · Free` + secondary CTA `Register for Community Day →` linking to detail page. Featured events section: pin Community Day as first card (`upcomingEvents[0]`). |
| `/events` | Featured banner at top (Community Day spotlight) + existing `EventsExplorer` grid. Community Day card gets `status: "filling-fast"` + `registerUrl = SITE.links.eventCommunityDay`. |
| `/events/aws-student-community-day-suiit-2026` **(new)** | Full detail page: hero + countdown + stats + about + agenda + speakers + perks + venue + FAQ + final CTA + related events. `metadata` with OpenGraph. |
| `Navbar` | Optional: add `Community Day` pill/badge link to detail page during Sep–Oct; remove after event → move to past events. |
| `/events` past section (post-event) | After Oct 3: move Community Day to `pastEvents` with recap + photos link. |

Route slug: `aws-student-community-day-suiit-2026` — matches Meetup title, SEO-friendly, future-proof for 2027 edition.

## 4. Data Model Changes

`src/data/events.ts`:
```ts
export const communityDay = {
  id: "aws-student-community-day-suiit-2026",
  title: "AWS Student Community Day SUIIT 2026",
  category: "Community Day", // extend EventCategory union
  date: "3 October 2026",
  time: "9:00 AM – 4:00 PM IST",
  location: "APJ Abdul Kalam Auditorium, SUIIT, Burla",
  description: "...",
  status: "filling-fast",
  registerUrl: SITE.links.eventCommunityDay,
  capacity: 300,
  perks: ["Lunch", "Swag", "Certificate"],
} satisfies EventItem;
```
- Extend `EventCategory` with `"Community Day" | "Flagship"` and update `FILTER_TO_CATEGORY` + `EVENT_FILTERS` (or keep filter as All + exclude flagship from tabs, show only in featured slot — decide in build; recommended: exclude from tabs, pin separately to avoid filter confusion).
- New file `src/data/community-day.ts`: agenda[], speakers[], faqs[], perks[], venue info. Speakers start as `TBA` placeholders with `role: "AWS Professional / Community Leader"` — no invented names.

`src/lib/constants.ts`: add `eventCommunityDay`, real `instagram`, `collegeName: "Sambalpur University Institute of Information Technology (SUIIT)"` if approved to de-placeholder.

## 5. Detail Page Sections (`/events/aws-student-community-day-suiit-2026/page.tsx`)

Reuse: `Container`, `SectionHeading`, `Badge`, `Button`, `Reveal`, `EventCard`, `StatsSection` patterns, `HeroVisual` / `bg-grid + glow-brand`. No new deps.

1. **Hero:** eyebrow `Flagship · Oct 3 · Free`, H1 `AWS Student Community Day SUIIT 2026`, sub from Meetup details, meta row (CalendarDays / Clock / MapPin), dual CTA: `Register on Meetup (external)` primary + `View agenda` secondary (anchor). Trust line: `300+ expected · Lunch + Swag + Certificate`.
2. **Countdown + Stats strip:** client countdown to `2026-10-03T09:00:00+05:30` (respect `prefers-reduced-motion`); stats: 300+ attendees, 7 hrs, 5 tracks (Cloud/AI/GenAI/DevOps/AWS), 100% beginner-friendly.
3. **About / Why attend:** 4 cards (Learn / Build / Connect / Grow) tailored to Meetup copy.
4. **Agenda timeline:** placeholder slots 09:00 check-in → opening → 3–4 sessions (Cloud, AI/GenAI, DevOps) → lunch → hands-on/interactive → networking + swag → close. Mark unconfirmed as `TBA`. Data-driven from `community-day.ts` so organizers edit one file.
5. **Speakers:** grid of `TeamCard`-style cards; v1 = 3–4 `TBA` cards (`AWS Professional`, `Community Leader`, `Industry Expert`) — no fake names/photos.
6. **Perks:** Lunch / Swag / Certificate / Networking icons (`lucide-react` only).
7. **Who should attend + What to bring:** checklist (college ID, Meetup RSVP confirmation, laptop optional, curiosity required; no prior AWS needed).
8. **Venue:** APJ Abdul Kalam Auditorium address + `Get directions` link (Google Maps query URL) + note `Entry FREE`.
9. **FAQ (accordion, semantic `<details>` or Tabs):** Is it free? Do I need AWS experience? How do I register? (Meetup steps) Is lunch/cert included? Can non-SUIIT students attend? What to bring? Group size / on-spot entry?
10. **Final CTA:** big `JoinCTA`-variant with single primary `Register on Meetup` + secondary `Follow on Instagram`.
11. **Related:** 3 `EventCard`s from `upcomingEvents`.

SEO: `title: "AWS Student Community Day SUIIT 2026 — Oct 3 | AWS SBG"`, description ~155 chars, OpenGraph, canonical to detail page. JSON-LD `Event` schema (name, startDate, location, organizer, offers.price=0, eventAttendanceMode=Offline).

## 6. Design Notes (match existing system)

- Dark-first tokens in `globals.css` (`ink/coalsurface/line/cream/fog/brand #FF9900`). Hero: `bg-grid + bg-grid-fade + glow-brand`, no stock images.
- Type: H1 `5xl-7xl`, H2 `3xl-4xl`, eyebrow orange uppercase. Container `max-w-7xl px-5 md:px-8`, section `py-16 md:py-24`. Cards `rounded-2xl border-line bg-surface p-6`.
- A11y: one `h1`, heading order, focus-visible rings, 44px targets, `aria-hidden` on decorative visuals, color contrast on `faint` text, reduced-motion disables countdown animation (show static date).

## 7. Phased Build

- **Phase 1 — Data + links (30 min):** update `constants.ts` (meetup + instagram), add `community-day.ts`, prepend Community Day to `upcomingEvents`, extend category type safely. Verify `tsc --noEmit`.
- **Phase 2 — Listing + Home (30 min):** featured banner on `/events`, pin card on `/` (slice or explicit `communityDay` import), Navbar pill (optional, behind flag). Verify responsive 360px→desktop, no x-scroll.
- **Phase 3 — Detail page (1–2 hrs):** build sections above as server components + one small client `Countdown.tsx`. Agenda/speakers/FAQ from data file. Add `loading.tsx`/`not-found` reuse.
- **Phase 4 — Polish & verify:** `npm run lint`, `tsc --noEmit`, `npm run build` green; click every Register CTA → opens Meetup in new tab; Lighthouse/a11y smoke; OpenGraph check; mobile drawer nav.

Each phase ends with `npm run build` green before proceeding.

## 8. Acceptance Checklist

- [ ] Meetup URL lives in exactly one place (`SITE.links.eventCommunityDay`), all Register buttons use it + `utm_*`
- [ ] `/events/aws-student-community-day-suiit-2026` renders: hero, countdown, agenda, speakers (TBA ok), perks, venue, FAQ, final CTA
- [ ] Home + `/events` surface Community Day above the fold with correct date/venue/status
- [ ] No invented speaker names, dates, or venue details beyond Meetup copy; TBA where unknown
- [ ] `npm run build` passes, no TS/ESLint errors; responsive, no horizontal scroll; one h1, focus rings, reduced-motion honored
- [ ] Post-event plan noted: move to `pastEvents` with recap link

## 9. Open Questions for Organizers

1. Final agenda timings + speaker names/photos/roles? (currently TBA)
2. Is non-SUIIT / outsider entry allowed? On-spot registration or RSVP-only?
3. RSVP cap on Meetup (300?) + waitlist policy?
4. Contact person / helpline + event website URL (Meetup says "will be updated")?
5. Approve replacing `[COLLEGE NAME]` placeholder with SUIIT publicly?
