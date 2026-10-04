import type { Metadata } from "next";
import ScanClient from "@/app/admin/scan/scan-client";

export const metadata: Metadata = {
  title: "Gate Check",
  description: "Entry-only attendee verification. Gate password login.",
  robots: { index: false, follow: false },
};

export default function CheckPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-24 pb-12 sm:px-6 md:pt-32">
      <p className="text-xs font-mono tracking-widest text-brand uppercase">
        {"// gate check"}
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Gate check</h1>
      <p className="measure mt-3 text-sm leading-relaxed text-fog sm:text-base">
        Entry verification only. Scan QR → GREEN = valid, Confirm entry →
        RED blocks reuse. No food counter, dashboard, or exports here.
      </p>
      <div className="mt-8">
        <ScanClient lockEntry />
      </div>
    </div>
  );
}
