"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CalendarDays, Check, Users } from "lucide-react";
import Link from "next/link";

type Line = { time: string; cmd: string; out: string };

const lines: Line[] = [
  { time: "10:02", cmd: "sam build", out: "3 functions · 18s" },
  { time: "10:03", cmd: "sam deploy --region ap-south-1", out: "campusconnect-prod live" },
  { time: "10:04", cmd: "aws amplify publish --yes", out: "campusconnect.sbg · 42s" },
];

export default function HeroVisual() {
  const reduce = useReducedMotion();

  const terminal = (
    <div className="overflow-hidden rounded-2xl border border-line bg-coal/95 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" aria-hidden />
        <span className="ml-2 rounded-md bg-raised px-2 py-0.5 font-mono text-[11px] text-cream">
          deploy.log
        </span>
        <span className="truncate font-mono text-[11px] text-faint">— last build session</span>
        <span className="ml-auto hidden font-mono text-[11px] text-faint sm:inline">zsh</span>
      </div>

      <div className="space-y-3 p-5 font-mono text-[13px] leading-relaxed">
        {lines.map((l, i) => (
          <div key={l.cmd}>
            <p className="break-all text-cream">
              <span className="mr-2 select-none text-faint" aria-hidden>
                {l.time} $
              </span>
              {l.cmd}
            </p>
            <p className="mt-1 flex items-start gap-2 text-fog">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
              <span className="break-all">{l.out}</span>
              {i === lines.length - 1 && !reduce ? (
                <span className="animate-blink ml-1 inline-block h-4 w-2 shrink-0 translate-y-0.5 bg-cream" aria-hidden />
              ) : null}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[11px] text-faint">
        <span>ap-south-1</span>
        <span className="inline-flex items-center gap-1.5 text-emerald-300">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
          live
        </span>
      </div>
    </div>
  );

  return (
    <div className="relative mx-auto w-full max-w-[480px] pb-8 pt-10">
      <div aria-hidden className="glow-brand absolute -inset-8 -z-10" />
      <p className="mb-3 pr-44 font-mono text-[11px] uppercase tracking-[0.18em] text-faint sm:pr-48">
        {"// last Saturday at SBG"}
      </p>

      {reduce ? (
        terminal
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } } }}
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
          >
            {terminal}
          </motion.div>
        </motion.div>
      )}

      {/* Floating: SCD card — breaks the boxy AI symmetry */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10, rotate: 2 }}
        animate={reduce ? undefined : { opacity: 1, y: 0, rotate: 2 }}
        transition={{ delay: 0.5, duration: 0.35 }}
        className="absolute right-2 top-0 sm:-right-3"
      >
        <Link
          href="/events/awsscd26"
          className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-colors hover:border-brand/50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/15 text-brand">
            <CalendarDays className="h-4.5 w-4.5" aria-hidden />
          </span>
          <span>
            <span className="block text-[13px] font-semibold text-cream">SCD ’26 · Oct 6–8</span>
            <span className="block text-xs text-faint">Auditorium · get pass</span>
          </span>
          <ArrowUpRight className="h-4 w-4 text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
        </Link>
      </motion.div>

      {/* Floating: crew card */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10, rotate: -2 }}
        animate={reduce ? undefined : { opacity: 1, y: 0, rotate: -2 }}
        transition={{ delay: 0.7, duration: 0.35 }}
        className="absolute -bottom-0 left-2 sm:-left-3"
      >
        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
            <Users className="h-4.5 w-4.5" aria-hidden />
          </span>
          <span>
            <span className="block text-[13px] font-semibold text-cream">DecodeX team shipped</span>
            <span className="block font-mono text-xs text-faint">42s ago · Burla</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
