import type { Metadata } from "next";
import { ArrowRight, BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";
import Button from "@/components/Button";
import Container from "@/components/Container";
import LearningCard from "@/components/LearningCard";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { learningPaths } from "@/data/learning";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Learning",
  description: `Guided cloud learning paths — from fundamentals to AI/ML on AWS — by the ${SITE.name}.`,
};

export default function LearningPage() {
  return (
    <div className="py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Learning Hub"
          title="Your cloud learning journey starts here."
          description="Structured, beginner-friendly paths with the exact AWS services and topics to focus on. Pick one and start building."
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {learningPaths.map((path, i) => (
            <Reveal key={path.id} delay={Math.min(i * 0.07, 0.28)}>
              <LearningCard path={path} />
            </Reveal>
          ))}
          <Reveal delay={0.2}>
            <div className="flex h-full min-h-[280px] flex-col items-start justify-center rounded-2xl border border-dashed border-line bg-surface/40 p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
                <GraduationCap className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-cream">
                Preparing for certification?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-fog">
                Join a study group and prep for Cloud Practitioner or Solutions
                Architect with peers.
              </p>
              <Link
                href={SITE.links.join}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-brand hover:text-cream"
              >
                <BookOpen className="h-4 w-4" aria-hidden />
                Find a study group
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-12">
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-6 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-fog">
              <span className="font-semibold text-cream">New to cloud?</span>{" "}
              Start with Cloud Fundamentals — no prior experience needed.
            </p>
            <Button href={SITE.links.join} external className="shrink-0">
              Start Learning
            </Button>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
