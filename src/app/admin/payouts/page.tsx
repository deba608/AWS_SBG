import type { Metadata } from "next";
import PayoutsAdminClient from "./payouts-admin-client";

export const metadata: Metadata = {
  title: "Winner Payouts — Admin",
  description: "Winner payment details for prize transfers. Admin only.",
  robots: { index: false, follow: false },
};

export default function PayoutsAdminPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pt-24 pb-12 sm:px-6 md:pt-32">
      <p className="text-xs font-mono tracking-widest text-brand uppercase">
        {"// admin · payouts"}
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Winner payouts</h1>
      <p className="measure mt-3 text-sm leading-relaxed text-fog sm:text-base">
        Payment details submitted via <code className="font-mono">/payouts</code>. Verify → send money → mark paid with txn note. Export CSV for records.
      </p>
      <div className="mt-8">
        <PayoutsAdminClient />
      </div>
    </div>
  );
}
