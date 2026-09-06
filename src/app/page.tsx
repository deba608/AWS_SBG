import {
  ArrowRight,
  BookOpen,
  Code2,
  GitBranch,
  Hammer,
  Mic,
  Trophy,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import Container from "@/components/Container";
import EventCard from "@/components/EventCard";
import FeatureCard from "@/components/FeatureCard";
import HeroVisual from "@/components/HeroVisual";
import JoinCTA from "@/components/JoinCTA";
import Journey from "@/components/Journey";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import StatsSection from "@/components/StatsSection";
import TechMarquee from "@/components/TechMarquee";
import { upcomingEvents } from "@/data/events";
import { projects } from "@/data/projects";
import { SITE } from "@/lib/constants";

const aboutCards = [
  {
    icon: BookOpen,
    title: "Learn",
    description: "Hands-on workshops and guided learning paths, from cloud basics to certification prep.",
  },
  {
    icon: Hammer,
    title: "Build",
    description: "Work on real projects and solve practical problems with peers who ship.",
  },
  {
    icon: Users,
    title: "Connect",
    description: "Meet students, developers and industry professionals at meetups and talks.",
  },
  {
    icon: TrendingUp,
    title: "Grow",
    description: "Develop technical and professional skills together — and lead while you learn.",
  },
];

const whatWeDo = [
  {
    icon: Wrench,
    title: "Workshops",
    description: "Hands-on sessions focused on AWS, cloud and modern technologies.",
  },
  {
    icon: Code2,
    title: "Build Sessions",
    description: "Collaborative sessions where students build real applications.",
  },
  {
    icon: Mic,
    title: "Tech Talks",
    description: "Learn from developers, engineers and industry professionals.",
  },
  {
    icon: Trophy,
    title: "Hackathons",
    description: "Solve real-world problems and build innovative solutions.",
  },
  {
    icon: GitBranch,
    title: "Open Source",
    description: "Collaborate, contribute and learn through real projects.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Meet like-minded builders and grow together.",
  },
];

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-fog transition-colors hover:border-brand/60 hover:text-cream"
    >
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden />
    </Link>
  );
}

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section aria-labelledby="hero-heading" className="relative overflow-hidden">
        <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden />
        <div className="glow-brand absolute -top-24 left-1/2 h-96 w-[52rem] -translate-x-1/2" aria-hidden />
        <Container className="relative py-16 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Reveal>
                <Badge>
                  <span className="relative flex h-1.5 w-1.5" aria-hidden>
                    <span className="absolute h-full w-full animate-ping rounded-full bg-brand opacity-70" />
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  </span>
                  {SITE.name} — {SITE.collegeName}
                </Badge>
              </Reveal>
              <h1
                id="hero-heading"
                className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight text-cream md:text-6xl lg:text-7xl"
              >
                Build. Learn.
                <br />
                Deploy. <span className="text-brand">Together.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-fog md:text-lg">
                {SITE.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href={SITE.links.join} external>
                  Join the Community
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
                <Button href="/events" variant="secondary">
                  Explore Events
                </Button>
              </div>
              <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                {[
                  ["No experience needed", "Beginner-friendly labs"],
                  ["Free for students", "Swag, certs & mentorship"],
                ].map(([term, detail]) => (
                  <div key={term} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 font-mono text-[11px] font-bold text-emerald-300" aria-hidden>
                      ✓
                    </span>
                    <div>
                      <dt className="text-sm font-semibold text-cream">{term}</dt>
                      <dd className="text-xs text-faint">{detail}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
            <Reveal delay={0.15}>
              <HeroVisual />
            </Reveal>
          </div>
        </Container>
      </section>

      <TechMarquee />
      <StatsSection />

      {/* ABOUT */}
      <section aria-labelledby="about-heading" id="about" className="scroll-mt-20 py-16 md:py-24">
        <Container>
          <SectionHeading
            eyebrow="About"
            index="01"
            title="More than a community. A place to build."
            description="The AWS Student Builder Group is a student-led chapter where you learn cloud by doing — guided labs, real projects, and people who help you ship."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {aboutCards.map((card, i) => (
              <Reveal key={card.title} delay={Math.min(i * 0.07, 0.21)}>
                <FeatureCard icon={card.icon} title={card.title} description={card.description} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* WHAT WE DO */}
      <section aria-labelledby="what-we-do-heading" className="relative bg-coal py-16 md:py-24">
        <div className="bg-dots absolute inset-0 opacity-40" aria-hidden />
        <Container className="relative">
          <SectionHeading
            eyebrow="What we do"
            index="02"
            title="Hands-on, every single week."
            description="Six formats, one goal: take you from curious to capable — and from capable to hired."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whatWeDo.map((card, i) => (
              <Reveal key={card.title} delay={Math.min(i * 0.06, 0.3)}>
                <FeatureCard icon={card.icon} title={card.title} description={card.description} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <Journey />

      {/* FEATURED EVENTS */}
      <section aria-labelledby="featured-events-heading" className="bg-coal py-16 md:py-24">
        <Container>
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                <span className="font-mono normal-case tracking-normal text-faint">04</span>
                Don&apos;t miss out
              </p>
              <h2 id="featured-events-heading" className="text-3xl font-bold tracking-tight text-cream md:text-4xl">
                Upcoming events
              </h2>
            </div>
            <SectionLink href="/events">View all events</SectionLink>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.slice(0, 3).map((event, i) => (
              <Reveal key={event.id} delay={Math.min(i * 0.08, 0.16)}>
                <EventCard event={event} compact />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* FEATURED PROJECTS */}
      <section aria-labelledby="featured-projects-heading" className="py-16 md:py-24">
        <Container>
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                <span className="font-mono normal-case tracking-normal text-faint">05</span>
                Showcase
              </p>
              <h2 id="featured-projects-heading" className="text-3xl font-bold tracking-tight text-cream md:text-4xl">
                Built by students
              </h2>
            </div>
            <SectionLink href="/projects">View all projects</SectionLink>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {projects.slice(0, 2).map((project, i) => (
              <Reveal key={project.id} delay={i * 0.08}>
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <JoinCTA />
    </>
  );
}
