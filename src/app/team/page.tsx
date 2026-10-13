import type { Metadata } from "next";
import Button from "@/components/Button";
import Container from "@/components/Container";
import Reveal from "@/components/Reveal";
import TeamExplorer from "@/components/TeamExplorer";
import { getTeamLists } from "@/lib/team-store";
import { SITE } from "@/lib/constants";
import { Users, Layers, Sparkles, Terminal } from "lucide-react";

// Static + ISR: page pre-renders, admin session detected client-side.
// Cuts TTFB vs per-request SSR.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Team — AWS SBG SUIIT Student Builders",
  description: `Meet the student builders running AWS SBG — the ${SITE.name} at ${SITE.collegeName}.`,
  alternates: { canonical: "/team" },
  openGraph: {
    url: "/team",
    title: `Team · ${SITE.shortName}`,
    description: `Meet the student builders running AWS SBG — the ${SITE.name} at ${SITE.collegeName}.`,
  },
  twitter: {
    card: "summary_large_image",
    title: `Team · ${SITE.shortName}`,
    description: `Meet the student builders running AWS SBG — the ${SITE.name} at ${SITE.collegeName}.`,
  },
};

export default async function TeamPage() {
  const { teamLeads, domainLeads, opsTeam, coordinators } = await getTeamLists();
  const adminMode = false;
  const totalBuilders =
    teamLeads.length + domainLeads.length + opsTeam.length + coordinators.length;

  return (
    <div className="relative overflow-x-clip pb-16 pt-20 sm:pb-20 sm:pt-24 md:pb-28 md:pt-32">
      {/* Ambient background glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-full max-w-6xl -translate-x-1/2 overflow-hidden opacity-40 blur-3xl"
      >
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,_rgba(173,92,255,0.18)_0%,_rgba(15,19,23,0)_70%)]" />
      </div>

      <Container>
        {/* Hero Section */}
        <div className="mb-8 sm:mb-16">
          <Reveal>
            <h1 className="text-balance text-3xl font-extrabold tracking-tight text-cream sm:text-4xl md:text-5xl lg:text-6xl">
              Meet the builders behind the community.
            </h1>
          </Reveal>

          {/* Quick Metrics Bar */}
          <Reveal delay={0.1} className="mt-6 sm:mt-8">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
              <div className="rounded-xl border border-line/70 bg-coal/70 p-3 backdrop-blur-sm transition-colors duration-300 hover:border-brand/40 sm:p-4">
                <div className="flex items-center gap-2 text-brand">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span className="truncate text-[11px] font-mono font-semibold uppercase text-faint sm:text-xs">
                    Leadership
                  </span>
                </div>
                <p className="mt-1.5 text-xl font-bold font-mono text-cream sm:text-2xl">
                  {teamLeads.length}
                </p>
                <p className="text-xs text-fog">Executive leaders</p>
              </div>

              <div className="rounded-xl border border-line/70 bg-coal/70 p-3 backdrop-blur-sm transition-colors duration-300 hover:border-brand/40 sm:p-4">
                <div className="flex items-center gap-2 text-brand">
                  <Layers className="h-4 w-4 shrink-0" />
                  <span className="truncate text-[11px] font-mono font-semibold uppercase text-faint sm:text-xs">
                    Domains
                  </span>
                </div>
                <p className="mt-1.5 text-xl font-bold font-mono text-cream sm:text-2xl">
                  8+
                </p>
                <p className="text-xs text-fog">Tech specializations</p>
              </div>

              <div className="rounded-xl border border-line/70 bg-coal/70 p-3 backdrop-blur-sm transition-colors duration-300 hover:border-brand/40 sm:p-4">
                <div className="flex items-center gap-2 text-brand">
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="truncate text-[11px] font-mono font-semibold uppercase text-faint sm:text-xs">
                    Builders
                  </span>
                </div>
                <p className="mt-1.5 text-xl font-bold font-mono text-cream sm:text-2xl">
                  {totalBuilders}
                </p>
                <p className="text-xs text-fog">Active core members</p>
              </div>

              <div className="rounded-xl border border-line/70 bg-coal/70 p-3 backdrop-blur-sm transition-colors duration-300 hover:border-brand/40 sm:p-4">
                <div className="flex items-center gap-2 text-brand">
                  <Terminal className="h-4 w-4 shrink-0" />
                  <span className="truncate text-[11px] font-mono font-semibold uppercase text-faint sm:text-xs">
                    Initiative
                  </span>
                </div>
                <p className="mt-1.5 text-xl font-bold font-mono text-cream sm:text-2xl">
                  100%
                </p>
                <p className="text-xs text-fog">Student-led group</p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Dynamic Interactive Team Explorer */}
        <Reveal delay={0.15}>
          <TeamExplorer
            teamLeads={teamLeads}
            domainLeads={domainLeads}
            opsTeam={opsTeam}
            coordinators={coordinators}
            adminMode={adminMode}
          />
        </Reveal>

        {/* Elevated Bottom Command Card: Get Involved */}
        <Reveal delay={0.2} className="mt-12 sm:mt-20">
          <div className="relative overflow-hidden rounded-2xl border border-line/80 bg-gradient-to-b from-surface/90 via-coal/90 to-surface/90 p-6 shadow-[0_16px_50px_rgba(0,0,0,0.5)] sm:rounded-3xl sm:p-10 md:p-12">
            {/* Mesh grid & purple ambient flare */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-brand/15 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-mono font-medium text-brand border border-brand/30">
                  <Terminal className="h-3 w-3" /> Join the Cohort
                </span>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-cream sm:text-3xl">
                  Want to build with AWS SBG?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-fog sm:text-base">
                  Core team applications and domain openings happen every semester.
                  Already a team member? You can request a profile and photo update anytime.
                </p>
              </div>

              <div className="flex flex-col gap-3 shrink-0 sm:flex-row">
                <Button
                  href="/team/update"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Request profile update
                </Button>
                <Button
                  href={SITE.links.join}
                  external
                  variant="primary"
                  className="w-full sm:w-auto"
                >
                  Get involved
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
