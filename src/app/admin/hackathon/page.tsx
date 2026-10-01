import type { Metadata } from "next";
import HackathonAdminClient from "./hackathon-admin-client";

export const metadata: Metadata = {
  title: "Hackathon Teams — Admin",
  description: "DecodeX Hackathon team registrations. Admin only.",
  robots: { index: false, follow: false },
};

export default function HackathonAdminPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pt-24 pb-12 sm:px-6 md:pt-32">
      <p className="text-xs font-mono tracking-widest text-brand uppercase">
        {"// admin · hackathon"}
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Hackathon teams</h1>
      <p className="measure mt-3 text-sm leading-relaxed text-fog sm:text-base">
        DecodeX Hackathon team registrations from <code className="font-mono">/hackathon</code>. Export CSV before the event.
      </p>
      <div className="mt-8">
        <HackathonAdminClient />
      </div>
    </div>
  );
}
