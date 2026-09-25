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
    hint: "Show at gate. Single scan — re-scan blocked.",
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
  email,
  rollNo,
  food,
  type,
  qrImage,
  token,
}: {
  name: string;
  email: string;
  rollNo: string;
  food: string;
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
      const png = await drawPassImage({ name, email, rollNo, food, qrDataUrl: qrImage, token });
      downloadDataUrl(png, `entry-pass-${rollNo}.png`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rank-card overflow-hidden">
      <div
        className="h-1 bg-gradient-to-r from-brandpressed via-brand to-brandhover"
        aria-hidden
      />
      <div className="relative">
        <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden />
        <div className="relative px-5 pt-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                AWS SBG · Community Day
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-cream">
                {meta.label}
              </h3>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 font-mono text-xs font-semibold",
                meta.chip,
              )}
            >
              {type}
            </span>
          </div>

          <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
            <div className="shrink-0 rounded-2xl bg-white p-3 shadow-[0_0_48px_rgba(173,92,255,0.28)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImage}
                alt={`${type} QR for ${name}`}
                width={200}
                height={200}
                className="h-[200px] w-[200px] rounded-lg"
              />
            </div>
            <div className="w-full min-w-0 text-center sm:text-left">
              <p className="truncate text-xl font-bold tracking-tight text-cream">
                {name}
              </p>
              <p className="mt-1 truncate text-sm text-fog">{email}</p>
              <p className="mt-0.5 font-mono text-xs tracking-wide text-faint">
                {rollNo}
              </p>
              <p
                className={cn(
                  "mt-2.5 inline-block rounded-full border px-3 py-1 text-xs font-bold",
                  food === "Veg"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border-amber-400/30 bg-amber-400/10 text-amber-300",
                )}
              >
                {food === "Veg" ? "VEG" : "NON-VEG"}
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-fog">
                <p className="flex items-center justify-center gap-1.5 sm:justify-start">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                  {COMMUNITY_DAY_META.date}
                </p>
                <p className="flex items-center justify-center gap-1.5 sm:justify-start">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                  {COMMUNITY_DAY_META.venueShort}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-5 mt-5 border-t border-dashed border-line sm:mx-6" aria-hidden />

      <div className="px-5 py-4 sm:px-6">
        <p className="truncate font-mono text-[11px] text-faint" title={token}>
          {token}
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-fog">
            {meta.hint} Screenshot works as backup.
          </p>
          <button
            type="button"
            onClick={downloadPng}
            disabled={busy}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-brandhover disabled:opacity-60 print:hidden"
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
    </div>
  );
}
