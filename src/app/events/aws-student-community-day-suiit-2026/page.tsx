import type { Metadata } from "next";
import {
  ArrowRight,
  Award,
  Backpack,
  CalendarDays,
  Check,
  Clock,
  Gift,
  IdCard,
  Laptop,
  MapPin,
  Mic,
  Sparkles,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Container from "@/components/Container";
import Countdown from "@/components/Countdown";
import EventCard from "@/components/EventCard";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import {
  COMMUNITY_DAY_AGENDA,
  COMMUNITY_DAY_FAQS,
  COMMUNITY_DAY_META,
  COMMUNITY_DAY_PERKS,
  COMMUNITY_DAY_SPEAKERS,
  COMMUNITY_DAY_STEPS,
} from "@/data/community-day";
import { upcomingEvents } from "@/data/events";
import { SITE } from "@/lib/constants";
import CommunityDayRegisterModal from "@/components/CommunityDayRegisterModal";

export const metadata: Metadata = {
  title: "AWS Student Community Day SUIIT 2026 — Oct 3",
  description:
    "Free flagship meetup Oct 3 at SUIIT: Cloud, AI/GenAI + DevOps, hands-on labs, lunch, swag + certificate. Register on Meetup.",
  openGraph: {
    title: "AWS Student Community Day SUIIT 2026 — Oct 3",
    description:
      "Cloud, AI/GenAI + DevOps with AWS pros. Free for students — lunch, swag + certificate. APJ Abdul Kalam Auditorium, SUIIT.",
    type: "website",
  },
};

const whyAttend = [
  {
    icon: Sparkles,
    title: "Learn",
    description: "Cloud fundamentals to AI/GenAI + DevOps — sessions by AWS pros and community leaders.",
  },
  {
    icon: Laptop,
    title: "Build",
    description: "Hands-on labs and interactive activities. Bring a laptop if you can.",
  },
  {
    icon: Users,
    title: "Connect",
    description: "Network with 300+ students, developers and cloud enthusiasts.",
  },
  {
    icon: Award,
    title: "Grow",
    description: "Leave with swag, a participation certificate and new opportunities.",
  },
];

const bringList = [
  { icon: IdCard, text: "College ID (required at entry)" },
  { icon: Check, text: "Meetup RSVP confirmation on your phone" },
  { icon: Laptop, text: "Laptop (optional, for hands-on)" },
  { icon: Backpack, text: "Curiosity — no prior AWS experience needed" },
];

const perkIcons = [UtensilsCrossed, Gift, Award, Users];

export default function CommunityDayPage() {
  const related = upcomingEvents.filter((e) => e.id !== "aws-student-community-day-suiit-2026").slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: COMMUNITY_DAY_META.title,
    startDate: COMMUNITY_DAY_META.startIso,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: COMMUNITY_DAY_META.venueShort,
      address: COMMUNITY_DAY_META.address,
    },
    organizer: { "@type": "Organization", name: SITE.name },
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR", availability: "https://schema.org/InStock" },
    description:
      "Community-driven meetup: Cloud Computing, AI, Generative AI, DevOps and the AWS ecosystem at SUIIT.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO */}
      <section aria-labelledby="scd-heading" className="relative overflow-hidden">
        <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden />
        <div className="glow-brand absolute -top-24 left-1/2 h-96 w-[52rem] -translate-x-1/2" aria-hidden />
        <Container className="relative pb-16 pt-10 md:pb-24 md:pt-14">
          <Reveal>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Flagship session on October 3, free entry</Badge>
              <Badge tone="success">Registration open on Meetup</Badge>
            </div>
          </Reveal>
          <div className="mt-5 grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h1
                id="scd-heading"
                className="text-4xl font-bold leading-[1.05] tracking-tight text-cream md:text-6xl"
              >
                AWS Student Community Day SUIIT 2026
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-fog md:text-lg">
                A community-driven meetup bringing together students, developers
                and cloud enthusiasts — technical sessions, hands-on learning,
                real-world insights and networking on Cloud, AI, Generative AI,
                DevOps and the AWS ecosystem.
              </p>
              <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fog">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                  <dt className="sr-only">Date</dt>
                  <dd className="font-medium text-cream">{COMMUNITY_DAY_META.date}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                  <dt className="sr-only">Time</dt>
                  <dd>{COMMUNITY_DAY_META.time}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                  <dt className="sr-only">Venue</dt>
                  <dd>{COMMUNITY_DAY_META.venue}</dd>
                </div>
              </dl>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CommunityDayRegisterModal />
                <Button href="#agenda" variant="secondary">
                  View agenda
                </Button>
              </div>
              <p className="mt-4 text-xs text-faint">
                300 expected, lunch, swag and certificate, {COMMUNITY_DAY_META.host}
              </p>
            </div>
            <Reveal delay={0.12}>
              <div className="rounded-2xl border border-line bg-surface/80 p-6 backdrop-blur">
                <p className="text-sm font-semibold text-cream">
                  Countdown to October 3
                </p>
                <div className="mt-4">
                  <Countdown />
                </div>
                <ol className="mt-6 space-y-4">
                  {COMMUNITY_DAY_STEPS.map((s, i) => (
                    <li key={s.title} className="flex gap-3">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand"
                        aria-hidden
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-cream">{s.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-fog">{s.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <CommunityDayRegisterModal className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-brandhover">
                  RSVP — share details first
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </CommunityDayRegisterModal>
                <p className="mt-3 text-center text-xs text-faint">
                  30-sec form, then Meetup · show RSVP at entry
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* WHY ATTEND */}
      <section className="bg-coal py-16 md:py-24">
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Why attend"
            title="More than a meetup."
            description="Learn from experienced professionals, explore emerging tech, and meet 300+ fellow builders."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyAttend.map((c, i) => (
              <Reveal key={c.title} delay={Math.min(i * 0.07, 0.21)}>
                <article className="group h-full min-w-0 rounded-2xl border border-line bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/30 transition-transform duration-200 group-hover:scale-105">
                    <c.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-cream">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-fog">{c.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* AGENDA */}
      <section id="agenda" className="scroll-mt-20 py-16 md:py-24">
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Agenda (to be announced)"
            title="A full day of cloud."
            description="Timings follow the official Meetup (9 AM – 4 PM). Session titles marked TBA will be confirmed by organizers."
          />
          <h2 id="agenda-heading" className="sr-only">Agenda</h2>
          <ol className="relative space-y-4 border-l border-line pl-6 md:pl-8">
            {COMMUNITY_DAY_AGENDA.map((a, i) => (
              <Reveal key={a.time + a.title} delay={Math.min(i * 0.04, 0.2)}>
                <li className="relative rounded-2xl border border-line bg-surface p-5 transition-colors duration-200 hover:border-brand/40 md:p-6">
                  <span
                    className="absolute -left-[31px] top-6 h-3 w-3 rounded-full bg-brand md:-left-[39px]"
                    aria-hidden
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold tabular-nums text-cream">{a.time}</span>
                    {a.tag ? <Badge tone="neutral">{a.tag}</Badge> : null}
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-cream">{a.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-fog">{a.description}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* SPEAKERS */}
      <section className="bg-coal py-16 md:py-24">
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Speakers"
            title="Learn from practitioners."
            description="AWS professionals, community leaders and industry experts. Names will be announced — no placeholders, only confirmed speakers."
          />
          <h2 id="speakers-heading" className="sr-only">Speakers</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMMUNITY_DAY_SPEAKERS.map((s, i) => (
              <Reveal key={s.role} delay={Math.min(i * 0.07, 0.14)}>
                <article className="flex h-full flex-col items-center rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-ink text-faint">
                    <Mic className="h-6 w-6" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-cream">{s.role}</h3>
                  <p className="mt-1 text-xs font-medium text-fog">{s.focus}</p>
                  <p className="mt-2 text-sm text-faint">To be announced</p>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* PERKS + BRING */}
      <section className="py-16 md:py-24">
        <Container>
          <h2 id="perks-heading" className="sr-only">Perks and what to bring</h2>
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Included"
                title="Lunch, swag + certificate."
              />
              <ul className="grid gap-4 sm:grid-cols-2">
                {COMMUNITY_DAY_PERKS.map((p, i) => {
                  const Icon = perkIcons[i % perkIcons.length];
                  return (
                    <Reveal key={p.title} delay={Math.min(i * 0.06, 0.18)}>
                      <li className="h-full min-w-0 rounded-2xl border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                        <Icon className="h-5 w-5 text-brand" aria-hidden />
                        <p className="mt-3 text-sm font-semibold text-cream">{p.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-fog">{p.description}</p>
                      </li>
                    </Reveal>
                  );
                })}
              </ul>
            </div>
            <div>
              <SectionHeading
                align="left"
                eyebrow="Good to know"
                title="Who + what to bring."
              />
              <div className="rounded-2xl border border-line bg-surface p-6">
                <p className="text-sm leading-relaxed text-fog">
                  Perfect for students new to AWS/Cloud, devs, AI/ML + GenAI
                  enthusiasts, DevOps learners and open-source contributors.
                  No prior AWS experience required.
                </p>
                <ul className="mt-5 space-y-3">
                  {bringList.map((b) => (
                    <li key={b.text} className="flex items-center gap-3 text-sm text-cream">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-ink text-brand">
                        <b.icon className="h-4 w-4" aria-hidden />
                      </span>
                      {b.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* VENUE */}
      <section aria-labelledby="venue-heading" className="bg-coal py-16 md:py-24">
        <Container>
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-3 text-sm font-semibold text-cream">Venue</p>
              <h2 id="venue-heading" className="text-3xl font-bold tracking-tight text-cream md:text-4xl">
                {COMMUNITY_DAY_META.venueShort}
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-fog">
                {COMMUNITY_DAY_META.address}, {COMMUNITY_DAY_META.date},{" "}
                {COMMUNITY_DAY_META.time}, entry {COMMUNITY_DAY_META.entry}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button href={COMMUNITY_DAY_META.mapsUrl} external>
                Get directions
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
              <CommunityDayRegisterModal className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-cream transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/60 hover:bg-raised">
                Register on Meetup
                <ArrowRight className="h-4 w-4" aria-hidden />
              </CommunityDayRegisterModal>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading
            eyebrow="FAQ"
            title="Questions, answered."
            description="Still unsure? DM us on Instagram or ask at the venue help desk."
          />
          <h2 id="faq-heading" className="sr-only">Frequently asked questions</h2>
          <div className="mx-auto grid max-w-3xl gap-3">
            {COMMUNITY_DAY_FAQS.map((f, i) => (
              <Reveal key={f.q} delay={Math.min(i * 0.04, 0.2)}>
                <details className="group rounded-2xl border border-line bg-surface px-5 py-4 open:border-brand/40">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-cream">
                    {f.q}
                    <ArrowRight className="h-4 w-4 shrink-0 text-brand transition-transform group-open:rotate-90" aria-hidden />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-fog">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section aria-labelledby="register-heading" className="pb-16 md:pb-24">
        <Container>
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-brand/30 bg-surface px-6 py-14 text-center md:px-12">
              <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden />
              <div className="glow-brand absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/2" aria-hidden />
              <div className="relative">
                <p className="text-sm font-semibold text-cream">
                  October 3 at SUIIT, free for students
                </p>
                <h2 id="register-heading" className="mx-auto mt-3 max-w-xl text-3xl font-bold tracking-tight text-cream md:text-5xl">
                  See you at Community Day?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-fog">
                  RSVP on Meetup now — 300+ builders already in. Lunch, swag and
                  certificate for registered participants.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <CommunityDayRegisterModal />
                  <Button href={SITE.links.instagram} variant="secondary" external>
                    Follow on Instagram
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* RELATED */}
      <section aria-labelledby="related-heading" className="bg-coal py-16 md:py-24">
        <Container>
          <div className="mb-10">
            <p className="mb-3 text-sm font-semibold text-cream">Keep exploring</p>
            <h2 id="related-heading" className="text-3xl font-bold tracking-tight text-cream md:text-4xl">
              More events
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {related.map((event, i) => (
              <Reveal key={event.id} delay={Math.min(i * 0.08, 0.16)}>
                <EventCard event={event} compact />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
