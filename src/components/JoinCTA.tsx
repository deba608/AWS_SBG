import { ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import Button from "./Button";
import Container from "./Container";
import Reveal from "./Reveal";
import { SITE } from "@/lib/constants";
import { GithubIcon, InstagramIcon, LinkedinIcon } from "./icons";

const channels = [
  { label: "Discord", href: SITE.links.discord, Icon: MessageCircle },
  { label: "GitHub", href: SITE.links.github, Icon: GithubIcon },
  { label: "LinkedIn", href: SITE.links.linkedin, Icon: LinkedinIcon },
  { label: "Instagram", href: SITE.links.instagram, Icon: InstagramIcon },
];

export default function JoinCTA() {
  return (
    <section aria-labelledby="join-heading" className="py-16 md:py-24">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-14 text-center md:px-12 md:py-20">
            <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden />
            <div className="glow-brand absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/2" aria-hidden />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Join the community
              </p>
              <h2 id="join-heading" className="mx-auto mt-3 max-w-xl text-3xl font-bold tracking-tight text-cream md:text-5xl">
                Ready to build something?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-fog md:text-lg">
                Whether you&apos;re taking your first step into cloud or already
                deploying applications, there&apos;s a place for you here.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href={SITE.links.join} external>
                  Join {SITE.shortName}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
                <Button href="/events" variant="secondary">
                  Explore Events
                </Button>
              </div>
              <ul className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Community channels">
                {channels.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-ink/60 px-4 py-2 text-sm font-medium text-fog transition-colors hover:border-brand/60 hover:text-cream"
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
