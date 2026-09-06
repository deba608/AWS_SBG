# AWS Student Builder Group — SUIIT

A dark-first developer community website: Learn → Build → Deploy → Connect.
Built with Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, and Lucide icons.

## Flagship event

**AWS Student Community Day SUIIT 2026** — Sat, Oct 3, 9 AM–4 PM IST,
APJ Abdul Kalam Auditorium, SUIIT, Burla. Free entry, 300+ expected.
Lunch + swag + certificate for registered participants.

- Details page: `/events/aws-student-community-day-suiit-2026` (agenda, speakers, venue, FAQ, countdown)
- Registration: Meetup only → https://meetu.ps/e/Qgc6f/1fcHtj/i
  (single source of truth: `SITE.links.eventCommunityDay` in `src/lib/constants.ts`)
- Event content lives in `src/data/community-day.ts` — agenda/speakers/FAQs are edited there, TBA where unconfirmed.

## Routes

- `/` — Hero, community stats, About, What We Do, journey, featured events, Join CTA
- `/events` — Community Day spotlight + filterable upcoming events + past event recaps
- `/events/aws-student-community-day-suiit-2026` — Flagship event page + Meetup registration
- `/team` — Community leadership + core team

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Customizing

- College name, leads, and social/join URLs live in one file: `src/lib/constants.ts`
- Events and team members: `src/data/*.ts` (typed, ready to move to a DB later)
- Community Day content: `src/data/community-day.ts` (agenda, speakers, perks, FAQs)
- Implementation plans: `plan.md` (site), `plan-aws-student-community-day.md` (flagship event)

## Scripts

```bash
npm run dev     # local dev server
npm run lint    # eslint
npm run build   # production build (must pass before push)
npm start       # serve the production build
```
