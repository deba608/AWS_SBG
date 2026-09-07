import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import {
  InstagramIcon,
  LinkedinIcon,
  Logo,
  MailIcon,
  WhatsAppIcon,
} from "./icons";

const socials = [
  { label: "WhatsApp", href: SITE.links.whatsapp, Icon: WhatsAppIcon },
  { label: "LinkedIn", href: SITE.links.linkedin, Icon: LinkedinIcon },
  { label: "Instagram", href: SITE.links.instagram, Icon: InstagramIcon },
  { label: "Email", href: SITE.links.email, Icon: MailIcon },
];

const communityLinks = [
  {
    label: "Community Day — Oct 3",
    href: "/events/aws-student-community-day-suiit-2026",
    external: false,
    highlight: true,
  },
  {
    label: "Join WhatsApp channel",
    href: SITE.links.join,
    external: true,
    highlight: false,
  },
  { label: "Upcoming events", href: "/events", external: false, highlight: false },
  { label: "Meet the team", href: "/team", external: false, highlight: false },
] as const;

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-coal">
      <div className="glow-brand pointer-events-none absolute -top-32 left-1/2 h-64 w-[42rem] -translate-x-1/2" aria-hidden />
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-5 py-8 sm:gap-10 md:grid-cols-[1.4fr_1fr_1fr] md:px-8 md:py-16">
        <div className="col-span-2 min-w-0 md:col-span-1">
          <div className="flex min-h-[44px] items-center gap-3">
            <Logo />
            <span className="leading-snug">
              <span className="block text-sm font-semibold text-cream">
                AWS Student Builder Group
              </span>
              <span className="block text-xs font-normal text-faint">
                <span className="md:hidden">{SITE.collegeShortName}</span>
                <span className="hidden md:inline">{SITE.collegeName}</span>
              </span>
            </span>
          </div>
          <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-fog">
            {SITE.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("mailto:") ? undefined : "_blank"}
                rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                aria-label={`${SITE.name} on ${label}`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line text-fog transition-colors hover:border-brand/50 hover:text-cream"
              >
                <Icon className="h-4 w-4" aria-hidden />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">
            Explore
          </h2>
          <ul className="mt-3 space-y-0">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-[40px] items-center text-sm text-fog transition-colors hover:text-brand md:min-h-[44px]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">
            Community
          </h2>
          <ul className="mt-4 space-y-1 text-sm">
            {communityLinks.map((link) =>
              link.external ? (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-1 text-fog transition-colors hover:text-brand"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </li>
              ) : (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={`inline-flex min-h-[44px] items-center gap-1.5 transition-colors hover:text-brand ${
                      link.highlight ? "font-semibold text-brand" : "text-fog"
                    }`}
                  >
                    {link.highlight ? (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                    ) : null}
                    {link.label}
                  </Link>
                </li>
              )
            )}
            <li>
              <a
                href={SITE.links.email}
                className="inline-flex min-h-[44px] items-center text-fog transition-colors [overflow-wrap:anywhere] hover:text-brand"
              >
                {SITE.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-line">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-1.5 px-5 py-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p>
            © 2026 AWS Student Builder Group,{" "}
            <span className="md:hidden">{SITE.collegeShortName}</span>
            <span className="hidden md:inline">{SITE.collegeName}</span>
          </p>
          <p className="font-mono">{SITE.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
