import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Button from "@/components/Button";
import Container from "@/components/Container";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { GithubIcon } from "@/components/icons";
import { projects } from "@/data/projects";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Projects",
  description: `Real applications designed, built and deployed by students in the ${SITE.name}.`,
};

export default function ProjectsPage() {
  return (
    <div className="py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Showcase"
          index="●"
          title="Built by students."
          description="Real applications designed, built and deployed by community members — with the AWS services behind each one."
        />
        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((project, i) => (
            <Reveal key={project.id} delay={Math.min(i * 0.07, 0.21)}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-12 text-center md:py-14">
            <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden />
            <div className="relative">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
                <GithubIcon className="h-5 w-5" />
              </span>
              <h2 className="mx-auto mt-4 max-w-md text-2xl font-bold tracking-tight text-cream md:text-3xl">
                Built something cool? Submit your project.
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fog md:text-base">
                Open a PR on our GitHub org and get your build featured here.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href={SITE.links.github} external>
                  Submit on GitHub
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
                <Button href={SITE.links.join} variant="secondary" external>
                  Ask in Discord
                </Button>
              </div>
              <p className="mt-4 text-xs text-faint">
                Or share it at the next build session —{" "}
                <Link href="/events" className="text-brand hover:text-cream">
                  see events
                </Link>
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
