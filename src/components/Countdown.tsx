"use client";

import { useEffect, useState } from "react";
import { COMMUNITY_DAY_META } from "@/data/community-day";

function getParts(target: number, now: number) {
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);
  return [
    { value: days, label: "Days" },
    { value: hours, label: "Hrs" },
    { value: mins, label: "Min" },
    { value: secs, label: "Sec" },
  ];
}

export default function Countdown() {
  const target = new Date(COMMUNITY_DAY_META.startIso).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setNow(Date.now()), 0);
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(timer);
      window.clearInterval(id);
    };
  }, []);

  // SSR / no-JS fallback: static date, no ticking numbers
  if (now === null) {
    return (
      <p className="font-mono text-xs text-faint">
        {COMMUNITY_DAY_META.date} · {COMMUNITY_DAY_META.time}
      </p>
    );
  }

  const parts = getParts(target, now);

  return (
    <div
      role="timer"
      aria-label={`Countdown to ${COMMUNITY_DAY_META.title}`}
      className="flex items-center gap-2"
    >
      {parts.map((p) => (
        <div
          key={p.label}
          className="flex min-w-[64px] flex-col items-center rounded-xl border border-line bg-ink/70 px-3 py-2"
        >
          <span className="font-mono text-xl font-bold tabular-nums text-cream">
            {String(p.value).padStart(2, "0")}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-faint">
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
}
