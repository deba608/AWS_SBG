import type { Metadata } from "next";
import FoodTokensClient from "./food-tokens-client";

export const metadata: Metadata = {
  title: "Food Tokens — Print",
  description: "Upload registration Excel, preview food tokens, print 10-per-A4. Admin only.",
  robots: { index: false, follow: false },
};

export default function FoodTokensPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pt-24 pb-12 sm:px-6 md:pt-32">
      <p className="text-xs font-mono tracking-widest text-brand uppercase print:hidden">
        {"// admin · offline print"}
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl print:hidden">Food tokens</h1>
      <p className="measure mt-3 text-sm leading-relaxed text-fog sm:text-base print:hidden">
        Upload registration Excel (or pull live list). Tokens print 10–15 per A4 sheet — cut along dotted
        lines. Works offline after load: press Ctrl+P.
      </p>
      <div className="mt-8">
        <FoodTokensClient />
      </div>
    </div>
  );
}
