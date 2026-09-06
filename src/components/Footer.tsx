import { Cloud, MessageCircle } from "lucide-react";
import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { GithubIcon, InstagramIcon, LinkedinIcon } from "./icons";

const socials = [
  { label: "GitHub", href: SITE.links.github, Icon: GithubIcon },
  { label: "LinkedIn", href: SITE.links.linkedin, Icon: LinkedinIcon },
  { label: "Instagram", href: SITE.links.instagram, Icon: InstagramIcon },
  { label: "Discord", href: SITE.links.discord, Icon: MessageCircle },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-coal">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-black">
              <Cloud className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-sm font-bold text-cream">
              AWS Student Builder Group
            </span>
          </div>
          <p className="mt-1 text-sm text-faint">{SITE.collegeName}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-fog">
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-fog transition-colors hover:border-brand/60 hover:text-cream"
              >
                <Icon className="h-4 w-4" aria-hidden />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-cream">
            Explore
          </h2>
          <ul className="mt-4 space-y-2.5">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-fog transition-colors hover:text-brand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-cream">
            Community
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-fog">
            <li>
              <a href={SITE.links.join} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-brand">
                Join the community
              </a>
            </li>
            <li>
              <Link href="/events" className="transition-colors hover:text-brand">
                Upcoming events
              </Link>
            </li>
            <li>
              <Link href="/projects" className="transition-colors hover:text-brand">
                Student projects
              </Link>
            </li>
            <li>
              <Link href="/learning" className="transition-colors hover:text-brand">
                Learning paths
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-faint sm:flex-row md:px-8">
          <p>© 2026 AWS Student Builder Group · {SITE.collegeName}</p>
          <p className="font-mono">Learn → Build → Deploy → Connect</p>
        </div>
      </div>
    </footer>
  );
}
