import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { GithubIcon, InstagramIcon, LinkedinIcon, Logo } from "./icons";

const socials = [
  { label: "GitHub", href: SITE.links.github, Icon: GithubIcon },
  { label: "LinkedIn", href: SITE.links.linkedin, Icon: LinkedinIcon },
  { label: "Instagram", href: SITE.links.instagram, Icon: InstagramIcon },
  { label: "Discord", href: SITE.links.discord, Icon: MessageCircle },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-coal">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-4 pt-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <div className="flex min-h-[44px] items-center gap-3">
            <Logo />
            <span className="leading-snug">
              <span className="block text-sm font-semibold text-cream">
                AWS Student Builder Group
              </span>
              <span className="block text-xs font-normal text-faint">
                {SITE.collegeName}
              </span>
            </span>
          </div>
          <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-fog">
            {SITE.description}
          </p>
          <div className="mt-5 flex items-center gap-2">
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${SITE.name} on ${label}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-fog transition-colors hover:border-faint hover:text-cream"
              >
                <Icon className="h-4 w-4" aria-hidden />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-sm font-medium text-faint">Explore</h2>
          <ul className="mt-4 space-y-2.5">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-fog transition-colors hover:text-cream"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-medium text-faint">Community</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-fog">
            <li>
              <a href={SITE.links.join} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-cream">
                Join the community
              </a>
            </li>
            <li>
              <Link href="/events" className="transition-colors hover:text-cream">
                Upcoming events
              </Link>
            </li>
            <li>
              <Link href="/team" className="transition-colors hover:text-cream">
                Meet the team
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none select-none overflow-hidden">
        <p className="-mb-5 text-center text-[19vw] font-semibold leading-[0.85] tracking-tight text-white/[0.025] md:-mb-8 md:text-[11rem]">
          Builders
        </p>
      </div>
      <div className="relative border-t border-line">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p>© 2026 AWS Student Builder Group, {SITE.collegeName}</p>
          <p>Learn, build, deploy, and connect.</p>
        </div>
      </div>
    </footer>
  );
}
