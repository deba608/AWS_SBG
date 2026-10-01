import type { Metadata } from "next";
import { CalendarDays, Clock, MapPin, Trophy, Users } from "lucide-react";
import Container from "@/components/Container";
import HackathonClient from "./hackathon-client";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "DecodeX Hackathon — Team Registration",
  description:
    "Register your team (2–4 members) for the DecodeX Hackathon on Day 1, 6th October 2026 at SUIIT. Problem statements, mentor sprints and jury evaluation on AWS.",
  alternates: { canonical: "/hackathon" },
  openGraph: {
    url: "/hackathon",
    title: `DecodeX Hackathon Team Registration · ${SITE.shortName}`,
    description:
      "Day 1, 6th October — register your team of 2–4. Separate from the Community Day pass.",
  },
};

const rules = [
  { icon: Users, text: "Teams of 2–4 · one student, one team · SUIIT mail required" },
  { icon: CalendarDays, text: "Day 1 — Tuesday, 6th October 2026, 9:00 AM onwards" },
  { icon: MapPin, text: "APJ Abdul Kalam Auditorium, SUIIT, Burla" },
  { icon: Trophy, text: "Winners felicitated on Day 3 prize distribution" },
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
      <div className="mt-8">
        <HackathonClient />
      </div>
    </div>
  );
}
