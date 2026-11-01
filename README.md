# AWS Student Builder Group — SUIIT

Student-led developer community platform for the **AWS Student Builder Group** at Sambalpur University Institute of Information Technology (SUIIT).

[![Live Site](https://img.shields.io/badge/Live_Site-awssbgsuiit.in-AD5CFF?style=for-the-badge&logo=vercel&logoColor=white)](https://awssbgsuiit.in/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

---

## 🌐 Live Website

**Production:** https://awssbgsuiit.in/

---

## 🎟️ Pass System (Registration → Gate Entry)

Self-serve QR entry pass for campus events.

**Flow:** Register with full name, roll number, SUIIT mail, gender, and food preference → instant QR pass generated → download PNG + receive email copy → gate scan burns the pass (single-use).

**Rules:**
- One email / roll number = one pass (409 on re-register)
- Mail must end with `@suiit.ac.in`
- Validation shared client + server in `src/lib/validate-contact.ts`

### Admin Tools
| Route | Purpose |
|---|---|
| `/admin` | Stats, demographics, live scans (15s refresh), search, CSV/Excel export, printable gate list |
| `/admin/scan` | Camera + manual verify/burn gate scanner (`ADMIN_PASS` login) |

### Environment Setup

Create `.env.local` (gitignored) and mirror the values in **Vercel → Project Settings → Environment Variables**, then redeploy.

```env
# Pass store — REQUIRED in production (Vercel disk is read-only)
UPSTASH_REDIS_REST_URL="https://...upstash.io"
UPSTASH_REST_REST_TOKEN="..."

# Mail pass copy (optional — pass still issues without it)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=awssbg@suiit.ac.in
SMTP_PASS=<gmail-app-password>
SMTP_FROM=awssbg@suiit.ac.in

# Organizer sheet backup (optional)
NEXT_PUBLIC_SCD_SHEET_URL="https://script.google.com/macros/s/.../exec"

# Gate security (set in prod)
PASS_SECRET=<random-32-chars>
ADMIN_PASS=<gate-password>
```

**Diagnose production:** open `/api/health` — reports disk, Redis, mail, and expiry status.

---

## 👥 Team Directory & Member Submissions

**`/team`** — Community leadership and core team member profiles. Merges the static roster (`src/data/team.ts`) with admin-approved member submissions.

**`/team/update`** — Member self-update form (photo crop + social links). Creates a pending request for admin review.

**`/admin/team`** — Review, approve/reject requests, edit links, re-crop photos. Approved records appear on `/team` instantly.

### Permanent Record Storage

Team submissions are stored in **Upstash Redis** (key `sbg:team-submissions:v1`) with a permanent local file backup at `.data-team/team-submissions.json`. Every write hits both Redis and the local file; reads fall back to the local backup if Redis is empty or flushed, so records survive a Redis reset. `.data-team/` is gitignored and never committed.

---

## 🍱 Food Tokens & Daywise

**`/admin/food-tokens`** — Upload a registration Excel file (or pull the live list), preview food tokens, and print 10–15 per A4 sheet. Works offline after load (Ctrl+P).

**`/api/admin/daywise`** — Daywise registration breakdown for lunch headcount planning.

---

## 🗺️ Routes

| Route | Description |
|---|---|
| `/` | Landing: hero, mission, what we do, quick join actions |
| `/passes` | Self-serve QR entry pass form |
| `/team` | Community leadership & core team profiles |
| `/team/update` | Member update request (photo crop + links) |
| `/admin` | Dashboard: stats, search, CSV export (`ADMIN_PASS`) |
| `/admin/scan` | Gate scanner: camera + manual verify/burn |
| `/admin/team` | Team request review + live profile management |
| `/admin/food-tokens` | Food token upload + print |
| `/api/health` | Production diagnostics (disk, Redis, mail, expiry) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16 (App Router)](https://nextjs.org/) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [Lucide React](https://www.lucide.dev/) |
| Storage | Upstash Redis + local JSON file backup |
| Deployment | [Vercel](https://vercel.com/) |

---

## 💻 Local Development

### Prerequisites
- Node.js v18.18+ or v20+
- npm / yarn / pnpm

### Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/deba608/AWS_SBG.git
cd AWS_SBG

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local   # create .env.local with your secrets

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

```bash
npm run dev    # Start local development server
npm run lint   # Run ESLint validation
npm run build  # Create optimized production build
npm start      # Start production server locally
```

---

## ⚙️ Configuration & Customization

| File | Purpose |
|---|---|
| `src/lib/constants.ts` | Site metadata, college name, leads, social handles, links |
| `src/data/team.ts` | Static team member roster |
| `src/lib/validate-contact.ts` | Contact validation (email, roll number, mobile) |
| `public/logo.png` | Brand asset — Electric Violet / Purple (`#AD5CFF`) |

---

## 📬 Community & Contact

- **Website:** [awssbgsuiit.in](https://awssbgsuiit.in/)
- **WhatsApp Community:** [Join Community](https://chat.whatsapp.com/E8TfpRLRko5DBvhgtAYJpm)
- **LinkedIn:** [AWS SBG SUIIT](https://www.linkedin.com/company/aws-sbg-suiit)
- **Instagram:** [@awssbg_suiit](https://www.instagram.com/awssbg_suiit)
- **Email:** [awssbg@suiit.ac.in](mailto:awssbg@suiit.ac.in)

---
