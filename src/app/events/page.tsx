import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Button from "@/components/Button";
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
    <div className="pb-16 pt-10 md:pb-24 md:pt-14">
      <Container>
        <SectionHeading
          eyebrow="Upcoming and past sessions"
          title="Learn by showing up."
          description="Hands-on workshops, talks from engineers, and hackathons — every session is beginner-friendly and free for students."
        />
        <Reveal>
          <section
            aria-labelledby="community-day-spotlight"
            className="mb-12 border-y border-line py-8 md:py-10"
          >
            <p className="text-sm text-fog">
              Flagship session on October 3, free for students, 300 expected.
            </p>
            <h2
              id="community-day-spotlight"
              className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-cream [overflow-wrap:anywhere] md:text-3xl"
            >
              {COMMUNITY_DAY_META.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fog md:text-base">
              Cloud, AI/GenAI and DevOps with AWS pros, hands-on labs,
              networking, lunch, swag and certificate.
            </p>
            <dl className="mt-4 flex max-w-2xl flex-wrap gap-x-6 gap-y-1 text-sm">
              <div className="flex min-w-0 gap-2">
                <dt className="shrink-0 text-faint">Date</dt>
                <dd className="min-w-0 break-words text-fog">
                  {COMMUNITY_DAY_META.date}
                </dd>
              </div>
              <div className="flex min-w-0 gap-2">
                <dt className="shrink-0 text-faint">Time</dt>
                <dd className="min-w-0 break-words text-fog">
                  {COMMUNITY_DAY_META.time}
                </dd>
              </div>
              <div className="flex min-w-0 gap-2">
                <dt className="shrink-0 text-faint">Venue</dt>
                <dd className="min-w-0 break-words text-fog">
                  {COMMUNITY_DAY_META.venueShort}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
          </section>
        </Reveal>
        <EventsExplorer />

        <section aria-labelledby="past-events" className="mt-20 md:mt-28">
          <h2
            id="past-events"
            className="text-2xl font-bold tracking-tight text-cream md:text-3xl"
          >
            Past events
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fog md:text-base">
            An archive of recent sessions and what each one shipped.
          </p>
          <ul className="mt-8 border-t border-line">
            {pastEvents.map((event) => (
              <li
                key={event.id}
                className="min-w-0 border-b border-line py-5"
              >
                <p className="text-sm text-faint">{event.date}</p>
                <h3 className="mt-1 text-base font-semibold text-cream [overflow-wrap:anywhere]">
                  {event.title}
                </h3>
                <p className="mt-1 max-w-prose text-sm leading-relaxed text-fog [overflow-wrap:anywhere]">
                  {event.summary}
                </p>
                <a
                  href={SITE.links.eventDefault}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View recap for ${event.title}`}
                  className="mt-1 inline-flex min-h-[44px] items-center text-sm text-fog underline decoration-line underline-offset-4 transition-colors hover:text-cream hover:decoration-cream"
                >
                  View recap
                </a>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </div>
  );
}
