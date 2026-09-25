import type { Metadata } from "next";
import PassesClient from "./passes-client";

export const metadata: Metadata = {
  title: "Get Event Entry Pass",
  description:
    "Register, get QR entry pass instantly + emailed copy. Single-use, scan at gate.",
};

export default function PassesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-24 pb-12 sm:px-6 md:pt-32">
      <p className="text-xs font-mono tracking-widest text-brand uppercase">
        {"// passes"}
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
        Get your event entry pass
      </h1>
      <p className="measure mt-3 text-sm leading-relaxed text-fog sm:text-base">
        Register once. System generates your QR entry pass instantly, shows it
        here, and emails a copy. Download the image or take a screenshot —
        show QR at gate, scans once.
      </p>
      <div className="mt-8">
        <PassesClient />
      </div>
    </div>
  );
}
