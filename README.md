# AWS Student Builder Group — [COLLEGE NAME]

A dark-first developer community website: Learn → Build → Deploy → Connect.
Built with Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, and Lucide icons.

## Routes

- `/` — Hero, community stats, About, What We Do, featured events/projects, Join CTA
- `/events` — Filterable upcoming events + past event recaps
- `/learning` — Guided cloud learning paths
- `/projects` — Student project showcase + submission CTA
- `/team` — Community leadership + core team

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Customizing

- College name, leads, and social/join URLs live in one file: `src/lib/constants.ts`
- Events, projects, team, and learning paths: `src/data/*.ts` (typed, ready to move to a DB later)
- Implementation plan: `plan.md`

## Scripts

```bash
npm run dev     # local dev server
npm run lint    # eslint
npm run build   # production build (must pass before push)
npm start       # serve the production build
```
