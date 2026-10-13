import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import Button from "@/components/Button";
import Container from "@/components/Container";
import EventCard from "@/components/EventCard";
import EventGroup from "@/components/EventGroup";
import HeroVisual from "@/components/HeroVisual";
import JoinCTA from "@/components/JoinCTA";
import { upcomingEvents } from "@/data/events";
import { SITE, STATS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "AWS SBG SUIIT — Workshops, Hackathons & Student Community Day",
  description:
    "AWS SBG — AWS Student Builder Group at SUIIT, Sambalpur. Free workshops, hackathons & AWS Student Community Day (AWS SCD) on cloud, AI/GenAI and DevOps.",
  keywords: [
    "AWS SBG",
    "AWS Student Builder Group",
    "AWS Student Builder Group SUIIT",
    "AWS SCD",
    "AWS Student Community Day",
    "SUIIT",
    "Sambalpur",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "AWS SBG SUIIT — AWS Student Builder Group",
    description:
      "Student-led AWS cloud community at SUIIT: free workshops, hackathons and AWS Student Community Day (AWS SCD) 2026. Beginner-friendly.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AWS SBG SUIIT — AWS Student Builder Group",
    description:
      "Student-led AWS cloud community at SUIIT: free workshops, hackathons and AWS Student Community Day (AWS SCD) 2026.",
  },
};

const homeFaqs = [
  {
    q: "What is AWS SBG SUIIT?",
    a: "AWS SBG (AWS Student Builder Group) at SUIIT is a student-led cloud community at Sambalpur University Institute of Information Technology, Burla. Members learn AWS, AI/GenAI and DevOps through free hands-on workshops, real projects and hackathons.",
  },
  {
    q: "What is AWS SCD?",
    a: "AWS SCD is the AWS Student Community Day — the flagship annual meetup organised by AWS SBG SUIIT. AWS SCD 2026 runs October 6–8 at SUIIT with the DecodeX Hackathon, Tech Parliament, Make-A-Bot competition, speaker sessions, lunch and certificates.",
  },
  {
    q: "How do I join the AWS Student Builder Group?",
    a: "Join the WhatsApp community linked on this page. For Community Day, get your free QR entry pass (valid only for Student Community Day on 8th October) — Hackathon, Tech Parliament and Make-A-Bot need separate registration. No prior cloud experience needed.",
  },
  {
    q: "Does the Community Day pass cover the Hackathon, Tech Parliament or Make-A-Bot?",
    a: "No. The QR pass is valid only for Student Community Day on 8th October. Register DecodeX Hackathon teams at /hackathon on this website; Tech Parliament and Make-A-Bot via their Google Forms (links on the event cards, also shared by mail).",
  },
  {
    q: "Is AWS SBG free for students?",
    a: "Yes. All AWS SBG workshops, meetups and the AWS Student Community Day are free for students, including lunch and participation certificates at the flagship event.",
  },
  {
    q: "Where is AWS SCD 2026 held?",
    a: "AWS Student Community Day SUIIT 2026 is held October 6–8 at the APJ Abdul Kalam Auditorium, SUIIT, Burla, Sambalpur, Odisha.",
  },
];

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

const homeFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: homeFaqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd) }}
      />
      {/* HERO */}
      <section aria-labelledby="hero-heading">
        <Container className="pb-12 pt-24 sm:pb-16 md:pb-20 md:pt-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8 [&>*]:min-w-0">
            <div className="min-w-0">
              <h1
                id="hero-heading"
                className="max-w-xl text-[2.75rem] font-bold leading-[0.98] tracking-[-0.03em] text-cream sm:text-6xl md:text-7xl"
              >
                <span className="sr-only">AWS SBG SUIIT — AWS Student Builder Group: </span>
                Where SUIIT students learn cloud{" "}
                <span className="relative inline-block text-brand">
                  by building.
                  <svg
                    viewBox="0 0 220 12"
                    aria-hidden
                    className="absolute -bottom-1 left-0 w-full text-brand/60"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M3 9 C 60 3, 160 3, 217 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-fog md:text-lg">
                A free, beginner-friendly crew at Burla running hands-on AWS,
                GenAI &amp; DevOps workshops, hackathons, and meetups. No
                experience needed — just show up and ship.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
                <Button href={SITE.links.join} external>
                  Join the community
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Button>
                <Button href="/events" variant="secondary">
                  Explore events
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-faint">
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex -space-x-1.5" aria-hidden>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-ink bg-raised text-[9px] font-bold text-cream">PS</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-ink bg-raised text-[9px] font-bold text-cream">MD</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-ink bg-brand text-[9px] font-bold text-black">+</span>
                  </span>
                  500+ builders already in
                </span>
                <span aria-hidden className="h-1 w-1 rounded-full bg-line" />
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  SUIIT, Burla
                </span>
                <span aria-hidden className="h-1 w-1 rounded-full bg-line" />
                <span>Free forever</span>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
                {STATS.slice(0, 3).map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <dt className="order-2 mt-1 text-[13px] text-faint">{s.label}</dt>
                    <dd className="order-1 font-mono text-2xl font-semibold tracking-tight text-cream">
                      {s.value}
                      <span className="text-brand">{s.suffix}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <HeroVisual />
          </div>
          <p className="mt-14 hidden items-center gap-3 overflow-hidden font-mono text-[11px] uppercase tracking-[0.18em] text-faint/70 md:flex" aria-hidden>
            <span>EC2</span><span className="text-line">/</span>
            <span>Lambda</span><span className="text-line">/</span>
            <span>S3</span><span className="text-line">/</span>
            <span>Bedrock</span><span className="text-line">/</span>
            <span>Amplify</span><span className="text-line">/</span>
            <span className="text-faint">ap-south-1</span>
            <span className="h-px flex-1 bg-line/60" />
            <span>est. SUIIT — Burla</span>
          </p>
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
            description="Hands-on sessions, hackathons, and discussions on the calendar. Join one and ship something."
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents
              .filter((event) => !event.parentId)
              .map((event) => {
                const sessions = upcomingEvents.filter((e) => e.parentId === event.id);
                return sessions.length > 0 ? (
                  <EventGroup key={event.id} parent={event} sessions={sessions} compact />
                ) : (
                  <EventCard key={event.id} event={event} compact />
                );
              })}
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

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="border-t border-line py-12 sm:py-16 lg:py-24">
        <Container>
          <QuietHeading
            id="faq-heading"
            label="FAQ"
            title="AWS SBG & AWS SCD, explained"
            description="What the community is, what Community Day covers, and how to join."
          />
          <div className="grid max-w-3xl gap-3">
            {homeFaqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-line bg-surface px-5 py-4 open:border-brand/40"
              >
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-cream">
                  {f.q}
                  <span className="shrink-0 text-brand transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-fog">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <JoinCTA />
    </>
  );
}
