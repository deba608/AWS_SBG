import { initials } from "@/lib/utils";
import type { TeamMember } from "@/data/team";
import { cn } from "@/lib/utils";
import { GithubIcon, LinkedinIcon } from "./icons";

export default function TeamCard({
  member,
  large = false,
}: {
  member: TeamMember;
  large?: boolean;
}) {
  return (
    <article
      className={cn(
        "flex min-w-0 gap-4 sm:gap-5",
        large ? "py-6 md:py-7" : "py-5"
      )}
    >
      <div
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg border border-line bg-coal font-bold text-cream",
          large ? "h-14 w-14 text-base" : "h-11 w-11 text-sm"
        )}
      >
        {initials(member.name)}
      </div>
      <div className="min-w-0 flex-1">
        <h3
          className={cn(
            "font-semibold leading-snug text-cream [overflow-wrap:anywhere]",
            large ? "text-lg md:text-xl" : "text-base"
          )}
        >
          {member.name}
        </h3>
        <p className="mt-0.5 text-sm font-medium text-brand">{member.role}</p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-fog [overflow-wrap:anywhere]">
          {member.bio}
        </p>
        {member.linkedin || member.github ? (
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
            {member.linkedin ? (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on LinkedIn`}
                className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-faint transition-colors hover:text-cream"
              >
                <LinkedinIcon className="h-4 w-4" />
                LinkedIn
              </a>
            ) : null}
            {member.github ? (
              <a
                href={member.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on GitHub`}
                className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-faint transition-colors hover:text-cream"
              >
                <GithubIcon className="h-4 w-4" />
                GitHub
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
