import type { Metadata } from "next";
import PassesClient from "./passes-client";

export const metadata: Metadata = {
  title: "Get Event + Food Pass",
  description:
    "Submit details, get QR entry + food pass instantly. Single-use, scan at gate.",
};

export default function PassesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-24 pb-12 sm:px-6 md:pt-32">
      <p className="text-xs font-mono tracking-widest text-brand uppercase">
        {"// passes"}
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
        Get your Entry + Food pass
      </h1>
      <p className="measure mt-3 text-sm leading-relaxed text-fog sm:text-base">
        Fill details once. System issues 2 QRs — one for gate entry, one for
        food. Each scans once. Screenshot works, but download PDF/print
        recommended.
      </p>
      <div className="mt-8">
        <PassesClient />
      </div>
    </div>
  );
}
