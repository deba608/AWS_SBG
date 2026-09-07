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
- **Date & Time**: Saturday, October 3, 2026 · 9:00 AM – 4:00 PM IST
- **Venue**: APJ Abdul Kalam Auditorium, SUIIT, Burla
- **Audience**: 300+ expected student builders, developers, and cloud enthusiasts
- **Perks**: Lunch + official swag + certificates for registered participants
- **Event Page**: [`/events/aws-student-community-day-suiit-2026`](https://awssbgsuiit.vercel.app/events/aws-student-community-day-suiit-2026)
- **Meetup Registration**: [Join on Meetup](https://meetu.ps/e/Qgc6f/1fcHtj/i) (Single source of truth: `SITE.links.eventCommunityDay` in `src/lib/constants.ts`)

> Event details (agenda, speaker lineup, FAQs) are managed in [`src/data/community-day.ts`](src/data/community-day.ts).

---

## 📝 Pre-Registration Backend (Community Day)

Clicking **Register** opens an on-site modal (collecting Name, Email, Mobile Number, and Consent) that asynchronous POSTs to a Google Sheet via a Google Apps Script web app, then seamlessly redirects the attendee to complete RSVP on Meetup.

### Organizer Setup (One-Time)

1. Create a `.env.local` file from the example:
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env.local

   # macOS / Linux
   cp .env.example .env.local
   ```
2. **Deploy Apps Script**:
   - Open a Google Sheet → **Extensions > Apps Script**
   - Copy and paste the code from [`scripts/scd-registration-apps-script.js`](scripts/scd-registration-apps-script.js)
   - Click **Deploy > New deployment** → Select type: **Web app**
   - Configure:
     - **Execute as**: `Me`
     - **Who has access**: `Anyone`
   - Copy the deployed Web App URL (`.../exec`).
3. Set the environment variable in `.env.local`:
   ```env
   NEXT_PUBLIC_SCD_SHEET_URL="https://script.google.com/macros/s/.../exec"
   ```
4. For production deployments on Vercel, add `NEXT_PUBLIC_SCD_SHEET_URL` under **Project Settings → Environment Variables**.

> **Note**: If the sheet URL is omitted, the registration form still functions gracefully (prefilling details and forwarding to Meetup) without failing the attendee experience. Contact validation logic is maintained in [`src/lib/validate-contact.ts`](src/lib/validate-contact.ts).

---

## 🗺️ Routes

| Route | Description |
|---|---|
| `/` | Landing page featuring hero, mission statement, what we do, and quick join actions |
| `/events` | Community Day spotlight, upcoming events, and past workshop recaps |
| `/events/aws-student-community-day-suiit-2026` | Dedicated flagship event landing page with live countdown, speaker lineup, schedule, and registration modal |
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
- **WhatsApp Community**: [Join Channel](https://whatsapp.com/channel/0029VbBQOWtJUM2SSgFtil0O)
- **LinkedIn**: [AWS SBG SUIIT](https://www.linkedin.com/company/aws-sbg-suiit)
- **Instagram**: [@awssbg_suiit](https://www.instagram.com/awssbg_suiit)
- **Email**: [awssbg@suiit.ac.in](mailto:awssbg@suiit.ac.in)
