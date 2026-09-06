import { BookOpen, Hammer, Rocket, Users } from "lucide-react";
import Container from "./Container";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

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
        <SectionHeading
          eyebrow="How it works"
          index="03"
          title="Learn → Build → Deploy → Connect"
          description="A loop, not a ladder. Every member moves through it at their own pace — and helps the next person do the same."
        />
        <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div aria-hidden className="absolute left-0 right-0 top-10 hidden border-t border-dashed border-line lg:block" />
          {steps.map((step, i) => (
            <Reveal key={step.num} delay={Math.min(i * 0.08, 0.24)}>
              <li className="group relative rounded-2xl border border-line bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-brand/40">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand/25 to-brand/5 text-brand ring-1 ring-brand/30">
                    <step.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="font-mono text-sm text-faint">{step.num}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-cream">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fog">{step.description}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
