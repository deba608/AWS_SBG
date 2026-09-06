import { BookOpen, Hammer, Rocket, Users } from "lucide-react";
import Container from "./Container";
import { SITE } from "@/lib/constants";

const steps = [
  {
    icon: BookOpen,
    num: "01",
    title: "Learn",
    description: "Guided labs and workshops take you from zero to your first deploy.",
  },
  {
    icon: Hammer,
    num: "02",
    title: "Build",
    description: "Ship real projects with peers in build sessions and hackathons.",
  },
  {
    icon: Rocket,
    num: "03",
    title: "Deploy",
    description: "Put it on AWS with serverless, CI/CD and infrastructure as code.",
  },
  {
    icon: Users,
    num: "04",
    title: "Connect",
    description: "Demo your work, meet engineers, and grow into a community lead.",
  },
];

export default function Journey() {
  return (
    <section aria-label="How the community works" className="py-16 md:py-24">
      <Container>
        <div className="mb-10 max-w-2xl md:mb-12">
          <p className="text-sm font-medium text-faint">How it works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-cream md:text-4xl">
            {SITE.tagline}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-fog">
            A loop, not a ladder. Every member moves through it at their own pace,
            and helps the next person do the same.
          </p>
        </div>
        <div className="relative">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-1.5 hidden border-t border-dashed border-line lg:block"
          />
          <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {steps.map((step) => (
              <li key={step.num} className="relative pt-0 lg:pt-8">
                <span
                  aria-hidden
                  className="absolute left-0 top-0 hidden h-3 w-3 rounded-full border border-faint bg-ink lg:block"
                />
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-fog">
                    <step.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="font-mono text-sm text-faint">{step.num}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-cream">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fog">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
