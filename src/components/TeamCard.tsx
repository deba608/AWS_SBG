"use client";

import { useEffect, useState } from "react";
import { initials } from "@/lib/utils";
import type { TeamMember } from "@/data/team";
import { cn } from "@/lib/utils";
import { LinkedinIcon, GithubIcon, MailIcon } from "./icons";

export default function TeamCard({ member }: { member: TeamMember }) {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const showPhoto = Boolean(member.photo) && !failed;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const hasLinks = Boolean(member.linkedin || member.github || member.email);

  return (
    <article className="rank-card group min-w-0 overflow-hidden">
      <div className="relative aspect-square w-full overflow-hidden bg-coal">
        {showPhoto ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`View photo of ${member.name}`}
            className="block h-full w-full cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={member.photo as string}
              alt={member.name}
              loading="lazy"
              onError={() => setFailed(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </button>
        ) : (
          <div
            aria-hidden
            className="flex h-full w-full items-center justify-center text-3xl font-bold text-cream"
          >
            {initials(member.name)}
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h3
          title={member.name}
          className="truncate text-sm font-semibold leading-snug text-cream"
        >
          {member.name}
        </h3>
        <p className="mt-0.5 truncate text-xs font-medium text-brand">{member.role}</p>
        {hasLinks ? (
          <div className="mt-1 flex items-center gap-1">
            {member.linkedin ? (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on LinkedIn`}
                title="LinkedIn"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-faint transition-colors hover:bg-white/5 hover:text-cream"
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
                title="GitHub"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-faint transition-colors hover:bg-white/5 hover:text-cream"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
            ) : null}
            {member.email ? (
              <a
                href={`mailto:${member.email}`}
                aria-label={`Email ${member.name}`}
                title="Email"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-faint transition-colors hover:bg-white/5 hover:text-cream"
              >
                <MailIcon className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
      {open && showPhoto ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo of ${member.name}`}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[85dvh] w-auto max-w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={member.photo as string}
              alt={member.name}
              className="max-h-[70dvh] w-auto max-w-full rounded-2xl border border-line object-contain shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
            />
            <p className="mt-3 text-center text-sm font-semibold text-cream">
              {member.name} · {member.role}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn(
                "mx-auto mt-3 flex min-h-[44px] items-center rounded-full border border-line px-6 py-2 text-sm text-fog transition-colors hover:text-cream",
              )}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
