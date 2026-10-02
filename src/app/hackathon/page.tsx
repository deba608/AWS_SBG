import type { Metadata } from "next";
import { Award, BookOpen, CalendarDays, Clock, Download, Gavel, ListChecks, MapPin, Medal, Phone, TriangleAlert, Trophy, Users } from "lucide-react";
import HackathonClient from "./hackathon-client";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "DecodeX Hackathon — Team Registration · ₹15,000 Prize Pool",
  description:
    "Register your team (exactly 4 members) for the DecodeX Hackathon on Day 1, 6th October 2026 at SUIIT. ₹15,000 prize pool: 1st ₹7,000, 2nd ₹5,000, 3rd ₹3,000.",
  alternates: { canonical: "/hackathon" },
  openGraph: {
    url: "/hackathon",
    title: `DecodeX Hackathon Team Registration · ${SITE.shortName}`,
    description:
      "Day 1, 6th October — register your team of exactly 4. ₹15,000 prize pool. Separate from the Community Day pass.",
  },
};

const rules = [
  { icon: Users, text: "Teams of exactly 4 · leader + 3 teammates" },
  { icon: CalendarDays, text: "Day 1 · Tue, 6 Oct 2026 · 8:45 AM – 5 PM" },
  { icon: MapPin, text: "APJ Abdul Kalam Auditorium, SUIIT, Burla" },
  { icon: Trophy, text: "₹15,000 prize pool · Day-3 felicitation" },
];

const prizes = [
  { icon: Trophy, label: "1st", amount: "₹7,000", tone: "border-amber-400/50 bg-amber-400/10 text-amber-300" },
  { icon: Medal, label: "2nd", amount: "₹5,000", tone: "border-slate-300/30 bg-slate-300/10 text-slate-200" },
  { icon: Award, label: "3rd", amount: "₹3,000", tone: "border-orange-400/40 bg-orange-400/10 text-orange-300" },
];

const timeline = [
  { time: "08:45 AM", tag: "Check-in", text: "Check-in & opening address" },
  { time: "09:00 AM", tag: "Briefing", text: "Case investigation & problem discovery begins" },
  { time: "10:30 AM", tag: "Deadline", text: "Problem statement submission — submission speed counts" },
  { time: "10:30 AM", tag: "Build", text: "Hackathon Phase I — design, develop, implement" },
  { time: "01:00 PM", tag: "Pause", text: "Lunch break" },
  { time: "02:00 PM", tag: "Build", text: "Hackathon Phase II — test, refine, prepare pitch" },
  { time: "03:00 PM", tag: "Evaluation", text: "Pitch, live demo & judge interaction" },
  { time: "05:00 PM", tag: "Final", text: "Hackathon ends · final evaluation & closure" },
];

const judging = [
  { label: "Workingness / Implementation", pct: 30, note: "Functionality, completeness, demo quality, technical execution" },
  { label: "Problem Decoding Efficiency", pct: 20, note: "How quickly & accurately you find a relevant problem" },
  { label: "Feasibility", pct: 20, note: "Practicality, scalability, real-world potential" },
  { label: "Pitching", pct: 15, note: "" },
  { label: "Question & Answer", pct: 15, note: "Defend your solution under questioning" },
];

const rulesA = [
  "Max 4 members per team — compete only in the track you registered for",
  "Only your submitted problem statement may be the basis of your final solution",
  "Prototype must be functional enough to demo",
  "Public libraries, frameworks, APIs, datasets & tools allowed unless restricted",
];
const rulesB = [
  "Disclose any external service, API, model or dataset that materially contributes",
  "No copying another team's solution, implementation or presentation",
  "Plagiarism, impersonation or interference may lead to disqualification",
  "Be ready to explain architecture, data flow & technical decisions",
  "Organizers' decisions on rules & eligibility are final",
];

const checklist = [
  "Report to the venue early & complete check-in",
  "Bring your own laptops & dev equipment",
  "Chargers, adapters & cables",
  "Hardware teams: boards, sensors & components",
  "Keep regular backups of your work",
  "Follow venue rules & respect everyone",
  "Internet use for research & dev is permitted",
  "Report repo or process issues immediately",
];

export default function HackathonPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-24 pb-12 sm:px-6 md:pt-32">
      <p className="text-xs font-mono tracking-widest text-brand uppercase">
        {"// decodex hackathon · day 1"}
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
        DecodeX Hackathon — team registration
      </h1>
      <p className="measure mt-3 text-sm leading-relaxed text-fog sm:text-base">
        Problem statement submission, Phase I &amp; II build sprints, mentor
        guidance and jury evaluation on AWS. Register your team below —
        this is separate from the Community Day pass.
      </p>
      <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rules.map((r) => (
          <li key={r.text} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs text-fog sm:text-sm">
            <r.icon className="h-4 w-4 shrink-0 text-brand" aria-hidden />
            {r.text}
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-center gap-2 text-xs text-faint">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Check-in 8:45 AM, 6th October · bring laptops + your team
      </p>
      <section aria-label="Prize pool" className="mt-6 rounded-2xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="min-w-[110px]">
            <p className="text-[11px] font-mono uppercase tracking-widest text-faint">{"// prize pool"}</p>
            <p className="mt-0.5 text-xl font-bold tracking-tight text-cream">₹15,000</p>
          </div>
          <div className="hidden h-10 w-px shrink-0 bg-line sm:block" aria-hidden />
          {prizes.map((p) => (
            <div key={p.label} className="flex min-w-[96px] flex-1 items-center gap-2.5">
              <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${p.tone}`}>
                <p.icon className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-faint">{p.label} prize</span>
                <span className="block text-base font-bold leading-tight text-cream">{p.amount}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-8">
        <HackathonClient />
      </div>

      {/* OFFICIAL RULEBOOK */}
      <section aria-labelledby="rulebook-heading" className="mt-10 space-y-4">
        <div>
          <p className="text-xs font-mono tracking-widest text-brand uppercase">{"// official rulebook · operation: inside job"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 id="rulebook-heading" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-cream sm:text-3xl">
              <BookOpen className="h-6 w-6 shrink-0 text-brand" aria-hidden />
              DecodeX rulebook
            </h2>
            <span className="flex-1" aria-hidden />
            <a
              href="/decodex-rulebook.pdf"
              download="DecodeX-Rulebook.pdf"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-black hover:bg-brandhover"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download PDF
            </a>
          </div>
          <p className="measure mt-2 text-sm leading-relaxed text-fog">
            DecodeX is not a conventional hackathon — no predefined problem statements. Each team gets a{" "}
            <span className="font-semibold text-cream">GitHub case repository</span>, investigates it to uncover hidden
            problem statements, picks one, builds a working solution, then defends it before the judges. You are judged
            on problem discovery, analytical thinking, decision-making, feasibility, pitching and Q&amp;A — not just code.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-brand">Software track</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-fog">
              <li>Repository handed to registered teams on the spot, at the start</li>
              <li>Decode it, list the problem statements you discover</li>
              <li>Select ONE and submit it by 10:30 AM</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-brand">Hardware track</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-fog">
              <li>Repository shared one day before the hackathon</li>
              <li>You may investigate early — but submit only within the discovery window on the day</li>
              <li>Build your solution around the ONE problem you submit</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Operation timeline · 6th October</p>
          <ol className="mt-3 space-y-2">
            {timeline.map((t) => (
              <li key={`${t.time}-${t.tag}`} className="flex items-baseline gap-3 border-b border-dashed border-line pb-2 text-sm last:border-0 last:pb-0">
                <span className="w-20 shrink-0 font-mono text-xs font-bold text-brand">{t.time}</span>
                <span className="w-20 shrink-0 text-[11px] font-bold uppercase tracking-wider text-faint">{t.tag}</span>
                <span className="min-w-0 text-fog">{t.text}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand">
            <Gavel className="h-4 w-4" aria-hidden /> Rules of the operation
          </p>
          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {[...rulesA, ...rulesB].map((r) => (
              <p key={r} className="flex gap-2 text-sm leading-relaxed text-fog">
                <span className="shrink-0 font-mono font-bold text-brand" aria-hidden>&gt;</span>
                {r}
              </p>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            Registration details must be accurate and complete — only registered &amp; verified teams can compete.
            Changes to team composition after registration need organizer approval.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">How you will be judged</p>
          <div className="mt-3 space-y-3">
            {judging.map((j) => (
              <div key={j.label}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-fog">{j.label}</span>
                  <span className="font-mono font-bold text-brand">{j.pct}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/40" role="img" aria-label={`${j.label}: ${j.pct} percent`}>
                  <div className="h-full rounded-full bg-brand" style={{ width: `${j.pct}%` }} />
                </div>
                {j.note ? <p className="mt-1 text-xs text-faint">{j.note}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand">
            <ListChecks className="h-4 w-4" aria-hidden /> Pre-mission checklist
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {checklist.map((c) => (
              <li key={c} className="flex gap-2 text-sm leading-relaxed text-fog">
                <span className="shrink-0 font-mono font-bold text-green-400" aria-hidden>[✓]</span>
                {c}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-dashed border-red-400/50 bg-red-500/5 p-4 text-xs leading-relaxed text-fog sm:text-sm">
          <p className="flex items-center gap-2 font-bold uppercase tracking-widest text-red-300">
            <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden /> Disclaimer
          </p>
          <p className="mt-2">
            Case repositories may contain fictional organizations, systems, datasets or incidents. Never use case
            material to access, attack or interfere with any real-world system — activity outside the authorized scope
            may lead to disqualification. You are responsible for your own code, hardware, accounts and credentials.
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 text-sm text-fog sm:flex-row sm:items-center">
          <Phone className="h-4 w-4 shrink-0 text-brand" aria-hidden />
          <p>
            <span className="font-semibold text-cream">Contact:</span> Manas Ranjan Dikshit ·{" "}
            <a href="tel:+919337978805" className="font-medium text-brand underline decoration-brand/50 underline-offset-4 hover:decoration-cream">+91 93379 78805</a>
            {" · "}
            <a href="mailto:awssbg@suiit.ac.in" className="font-medium text-brand underline decoration-brand/50 underline-offset-4 hover:decoration-cream">awssbg@suiit.ac.in</a>
            {" · "}
            <a href="mailto:ecell@suiit.ac.in" className="font-medium text-brand underline decoration-brand/50 underline-offset-4 hover:decoration-cream">ecell@suiit.ac.in</a>
          </p>
        </div>
      </section>
    </div>
  );
}
