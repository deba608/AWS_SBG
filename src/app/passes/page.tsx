import type { Metadata } from "next";
import PassesClient from "./passes-client";
import RetrievePass from "@/components/RetrievePass";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "AWS SCD Pass — Free QR Entry Pass",
  description:
    "Register for AWS SBG events and AWS Student Community Day, get your free QR entry pass instantly + emailed copy. Single-use, scanned at gate.",
  alternates: { canonical: "/passes" },
  openGraph: {
    url: "/passes",
    title: `Get Event Entry Pass · ${SITE.shortName}`,
    description:
      "Register once — QR entry pass generates instantly, shows here, and emails to you.",
  },
  twitter: {
    card: "summary_large_image",
    title: `Get Event Entry Pass · ${SITE.shortName}`,
    description:
      "Register once — QR entry pass generates instantly, shows here, and emails to you.",
  },
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
        one-time entry only, pass invalid after gate scan.
      </p>
      <div className="mt-8">
        <PassesClient />
        <RetrievePass />
      </div>
    </div>
  );
}
