import type { Metadata } from "next";
import { BadgeIndianRupee } from "lucide-react";
import PayoutsClient from "./payouts-client";

export const metadata: Metadata = {
  title: "Winner Payouts — Submit Payment Details",
  description:
    "Winners only: submit UPI ID or bank account details so organizers can transfer prize money.",
  alternates: { canonical: "/payouts" },
  openGraph: {
    url: "/payouts",
    title: "Winner Payouts — Payment Details",
    description: "Winners submit UPI / bank details for prize transfer.",
  },
};

export default function PayoutsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-24 pb-12 sm:px-6 md:pt-32">
      <p className="text-xs font-mono tracking-widest text-brand uppercase">
        {"// winner payouts"}
      </p>
      <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold sm:text-4xl">
        <BadgeIndianRupee className="h-7 w-7 shrink-0 text-brand" aria-hidden />
        Get your prize money
      </h1>
      <p className="measure mt-3 text-sm leading-relaxed text-fog sm:text-base">
        Winners only. Submit the UPI ID or bank account where organizers should send the prize.
        Separate system — nothing here touches registration or passes.
      </p>
      <div className="mt-8">
        <PayoutsClient />
      </div>
    </div>
  );
}
