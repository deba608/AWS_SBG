# AWS Student Builder Group — Implementation Plan

> Generated 2026-09-06. Synthesized from 3 parallel planning agents (architecture, design system, content/data).
> **Build note (2026-09-06):** kept the scaffold default **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme` tokens in `globals.css`) instead of downgrading to v3 — verified working with `npm run build`. Brand icons (GitHub/LinkedIn/Instagram) are custom inline SVGs in `src/components/icons.tsx` because current `lucide-react` no longer ships brand icons.

## 0. Goal & Non-Goals

**Goal:** Dark-first, premium developer-community hub — Learn → Build → Deploy → Connect. Multi-page Next.js App Router site: Home (+About/Stats/What-We-Do/Join CTA), Events, Learning, Projects, Team. Data-driven via local `data/*.ts`, placeholders only (no real college/team info).

**Non-goals (v1):** No backend/DB/auth, no CMS, no shadcn/next-themes, no stock images, no particle canvas, no excessive animation.

## 1. Tech Decisions

| Decision | Choice | Why |
|---|---|---|
| Framework | Next.js ~14/15 App Router + TypeScript `strict`, `src/` dir, `@/*` alias | Deep-linkable routes per nav item, server components by default |
| Styling | Tailwind CSS v3.4 (pinned, not v4) + `postcss` + `autoprefixer` | Stability for student contributors; avoids v4 breaking changes (`bg-opacity`, `@theme` HMR) |
| Animation | Framer Motion v11/12 (`fade-up`, stagger, `AnimatePresence`) | Subtle only; `MotionConfig reducedMotion="user"` |
| Icons | `lucide-react` only | No emojis; tree-shakeable |
| Utils | `clsx` + `tailwind-merge` (`cn()` helper) | Button/Badge variants |
| Images | CSS/SVG gradient + grid visuals; `next/image` only if static art added | Zero broken images, fast load |
| Routing | Multi-page: `/`, `/events`, `/learning`, `/projects`, `/team` (+ `#about` anchor on home) | Matches nav; shareable URLs; not a single long page |

Scaffold command (run in repo root):
```powershell
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
npm install framer-motion lucide-react clsx tailwind-merge
npm install -D tailwindcss@^3.4.17 postcss@^8 autoprefixer@^10
```

## 2. File Tree (target)

```
src/
  app/
    layout.tsx          # Navbar + Footer + metadata + skip link
    page.tsx            # Home: Hero + Stats + About + WhatWeDo + Featured + JoinCTA
    globals.css         # Tailwind directives + CSS vars
    not-found.tsx / loading.tsx
    events/page.tsx     # Tabs filter + upcoming grid + past events
    learning/page.tsx   # Learning paths grid
    projects/page.tsx   # Project showcase + submit CTA
    team/page.tsx       # Leadership + core grid
  components/
    layout/Navbar.tsx / Footer.tsx / Container.tsx / SectionHeading.tsx
    ui/Button.tsx / Badge.tsx / Tabs.tsx / Modal.tsx / StatCard.tsx / FeatureCard.tsx
    cards/EventCard.tsx / ProjectCard.tsx / LearningCard.tsx / TeamCard.tsx
    sections/Hero.tsx / Stats.tsx / JoinCTA.tsx / HeroVisual.tsx
  data/events.ts / projects.ts / team.ts / learning.ts
  lib/constants.ts      # NAV_LINKS, SITE placeholders, SOCIALS
  lib/utils.ts          # cn(), formatDate
```

Placeholders live in ONE file (`src/lib/constants.ts`): `COLLEGE_NAME="[COLLEGE NAME]"`, leads, `[EVENT LINK]`, `[GITHUB LINK]`, `[DISCORD LINK]`, `[LINKEDIN LINK]`, stats array. All components import from there — never hardcode.

## 3. Data Schemas (TypeScript)

```ts
// events.ts
type EventCategory = "Workshop"|"Tech Talk"|"Hackathon"|"Build Session";
type EventStatus = "open"|"filling-fast"|"closed"|"past";
interface EventItem { id, title, category, date, time, location, description, status, registerUrl? }
// learning.ts
interface LearningPath { id, title, description, difficulty, duration, topics: string[], progress: number }
// projects.ts
interface Project { id, title, description, tech: string[], aws: string[], githubUrl, demoUrl, image? }
// team.ts
interface TeamMember { id, name, role, bio, github?, linkedin?, initials }
```

Seed content: 5 upcoming events (across 4 filter tabs + All), 3 past events with recap, 5 learning paths (Cloud Fundamentals, AWS Developer, DevOps, Cloud Security, AI/ML), 4 projects (incl. CampusConnect: React·Node·AWS / Lambda·DynamoDB·S3), 4 leads + 6-8 core members (initials avatars, placeholder names).

## 4. Design System

Tokens (`tailwind.config.ts` extend): `ink.base #0B0E11`, `ink.subtle #0F1317`, `surface #141A20 / raised #1A2129`, `line #232C36`, `cream #F5F3EE / muted #A8B0BB / faint #6B7480`, `brand #FF9900 / hover #E8890B / soft rgba(255,153,0,.12)`.
Typography: Geist/Inter via `next/font`; Hero `5xl-7xl`, H2 `3xl-4xl`, body `base-lg muted`, eyebrow `xs uppercase tracking orange`. Container `max-w-7xl px-5 md:px-8`, section `py-16 md:py-24`. Cards: `rounded-2xl bg-surface border-line p-6 hover:border-white/15`. Buttons: primary orange pill, secondary outline, ghost; `focus-visible:ring-2 ring-brand`, min 44px. Hero visual: SVG node network + grid + single orange radial glow (aria-hidden), no stock images/particles. Animations: fade-up on scroll, staggered grids, navbar blur on scroll >8px, honor `prefers-reduced-motion`.

## 5. Phased Build (agents + verification)

- **Phase 1 — Scaffold:** create-next-app, pin Tailwind v3, install deps, set `tailwind.config.ts`, `globals.css`, `layout.tsx`, verify `npm run dev` + `build`.
- **Phase 2 — Tokens/Layout:** Container, SectionHeading, Button, Badge, Tabs, Modal, Navbar (sticky+blur+mobile drawer), Footer, `constants.ts` + `utils.ts`.
- **Phase 3 — Data + Cards:** `data/*.ts` + EventCard, ProjectCard, LearningCard, TeamCard, StatCard, FeatureCard; empty states intentional.
- **Phase 4 — Pages:** Home (Hero/HeroVisual/Stats/About/WhatWeDo/JoinCTA), Events (filter tabs + past), Learning, Projects (+submit CTA), Team.
- **Phase 5 — Polish & Verify:** responsive (360px→desktop, no x-scroll), hover/focus states, semantic HTML + alt + contrast, `tsc --noEmit`, `npm run lint`, `npm run build`, smoke-test all routes, no lorem ipsum / no broken images.

Each phase ends with `npm run build` green before proceeding. Commit per phase.

## 6. Acceptance Checklist

- [ ] `npm run build` passes, no TS/ESLint errors
- [ ] Nav works (desktop + mobile drawer), navbar blurs on scroll
- [ ] All routes render; filters work; buttons link to placeholders (no `#`/dead links)
- [ ] Stats animate on viewport enter; values from single config
- [ ] Responsive, no horizontal scroll; cards/grids collapse intentionally
- [ ] A11y: one h1, heading hierarchy, focus rings, reduced-motion, contrast
- [ ] No lorem ipsum, no invented college/team names, no broken images
