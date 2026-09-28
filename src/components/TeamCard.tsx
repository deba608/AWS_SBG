"use client";

import { useEffect, useState } from "react";
import { initials } from "@/lib/utils";
import type { TeamMember } from "@/data/team";
import { cn } from "@/lib/utils";
import { LinkedinIcon } from "./icons";

export default function TeamCard({
  member,
  large = false,
}: {
  member: TeamMember;
  large?: boolean;
}) {
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
  }, [open ]);

  return (
    <article
      className={cn(
        "flex min-w-0 gap-4 sm:gap-5",
        large ? "py-6 md:py-7" : "py-5"
      )}
    >
      {showPhoto ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`View photo of ${member.name}`}
            className={cn(
              "shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-line bg-coal transition-colors hover:border-brand/60",
              large ? "h-20 w-20" : "h-11 w-11"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={member.photo as string}
              alt={member.name}
              width={large ? 160 : 88}
              height={large ? 160 : 88}
              loading="lazy"
              onError={() => setFailed(true)}
              className="h-full w-full object-cover"
            />
          </button>
          {open ? (
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
                  className="mx-auto mt-3 flex min-h-[44px] items-center rounded-full border border-line px-6 py-2 text-sm text-fog transition-colors hover:text-cream"
                >
                  Close
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div
          aria-hidden
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg border border-line bg-coal font-bold text-cream",
            large ? "h-20 w-20 text-lg" : "h-11 w-11 text-sm"
          )}
        >
          {initials(member.name)}
        </div>
      )}
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
        {member.linkedin ? (
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
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
          </div>
        ) : null}
      </div>
    </article>
  );
}
