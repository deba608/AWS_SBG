# AWS Student Builder Group — SUIIT

Student-led developer community platform for the AWS Student Builder Group at Sambalpur University Institute of Information Technology (SUIIT).

> Learn → Build → Deploy → Connect

[![Live Site](https://img.shields.io/badge/Live_Site-awssbgsuiit.vercel.app-AD5CFF?style=for-the-badge&logo=vercel&logoColor=white)](https://awssbgsuiit.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🌐 Live Website

Production on Vercel: **[https://awssbgsuiit.vercel.app/](https://awssbgsuiit.vercel.app/)**

---

## 🎟️ Pass System (registration → gate entry)

**Flow**: form (full name, roll no, SUIIT mail, gender M/F, food Veg/Non-veg) → instant QR entry pass shown + PNG download + emailed → gate scan burns (single-use).

**Rules**: one email/roll = one pass (409 on re-register) · mail must end `@suiit.ac.in` · validation shared client+server in [`src/lib/validate-contact.ts`](src/lib/validate-contact.ts).

### Env Setup

`.env.local` (gitignored; mirror in Vercel **Project Settings → Environment Variables**, then redeploy):

```env
# Pass store (REQUIRED in production — Vercel disk is read-only)
UPSTASH_REDIS_REST_URL="https://...upstash.io"
UPSTASH_REDIS_REST_TOKEN="..."
# Free DB: console.upstash.com. Without these, registration 500s on Vercel (file fallback is local-dev only).

# Mail pass copy (optional — pass still issues without it)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=awssbg@suiit.ac.in
SMTP_PASS=<gmail-app-password>
SMTP_FROM=awssbg@suiit.ac.in

# Organizer sheet backup (optional, fire-and-forget)
NEXT_PUBLIC_SCD_SHEET_URL="https://script.google.com/macros/s/.../exec"
# Script source: scripts/scd-registration-apps-script.js (Sheet → Extensions > Apps Script → Deploy as Web app, access Anyone)

# Gate security (set in prod — dev defaults warn in logs)
PASS_SECRET=<random-32-chars>
ADMIN_PASS=<gate-password>
```

**Diagnose prod**: open `/api/health` — reports disk, redis, mail, expiry.

### Admin

- `/admin` — stats, demographics, live scans (15s refresh), search, CSV/Excel export, printable gate list
- `/admin/scan` — camera + manual verify/burn (login via `ADMIN_PASS`)
- Data: Upstash key `sbg:passes:v1` (users + passes). Sheet backup if configured.

---

## 👥 Team Directory & Member Submissions

**`/team`** — Community leadership and core team member profiles, merged from static roster [`src/data/team.ts`](src/data/team.ts) plus admin-approved member submissions.

**`/team/update`** — Member self-update form (photo crop + links). Creates a pending request; admin reviews on `/admin/team`.

**`/admin/team`** — Review pending requests, approve/reject, edit links, re-crop photos. Approved records show on `/team` instantly.

### Permanent team-record storage

Team submissions live in Redis (Upstash key `sbg:team-submissions:v1`) with a **permanent local file backup** at `.data-team/team-submissions.json`. Every write hits both Redis and the local file; reads fall back to the local file if Redis is empty/flushed, so records survive a Redis reset. `.data-team/` is gitignored and never committed.

---

## 🏆 DecodeX Hackathon (Day 1 — 6 Oct 2026)

**`/hackathon`** — Team registration portal. Exactly 4 members (leader + 3 teammates), one student one team. Tracks: Hardware / Software / Both. ₹15,000 prize pool (1st ₹7,000 · 2nd ₹5,000 · 3rd ₹3,000).

- **Admin**: `/admin/hackathon` — list, edit, delete teams.
- **Payouts**: `/payouts` — winners submit UPI/bank details for prize transfer. Admin: `/admin/payouts`.
- Data: Upstash key `sbg:hackathon:v1`; local backup `.data-hackathon/hackathon.json`.

---

## 🍱 Food Tokens & Daywise

- `/admin/food-tokens` — Upload registration Excel (or pull live list), preview and print food tokens (10–15 per A4), works offline (Ctrl+P).
- `/api/admin/daywise` — Daywise registration breakdown for lunch headcount.

---

## 🗺️ Routes

| Route | Description |
|---|---|
| `/` | Landing: hero, mission, what we do, quick join actions |
| `/passes` | Self-serve QR entry pass form |
| `/team` | Community leadership & core team profiles |
| `/team/update` | Member update request (photo crop + links) |
| `/admin` | Dashboard: stats, search, CSV export (needs `ADMIN_PASS`) |
| `/admin/scan` | Gate scanner: camera + manual verify/burn |
| `/admin/team` | Team request review + live profile management |
| `/admin/hackathon` | Hackathon team list / edit / delete |
| `/admin/payouts` | Winner payout records |
| `/admin/food-tokens` | Food token upload + print |
| `/payouts` | Winners: submit UPI/bank for prize transfer |
| `/api/health` | Prod diagnostics (disk, redis, mail, expiry) |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://www.lucide.dev/)
- **Storage**: Upstash Redis + local JSON file backup
- **Deployment**: [Vercel](https://vercel.com/)

---

## 💻 Local Development

### Prerequisites

- Node.js (v18.18+ or v20+)
- npm / yarn / pnpm

### Getting Started

```bash
# 1. Clone
git clone https://github.com/deba608/AWS_SBG.git
cd AWS_SBG

# 2. Install
npm install

# 3. Copy env and fill in secrets
cp .env.local.example .env.local   # if available, else create .env.local manually

# 4. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

```bash
npm run dev     # Start local development server
npm run lint    # Run ESLint validation
npm run build   # Create optimized production build
npm start       # Start production server locally
```

---

## ⚙️ Configuration & Customization

- **Site metadata & links**: [`src/lib/constants.ts`](src/lib/constants.ts) (college name, leads, social handles, links)
- **Team members (static)**: [`src/data/team.ts`](src/data/team.ts)
- **Contact validation**: [`src/lib/validate-contact.ts`](src/lib/validate-contact.ts)
- **Theme / brand color**: Electric Violet / Purple (`#AD5CFF`) from [`public/logo.png`](public/logo.png)

---

## 📬 Community & Contact

- **Website**: [awssbgsuiit.vercel.app](https://awssbgsuiit.vercel.app/)
- **WhatsApp Community**: [Join Community](https://chat.whatsapp.com/E8TfpRLRko5DBvhgtAYJpm)
- **LinkedIn**: [AWS SBG SUIIT](https://www.linkedin.com/company/aws-sbg-suiit)
- **Instagram**: [@awssbg_suiit](https://www.instagram.com/awssbg_suiit)
- **Email**: [awssbg@suiit.ac.in](mailto:awssbg@suiit.ac.in)
