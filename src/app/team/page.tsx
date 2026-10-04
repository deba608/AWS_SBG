import type { Metadata } from "next";
import Button from "@/components/Button";
import Container from "@/components/Container";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import TeamCard from "@/components/TeamCard";
import type { TeamMember } from "@/data/team";
import { getTeamLists } from "@/lib/team-store";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Team — AWS SBG SUIIT Student Builders",
  description: `Meet the student builders running AWS SBG — the ${SITE.name} at ${SITE.collegeName}.`,
  alternates: { canonical: "/team" },
  openGraph: {
    url: "/team",
    title: `Team · ${SITE.shortName}`,
    description: `36 students across 12 domains — organizing workshops, mentoring newcomers and keeping the projects shipping.`,
  },
  twitter: {
    card: "summary_large_image",
    title: `Team · ${SITE.shortName}`,
    description: `36 students across 12 domains — organizing workshops, mentoring newcomers and keeping the projects shipping.`,
  },
};

function TeamSection({
  id,
  title,
  members,
  cols = 2,
  large = false,
}: {
  id: string;
  title: string;
  members: TeamMember[];
  cols?: 1 | 2;
  large?: boolean;
}) {
  return (
    <section aria-labelledby={id}>
      <h2
        id={id}
        className="text-xl font-bold text-cream md:text-2xl"
      >
        {title}
      </h2>
      <ul
        className={
          cols === 2
            ? "mt-4 grid grid-cols-1 gap-x-5 gap-y-2 border-t border-line sm:grid-cols-2 sm:gap-x-8"
            : "mt-4 border-t border-line"
        }
      >
        {members.map((member, i) => (
          <li key={member.id} className="min-w-0 border-b border-line">
            <Reveal delay={Math.min(i * 0.05, 0.25)}>
              <TeamCard member={member} large={large} />
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function TeamPage() {
  const { teamLeads, domainLeads, opsTeam, coordinators } = await getTeamLists();
  return (
    <div className="pb-12 pt-24 sm:pb-16 md:pb-24 md:pt-32">
      <Container>
        <h1 className="sr-only">Team — AWS Student Builder Group at SUIIT</h1>
        <SectionHeading
          eyebrow="AWS Student Builder Group Team 2025–26"
          title="Meet the builders behind the community."
          description="36 students across 12 domains — organizing workshops, mentoring newcomers and keeping the projects shipping."
        />

        <div className="space-y-12 sm:space-y-14 md:space-y-20">
          <TeamSection
            id="leadership"
            title="Leadership"
            members={teamLeads}
            cols={1}
            large
          />

          <TeamSection
            id="domain-leads"
            title="Domain leads"
            members={domainLeads}
          />

          <TeamSection
            id="ops-team"
            title="Events, PR & media"
            members={opsTeam}
          />

          <TeamSection
            id="coordinators"
            title="Co-ordinators"
            members={coordinators}
          />
        </div>

        <Reveal className="mt-12 sm:mt-14">
          <div className="flex flex-col gap-4 border-y border-line py-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-cream">
                Get involved
              </h2>
              <p className="mt-1 max-w-prose text-sm leading-relaxed text-fog">
                Want to help run the community? Core team applications open
                every semester.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 shrink-0 sm:w-auto sm:flex-row">
              <Button href="/team/join" className="w-full sm:w-auto">
                Submit team photo
              </Button>
              <Button
                href={SITE.links.join}
                external
                className="w-full sm:w-auto"
              >
                Get involved
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
