import type { Metadata } from "next";
import { ArrowRight, History } from "lucide-react";
import Link from "next/link";
import Container from "@/components/Container";
import EventsExplorer from "@/components/EventsExplorer";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { pastEvents } from "@/data/events";
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
          title="Learn by showing up."
          description="Hands-on workshops, talks from engineers, and hackathons — every session is beginner-friendly and free for students."
        />
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
                <article className="flex h-full flex-col rounded-2xl border border-line bg-coal p-6">
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
