import type { Metadata } from "next";
import { ArrowRight, CalendarDays, Clock, History, MapPin } from "lucide-react";
import Link from "next/link";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import Container from "@/components/Container";
import EventsExplorer from "@/components/EventsExplorer";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { pastEvents } from "@/data/events";
import { COMMUNITY_DAY_META } from "@/data/community-day";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Events",
  description: `Workshops, tech talks, hackathons and build sessions by the ${SITE.name} at ${SITE.collegeName}.`,
};

export default function EventsPage() {
  return (
    <div className="py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Events"
          index="●"
          title="Learn by showing up."
          description="Hands-on workshops, talks from engineers, and hackathons — every session is beginner-friendly and free for students."
        />
        <Reveal>
          <section
            aria-labelledby="community-day-spotlight"
            className="relative mb-12 overflow-hidden rounded-3xl border border-brand/30 bg-surface px-6 py-8 md:px-10 md:py-10"
          >
            <div className="bg-grid absolute inset-0 opacity-60" aria-hidden />
            <div className="glow-brand absolute -top-20 left-1/4 h-64 w-[30rem]" aria-hidden />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>Flagship · Oct 3 · Free</Badge>
                  <Badge tone="neutral">300+ expected</Badge>
                </div>
                <h2
                  id="community-day-spotlight"
                  className="mt-4 text-2xl font-bold tracking-tight text-cream md:text-3xl"
                >
                  {COMMUNITY_DAY_META.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-fog md:text-base">
                  Cloud, AI/GenAI + DevOps with AWS pros, hands-on labs,
                  networking, lunch, swag and certificate.
                </p>
                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fog">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                    <dt className="sr-only">Date</dt>
                    <dd>{COMMUNITY_DAY_META.date}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                    <dt className="sr-only">Time</dt>
                    <dd>{COMMUNITY_DAY_META.time}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                    <dt className="sr-only">Venue</dt>
                    <dd>{COMMUNITY_DAY_META.venueShort}</dd>
                  </div>
                </dl>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button href={SITE.links.eventCommunityDay} external>
                  Register on Meetup
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  href="/events/aws-student-community-day-suiit-2026"
                  variant="secondary"
                >
                  View details
                </Button>
              </div>
            </div>
          </section>
        </Reveal>
        <EventsExplorer />

        <section aria-labelledby="past-events" className="mt-20 md:mt-28">
          <div className="mb-8 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-brand">
              <History className="h-5 w-5" aria-hidden />
            </span>
            <h2 id="past-events" className="text-2xl font-bold tracking-tight text-cream md:text-3xl">
              Past Events
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pastEvents.map((event, i) => (
              <Reveal key={event.id} delay={Math.min(i * 0.08, 0.24)}>
                <article className="flex h-full min-w-0 flex-col rounded-2xl border border-line bg-coal p-6 transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                  <p className="font-mono text-xs uppercase tracking-wider text-faint">
                    {event.date}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-cream">
                    {event.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-fog">
                    {event.summary}
                  </p>
                  <Link
                    href={SITE.links.eventDefault}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-brand hover:text-cream"
                  >
                    View recap
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}
