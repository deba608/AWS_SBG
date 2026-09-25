# AWS Student Builder Group — SUIIT

> A dark-first developer community platform: **Learn → Build → Deploy → Connect**  
> Built for the AWS Student Builder Group at Sambalpur University Institute of Information Technology (SUIIT).

[![Live Site](https://img.shields.io/badge/Live_Site-awssbgsuiit.vercel.app-AD5CFF?style=for-the-badge&logo=vercel&logoColor=white)](https://awssbgsuiit.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🌐 Live Website

The production deployment is live on Vercel:  
👉 **[https://awssbgsuiit.vercel.app/](https://awssbgsuiit.vercel.app/)**

---

## 🚀 Flagship Event

### **AWS Student Community Day SUIIT 2026**
- **Date & Time**: 6–8 October 2026 · 9:00 AM – 5:30 PM IST (3 days)
- **Venue**: APJ Abdul Kalam Auditorium, SUIIT, Burla
- **Audience**: 300+ expected student builders, developers, and cloud enthusiasts
- **Program**: Day 1 DecodeX Hackathon · Day 2 Tech Parliament + Make-A-Bot Competition · Day 3 Speaker/Podcast + prizes
- **Perks**: Lunch + certificates for pass holders (no swag)
- **Event Page**: [`/events/aws-student-community-day-suiit-2026`](https://awssbgsuiit.vercel.app/events/aws-student-community-day-suiit-2026)
- **Registration**: on-site QR entry pass — no Meetup. One `@suiit.ac.in` mail + roll number = one pass.

> Event details (schedule, speaker lineup, FAQs) are managed in [`src/data/community-day.ts`](src/data/community-day.ts). Event cards in [`src/data/events.ts`](src/data/events.ts).

---

## 🎟️ Pass System (registration → gate)

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

## 🗺️ Routes

| Route | Description |
|---|---|
| `/` | Landing page featuring hero, mission statement, what we do, and quick join actions |
| `/events` | Community Day spotlight, upcoming events, and past workshop recaps |
| `/events/aws-student-community-day-suiit-2026` | Dedicated flagship event landing page with live countdown, speaker lineup, schedule, and registration modal |
| `/passes` | Self-serve QR entry pass form |
| `/admin` | Organizer dashboard (stats, search, export) — `ADMIN_PASS` |
| `/admin/scan` | Gate scanner (camera + manual verify/burn) |
| `/api/health` | Prod diagnostics (disk, redis, mail, expiry) |
| `/team` | Community leadership and core team member profiles |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 💻 Local Development

### Prerequisites

- Node.js (v18.18+ or v20+ recommended)
- npm / yarn / pnpm

### Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/deba608/AWS_SBG.git
cd AWS_SBG

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the result.

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
- **Community Day content**: [`src/data/community-day.ts`](src/data/community-day.ts) (speakers, agenda, perks, FAQs)
- **Team members**: [`src/data/team.ts`](src/data/team.ts)
- **Events**: [`src/data/events.ts`](src/data/events.ts)
- **Theme & Brand Colors**: Electric Violet / Purple (`#AD5CFF`) sampled from [`public/logo.png`](public/logo.png)

---

## 📬 Community & Contact

- **Website**: [awssbgsuiit.vercel.app](https://awssbgsuiit.vercel.app/)
- **WhatsApp Community**: [Join Community](https://chat.whatsapp.com/E8TfpRLRko5DBvhgtAYJpm)
- **LinkedIn**: [AWS SBG SUIIT](https://www.linkedin.com/company/aws-sbg-suiit)
- **Instagram**: [@awssbg_suiit](https://www.instagram.com/awssbg_suiit)
- **Email**: [awssbg@suiit.ac.in](mailto:awssbg@suiit.ac.in)
