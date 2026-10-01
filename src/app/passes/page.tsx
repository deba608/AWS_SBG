import type { Metadata } from "next";
import PassesClient from "./passes-client";
import RetrievePass from "@/components/RetrievePass";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Community Day Pass (8th Oct) — Free QR Entry Pass",
  description:
    "Get your free QR entry pass for Student Community Day on 8th October — instant + emailed copy. Single-use, scanned at gate. Hackathon, Tech Parliament and Make-A-Bot need separate registration.",
  alternates: { canonical: "/passes" },
  openGraph: {
    url: "/passes",
    title: `Get Community Day Entry Pass · ${SITE.shortName}`,
    description:
      "Pass valid only for 8th October Community Day — QR generates instantly, shows here, and emails to you.",
  },
  twitter: {
    card: "summary_large_image",
    title: `Get Community Day Entry Pass · ${SITE.shortName}`,
    description:
      "Pass valid only for 8th October Community Day — QR generates instantly, shows here, and emails to you.",
  },
};

export default function PassesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-24 pb-12 sm:px-6 md:pt-32">
      <p className="text-xs font-mono tracking-widest text-brand uppercase">
        {"// passes · community day · 8 oct"}
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
        Get your Community Day pass
      </h1>
      <p className="measure mt-3 text-sm leading-relaxed text-fog sm:text-base">
        Register once. System generates your QR entry pass instantly, shows it
        here, and emails a copy. Valid only for{" "}
        <span className="font-semibold text-cream">Student Community Day — 8th October</span>.
        Download the image or take a screenshot — one-time entry only, pass invalid after gate scan.
      </p>
      <p className="measure mt-2 text-sm leading-relaxed text-fog">
        Hackathon, Tech Parliament &amp; Make-A-Bot need separate registration —{" "}
        <a href="/hackathon" className="font-medium text-brand underline decoration-brand/50 underline-offset-4 hover:decoration-cream">hackathon team form</a>
        {" "}here, Google Forms for the other two (links shown after you register, also shared by mail).
      </p>
      <div className="mt-8">
        <PassesClient />
        <RetrievePass />
      </div>
    </div>
  );
}
