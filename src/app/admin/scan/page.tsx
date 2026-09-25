import type { Metadata } from "next";
import ScanClient from "./scan-client";

export const metadata: Metadata = {
  title: "Admin Scan",
  description: "Scan entry + food passes. Admin only.",
  robots: { index: false, follow: false },
};

export default function AdminScanPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-24 pb-12 sm:px-6 md:pt-32">
      <p className="text-xs font-mono tracking-widest text-brand uppercase">
        {"// admin scan"}
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Gate scanner</h1>
      <p className="measure mt-3 text-sm leading-relaxed text-fog sm:text-base">
        Admin only. Scan QR → GREEN = valid, Confirm burn → RED blocks reuse.
        ENTRY and FOOD tracked separately.
      </p>
      <div className="mt-8">
        <ScanClient />
      </div>
    </div>
  );
}
