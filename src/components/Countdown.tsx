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
    { value: hours, label: "Hours" },
    { value: mins, label: "Minutes" },
    { value: secs, label: "Seconds" },
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
      <p className="text-sm text-fog">
        {COMMUNITY_DAY_META.date}, {COMMUNITY_DAY_META.time}
      </p>
    );
  }

  const parts = getParts(target, now);

  return (
    <div
      role="timer"
      aria-label={`Countdown to ${COMMUNITY_DAY_META.title}`}
      className="grid max-w-md grid-cols-4 divide-x divide-line border-y border-line"
    >
      {parts.map((p) => (
        <div key={p.label} className="min-w-0 px-2 py-3 text-center">
          <span className="block text-2xl font-bold tabular-nums text-cream">
            {String(p.value).padStart(2, "0")}
          </span>
          <span className="mt-1 block truncate text-xs text-fog">
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
}
