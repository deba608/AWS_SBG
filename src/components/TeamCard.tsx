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
        "flex h-full min-w-0 flex-col rounded-2xl border border-line bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)]",
        large ? "p-6 md:p-7" : "p-5"
      )}
    >
      <div className="w-fit rounded-2xl bg-gradient-to-br from-brand/60 via-brand/10 to-transparent p-[1.5px]">
        <div
          aria-hidden
          className={cn(
            "flex items-center justify-center rounded-[14px] bg-gradient-to-br from-raised to-coal font-mono font-bold text-brand",
            large ? "h-20 w-20 text-2xl" : "h-14 w-14 text-lg"
          )}
        >
          {initials(member.name)}
        </div>
      </div>
      <h3
        className={cn(
          "mt-4 font-semibold text-cream",
          large ? "text-xl" : "text-base"
        )}
      >
        {member.name}
      </h3>
      <p className="mt-0.5 text-sm font-medium text-brand">{member.role}</p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-fog">
        {member.bio}
      </p>
      <div className="mt-4 flex items-center gap-2">
        {member.linkedin ? (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${member.name} on LinkedIn`}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-line text-fog transition-colors hover:border-brand/60 hover:text-cream"
          >
            <LinkedinIcon className="h-4 w-4" />
          </a>
        ) : null}
        {member.github ? (
          <a
            href={member.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${member.name} on GitHub`}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-line text-fog transition-colors hover:border-brand/60 hover:text-cream"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
