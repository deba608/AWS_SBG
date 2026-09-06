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
    <div className="py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Community"
          index="●"
          title="Meet the builders behind the community."
          description="Students who organize workshops, mentor newcomers and keep the projects shipping."
        />

        <section aria-labelledby="leadership">
          <h2 id="leadership" className="mb-6 text-xl font-bold text-cream md:text-2xl">
            Community Leadership
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {teamLeads.map((member, i) => (
              <Reveal key={member.id} delay={Math.min(i * 0.07, 0.21)}>
                <TeamCard member={member} large />
              </Reveal>
            ))}
          </div>
        </section>

        <section aria-labelledby="core-team" className="mt-14 md:mt-20">
          <h2 id="core-team" className="mb-6 text-xl font-bold text-cream md:text-2xl">
            Core Team
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coreTeam.map((member, i) => (
              <Reveal key={member.id} delay={Math.min(i * 0.05, 0.25)}>
                <TeamCard member={member} />
              </Reveal>
            ))}
          </div>
        </section>

        <Reveal className="mt-14">
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-6 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-fog">
              <span className="font-semibold text-cream">Want to help run the community?</span>{" "}
              Core team applications open every semester.
            </p>
            <Button href={SITE.links.join} external className="shrink-0">
              Get Involved
            </Button>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
