"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadDataUrl, drawPassImage } from "@/lib/pass-image";
import { cn } from "@/lib/utils";

export type PassCardType = "ENTRY" | "FOOD";

export default function PassCard({
  name,
  email,
  mobile,
  type,
  qrImage,
  token,
}: {
  name: string;
  email: string;
  mobile: string;
  type: PassCardType;
  qrImage: string;
  token: string;
}) {
  const isEntry = type === "ENTRY";
  const [busy, setBusy] = useState(false);

  async function downloadPng() {
    if (busy) return;
    setBusy(true);
    try {
      const png = await drawPassImage({ name, email, mobile, qrDataUrl: qrImage, token });
      downloadDataUrl(png, `entry-pass-${mobile}.png`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rank-card overflow-hidden bg-white text-black print:border-black print:shadow-none">
      <div
        className={cn(
          "flex items-center justify-between px-5 py-3 text-sm font-bold tracking-wide text-white uppercase",
          isEntry ? "bg-[#7c3aed]" : "bg-[#15803d]",
        )}
      >
        <span>{isEntry ? "Event Entry Pass" : "Food Pass"}</span>
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-mono">
          {type}
        </span>
      </div>
      <div className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrImage}
          alt={`${type} QR for ${name}`}
          width={220}
          height={220}
          className="h-[220px] w-[220px] shrink-0 rounded-lg border border-black/10 bg-white p-2"
        />
        <div className="w-full min-w-0 text-center sm:text-left">
          <p className="truncate text-xl font-bold">{name}</p>
          <p className="mt-1 truncate text-sm text-black/60">{email}</p>
          <p className="text-sm text-black/60">{mobile}</p>
          <p className="mt-3 rounded-lg bg-black/5 p-2 font-mono text-[11px] break-all text-black/70">
            {token}
          </p>
          <p className="mt-2 text-xs font-medium text-black/50">
            {isEntry
              ? "Show at gate. Single scan — re-scan blocked."
              : "Show at food counter. Single meal — re-scan blocked."}
          </p>
          <p className="mt-1 text-xs text-black/50">
            Backup: take a screenshot of this pass.
          </p>
          <button
            type="button"
            onClick={downloadPng}
            disabled={busy}
            className="mt-3 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-black/80 disabled:opacity-60 print:hidden"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Download className="h-4 w-4" aria-hidden />
            )}
            Download pass image
          </button>
        </div>
      </div>
    </div>
  );
}
