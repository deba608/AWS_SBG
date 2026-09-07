import Link from "next/link";
import Button from "@/components/Button";
import Container from "@/components/Container";
import EventCard from "@/components/EventCard";
import HeroVisual from "@/components/HeroVisual";
import JoinCTA from "@/components/JoinCTA";
import { upcomingEvents } from "@/data/events";
import { SITE } from "@/lib/constants";

const about = [
  {
    title: "Learn",
    description:
      "Hands-on workshops and guided learning paths, from cloud basics to certification prep.",
  },
  {
    title: "Build",
    description:
      "Work on real projects and solve practical problems with peers who ship.",
  },
  {
    title: "Connect",
    description:
      "Meet students, developers and industry professionals at meetups and talks.",
  },
  {
    title: "Grow",
    description:
      "Develop technical and professional skills together, then mentor the next batch.",
  },
];

function QuietHeading({
  label,
  title,
  description,
  id,
}: {
  label: string;
  title: string;
  description?: string;
  id: string;
}) {
  return (
    <div className="mb-10 max-w-2xl md:mb-12">
      <p className="text-sm font-medium text-faint">{label}</p>
      <h2 id={id} className="mt-2 text-3xl font-semibold tracking-tight text-cream md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-fog">{description}</p>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section aria-labelledby="hero-heading">
        <Container className="pb-12 pt-24 sm:pb-16 md:pb-24 md:pt-32">
          <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-[1.05fr_0.95fr] [&>*]:min-w-0">
            <div className="min-w-0">
              <p className="text-sm text-faint">
                {SITE.name}, <span className="md:hidden">{SITE.collegeShortName}</span><span className="hidden md:inline">{SITE.collegeName}</span>
              </p>
              <h1
                id="hero-heading"
                className="mt-4 max-w-xl text-4xl font-bold leading-[1.05] tracking-tight text-cream sm:text-5xl md:text-6xl lg:text-7xl"
              >
                Build. Learn. Deploy. Together.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-fog md:text-lg">
                {SITE.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row [&>*]:w-full sm:[&>*]:w-auto">
                <Button href={SITE.links.join} external>
                  Join the community
                </Button>
                <Button href="/events" variant="secondary">
                  Explore events
                </Button>
              </div>
            </div>
            <HeroVisual />
          </div>
        </Container>
      </section>

      {/* ABOUT */}
      <section aria-labelledby="about-heading" id="about" className="scroll-mt-24 py-12 sm:py-16 lg:py-24">
        <Container>
          <QuietHeading
            id="about-heading"
            label="About"
            title="A place to build, not just belong"
            description="A student-led chapter where you learn cloud by doing. Guided labs, real projects, and people who help you ship."
          />
          <dl className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2">
            {about.map((item, i) => (
              <div
                key={item.title}
                className={i === 0 ? "border-t border-line pt-5 md:col-span-2" : "border-t border-line pt-5"}
              >
                <dt
                  className={
                    i === 0
                      ? "text-2xl font-bold tracking-tight text-cream"
                      : "text-lg font-semibold text-cream"
                  }
                >
                  {item.title}
                </dt>
                <dd
                  className={
                    i === 0
                      ? "mt-2 max-w-2xl text-base leading-relaxed text-fog"
                      : "mt-1.5 text-sm leading-relaxed text-fog"
                  }
                >
                  {item.description}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* UPCOMING */}
      <section aria-labelledby="upcoming-heading" className="border-t border-line py-12 sm:py-16 lg:py-24">
        <Container>
          <QuietHeading
            id="upcoming-heading"
            label="Upcoming"
            title="Upcoming events"
            description="Three sessions on the calendar. Join one and ship something."
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.slice(0, 3).map((event) => (
              <EventCard key={event.id} event={event} compact />
            ))}
          </div>
          <p className="mt-8">
            <Link
              href="/events"
              className="inline-flex min-h-[44px] items-center text-sm font-medium text-fog underline decoration-line underline-offset-4 transition-colors hover:text-cream hover:decoration-brand"
            >
              View all events
            </Link>
          </p>
        </Container>
      </section>

      <JoinCTA />
    </>
  );
}
