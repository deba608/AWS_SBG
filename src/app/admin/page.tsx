import type { Metadata } from "next";
import AdminClient from "./admin-client";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Pass counts, search, CSV export. Admin only.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pt-24 pb-12 sm:px-6 md:pt-32">
      <p className="text-xs font-mono tracking-widest text-brand uppercase">
        {"// admin"}
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Dashboard</h1>
      <p className="measure mt-3 text-sm leading-relaxed text-fog sm:text-base">
        Headcount at a glance. Search passes, export CSV for lunch and event planning.
      </p>
      <div className="mt-8">
        <AdminClient />
      </div>
    </div>
  );
}
