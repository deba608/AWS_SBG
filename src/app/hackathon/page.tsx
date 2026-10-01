import type { Metadata } from "next";
import { Award, CalendarDays, Clock, MapPin, Medal, Trophy, Users } from "lucide-react";
import HackathonClient from "./hackathon-client";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "DecodeX Hackathon — Team Registration · ₹15,000 Prize Pool",
  description:
    "Register your team (2–4 members) for the DecodeX Hackathon on Day 1, 6th October 2026 at SUIIT. ₹15,000 prize pool: 1st ₹7,000, 2nd ₹5,000, 3rd ₹3,000.",
  alternates: { canonical: "/hackathon" },
  openGraph: {
    url: "/hackathon",
    title: `DecodeX Hackathon Team Registration · ${SITE.shortName}`,
    description:
      "Day 1, 6th October — register your team of 2–4. ₹15,000 prize pool. Separate from the Community Day pass.",
  },
};

const rules = [
  { icon: Users, text: "Teams of 2–4 · one student, one team · SUIIT mail required" },
  { icon: CalendarDays, text: "Day 1 — Tuesday, 6th October 2026, 9:00 AM onwards" },
  { icon: MapPin, text: "APJ Abdul Kalam Auditorium, SUIIT, Burla" },
  { icon: Trophy, text: "₹15,000 prize pool · winners felicitated on Day 3" },
];

const prizes = [
  { icon: Trophy, label: "1st Prize", amount: "₹7,000", tone: "border-amber-400/50 bg-amber-400/10 text-amber-300" },
  { icon: Medal, label: "2nd Prize", amount: "₹5,000", tone: "border-slate-300/40 bg-slate-300/10 text-slate-200" },
  { icon: Award, label: "3rd Prize", amount: "₹3,000", tone: "border-orange-400/50 bg-orange-400/10 text-orange-300" },
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
        Reporting 9:00 AM, 6th October · bring laptops + your team
      </p>
      <section aria-label="Prize pool" className="mt-6 overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 via-surface to-surface p-5 sm:p-6">
        <p className="text-xs font-mono tracking-widest text-amber-300/80 uppercase">{"// prize pool"}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-cream sm:text-3xl">₹15,000</p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {prizes.map((p) => (
            <div key={p.label} className={`rounded-2xl border p-3 text-center sm:p-4 ${p.tone}`}>
              <p.icon className="mx-auto h-5 w-5" aria-hidden />
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider sm:text-xs">{p.label}</p>
              <p className="mt-0.5 text-lg font-bold sm:text-2xl">{p.amount}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-8">
        <HackathonClient />
      </div>
    </div>
  );
}
