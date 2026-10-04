import type { Metadata } from "next";
import TeamAdminClient from "./team-admin-client";

export const metadata: Metadata = {
  title: "Team photos — Admin",
  description: "Approve team member photo submissions. Admin only.",
  robots: { index: false, follow: false },
};

export default function AdminTeamPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pt-24 pb-12 sm:px-6 md:pt-32">
      <p className="font-mono text-xs uppercase tracking-widest text-brand">{"// admin"}</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Team photos</h1>
      <p className="measure mt-3 text-sm leading-relaxed text-fog sm:text-base">
        Review member submissions. Approving shows the photo on the team page instantly.
      </p>
      <div className="mt-8">
        <TeamAdminClient />
      </div>
    </div>
  );
}
