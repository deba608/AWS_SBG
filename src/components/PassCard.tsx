"use client";

import { useState } from "react";
import { CalendarDays, Download, Loader2, MapPin } from "lucide-react";
import { downloadDataUrl, drawPassImage } from "@/lib/pass-image";
import { COMMUNITY_DAY_META } from "@/data/community-day";
import { cn } from "@/lib/utils";

export type PassCardType = "ENTRY" | "FOOD";

const TYPE_META = {
  ENTRY: {
    label: "Event Entry Pass",
    hint: "One-time entry pass for Community Day · 8 Oct. Show at gate — invalid after first scan.",
    chip: "border-brand/40 bg-brand/10 text-brand",
  },
  FOOD: {
    label: "Food Pass",
    hint: "Show at food counter. Single meal — re-scan blocked.",
    chip: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  },
} as const;

export default function PassCard({
  name,
  serial,
  email,
  mobile,
  rollNo,
  food,
  year,
  type,
  qrImage,
  token,
}: {
  name: string;
  serial: string;
  email: string;
  mobile: string;
  rollNo: string;
  food: string;
  year?: string;
  type: PassCardType;
  qrImage: string;
  token: string;
}) {
  const meta = TYPE_META[type];
  const [busy, setBusy] = useState(false);

  async function downloadPng() {
    if (busy) return;
    setBusy(true);
    try {
      const png = await drawPassImage({ serial, name, email, rollNo, food, qrDataUrl: qrImage, token });
      downloadDataUrl(png, `SCD_${rollNo}.png`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rank-card overflow-hidden">
      <div className="relative">
        <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden />
        <div className="glow-brand absolute -top-16 left-1/2 h-48 w-72 max-w-[100vw] -translate-x-1/2" aria-hidden />
        <div className="relative px-5 pt-5 text-center sm:px-6">
          <div className="flex items-center justify-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="AWS SBG logo"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-lg object-contain"
            />
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              AWS SBG · Community Day
            </p>
          </div>
          <h3 className="mt-2 text-lg font-bold tracking-tight text-cream">
            {meta.label}
          </h3>
          {serial ? (
            <p className="mx-auto mt-2 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 font-mono text-sm font-bold tracking-widest text-black">
              {serial}
            </p>
          ) : null}

          <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-3 shadow-[0_0_48px_rgba(173,92,255,0.28)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImage}
              alt={`${type} QR for ${name}`}
              width={200}
              height={200}
              className="h-[200px] w-[200px] rounded-lg"
            />
          </div>
          <p className="mt-3 text-xs text-faint">Show at gate — scan once</p>

          <dl className="mt-4 space-y-2.5 rounded-2xl border border-line bg-ink/40 p-4 text-left">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-xs text-faint">Valid for</dt>
              <dd className="min-w-0 break-words text-right text-sm font-semibold text-cream">Community Day · 8 Oct</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-line/60 pt-2.5">
              <dt className="shrink-0 text-xs text-faint">Name</dt>
              <dd className="min-w-0 break-words text-right text-sm font-semibold text-cream">{name}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-line/60 pt-2.5">
              <dt className="shrink-0 text-xs text-faint">Roll</dt>
              <dd className="font-mono text-sm font-semibold text-cream">{rollNo}</dd>
            </div>
            {year ? (
            <div className="flex items-baseline justify-between gap-3 border-t border-line/60 pt-2.5">
              <dt className="shrink-0 text-xs text-faint">Year</dt>
              <dd className="font-mono text-sm font-semibold text-cream">{year} year</dd>
            </div>
            ) : null}
            <div className="flex items-baseline justify-between gap-3 border-t border-line/60 pt-2.5">
              <dt className="shrink-0 text-xs text-faint">Email</dt>
              <dd className="min-w-0 break-all text-right text-xs text-fog">{email}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-line/60 pt-2.5">
              <dt className="shrink-0 text-xs text-faint">Mobile</dt>
              <dd className="font-mono text-sm text-fog">{mobile}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line/60 pt-2.5">
              <dt className="shrink-0 text-xs text-faint">Lunch</dt>
              <dd>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide",
                    food === "Veg"
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                      : "border-red-400/40 bg-red-400/10 text-red-300",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      food === "Veg" ? "bg-emerald-400" : "bg-red-400",
                    )}
                  />
                  {food === "Veg" ? "VEG" : "NON-VEG"}
                </span>
              </dd>
            </div>
          </dl>
          <div className="mt-3 space-y-1.5 text-xs text-fog">
            <p className="flex items-center justify-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
              {COMMUNITY_DAY_META.date} · {COMMUNITY_DAY_META.time}
            </p>
            <p className="flex items-center justify-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
              {COMMUNITY_DAY_META.venueShort}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-5 mt-5 border-t border-dashed border-line sm:mx-6" aria-hidden />

      <div className="px-5 py-4 sm:px-6">
        <p className="truncate font-mono text-[11px] text-faint" title={token}>
          {token}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-fog">
          {meta.hint} Screenshot works as backup.
        </p>
        <button
          type="button"
          onClick={downloadPng}
          disabled={busy}
          className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand to-purple-500 px-5 py-3 text-sm font-bold text-white shadow-[0_4px_24px_rgba(173,92,255,0.35)] transition-shadow hover:shadow-[0_4px_32px_rgba(173,92,255,0.5)] disabled:opacity-60 print:hidden"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="h-4 w-4" aria-hidden />
          )}
          Download pass
        </button>
      </div>
    </div>
  );
}
