import type { Metadata } from "next";
import Button from "@/components/Button";
import Container from "@/components/Container";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import TeamCard from "@/components/TeamCard";
import { coreTeam, teamLeads } from "@/data/team";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Team",
  description: `Meet the student builders running the ${SITE.name} at ${SITE.collegeName}.`,
};

export default function TeamPage() {
  return (
    <div className="pb-16 pt-10 md:pb-24 md:pt-14">
      <Container>
        <SectionHeading
          eyebrow="The people running the community"
          title="Meet the builders behind the community."
          description="Students who organize workshops, mentor newcomers and keep the projects shipping."
        />

        <section aria-labelledby="leadership">
          <h2
            id="leadership"
            className="text-xl font-bold text-cream md:text-2xl"
          >
            Community leadership
          </h2>
          <ul className="mt-4 border-t border-line">
            {teamLeads.map((member, i) => (
              <li key={member.id} className="min-w-0 border-b border-line">
                <Reveal delay={Math.min(i * 0.07, 0.21)}>
                  <TeamCard member={member} large />
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="core-team" className="mt-14 md:mt-20">
          <h2
            id="core-team"
            className="text-xl font-bold text-cream md:text-2xl"
          >
            Core team
          </h2>
          <ul className="mt-4 grid gap-x-10 border-t border-line sm:grid-cols-2">
            {coreTeam.map((member, i) => (
              <li
                key={member.id}
                className="min-w-0 border-b border-line"
              >
                <Reveal delay={Math.min(i * 0.05, 0.25)}>
                  <TeamCard member={member} />
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        <Reveal className="mt-14">
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
            <Button
              href={SITE.links.join}
              external
              className="shrink-0"
            >
              Get involved
            </Button>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
