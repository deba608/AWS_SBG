"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { TeamMember } from "@/data/team";
import { cn, initials } from "@/lib/utils";
import { LinkedinIcon, GithubIcon, MailIcon } from "./icons";

interface TeamExplorerProps {
  teamLeads: TeamMember[];
  domainLeads: TeamMember[];
  opsTeam: TeamMember[];
  coordinators: TeamMember[];
}

export default function TeamExplorer({
  teamLeads,
  domainLeads,
  opsTeam,
  coordinators,
}: TeamExplorerProps) {
  const [previewMember, setPreviewMember] = useState<TeamMember | null>(null);

  // Close lightbox on Escape
  useEffect(() => {
    if (!previewMember) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewMember(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [previewMember]);

  return (
    <div className="w-full">
      {/* Main Content Area */}
      <div className="space-y-10 sm:space-y-20">
          
          <section aria-labelledby="section-leadership">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 sm:mb-6">
              <div className="min-w-0">
                <h2
                  id="section-leadership"
                  className="text-xl font-bold tracking-tight text-cream sm:text-3xl"
                >
                  Leadership Team
                </h2>
              </div>
              <span className="shrink-0 text-xs font-mono text-faint">
                {teamLeads.length} Leaders
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {teamLeads.map((member) => (
                <BuilderCard
                  key={member.id}
                  member={member}
                  isLead
                  onPhotoClick={() => member.photo && setPreviewMember(member)}
                />
              ))}
            </div>
          </section>

          {/* 2. Technical Domain Leads */}
          <section aria-labelledby="section-domain">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-t border-line/60 pt-8 sm:mb-6 sm:pt-14">
              <div className="min-w-0">
                <span className="text-[11px] font-mono tracking-wider uppercase text-brand">
                  {"// Specializations & Labs"}
                </span>
                <h2
                  id="section-domain"
                  className="mt-1 text-xl font-bold tracking-tight text-cream sm:text-3xl"
                >
                  Technical Domain Leads
                </h2>
              </div>
              <span className="shrink-0 text-xs font-mono text-faint">
                {domainLeads.length} Leads
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {domainLeads.map((member) => (
                <BuilderCard
                  key={member.id}
                  member={member}
                  onPhotoClick={() => member.photo && setPreviewMember(member)}
                />
              ))}
            </div>
          </section>

          {/* 3. Operations, PR & Media */}
          <section aria-labelledby="section-ops">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-t border-line/60 pt-8 sm:mb-6 sm:pt-14">
              <div className="min-w-0">
                <span className="text-[11px] font-mono tracking-wider uppercase text-brand">
                  {"// Community Engine"}
                </span>
                <h2
                  id="section-ops"
                  className="mt-1 text-xl font-bold tracking-tight text-cream sm:text-3xl"
                >
                  Events, PR & Media
                </h2>
              </div>
              <span className="shrink-0 text-xs font-mono text-faint">
                {opsTeam.length} Members
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {opsTeam.map((member) => (
                <BuilderCard
                  key={member.id}
                  member={member}
                  onPhotoClick={() => member.photo && setPreviewMember(member)}
                />
              ))}
            </div>
          </section>

          {/* 4. Coordinators */}
          <section aria-labelledby="section-coordinators">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-t border-line/60 pt-8 sm:mb-6 sm:pt-14">
              <div className="min-w-0">
                <span className="text-[11px] font-mono tracking-wider uppercase text-brand">
                  {"// Execution & Support"}
                </span>
                <h2
                  id="section-coordinators"
                  className="mt-1 text-xl font-bold tracking-tight text-cream sm:text-3xl"
                >
                  Coordinators
                </h2>
              </div>
              <span className="shrink-0 text-xs font-mono text-faint">
                {coordinators.length} Coordinators
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {coordinators.map((member) => (
                <BuilderCard
                  key={member.id}
                  member={member}
                  onPhotoClick={() => member.photo && setPreviewMember(member)}
                />
              ))}
            </div>
          </section>
      </div>

      {/* Lightbox Photo Preview Modal */}
      <AnimatePresence>
        {previewMember && previewMember.photo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Photo of ${previewMember.name}`}
            onClick={() => setPreviewMember(null)}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative my-auto max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-line/80 bg-surface p-4 shadow-[0_24px_70px_rgba(0,0,0,0.8)] sm:p-6"
            >
              <button
                type="button"
                onClick={() => setPreviewMember(null)}
                aria-label="Close photo preview"
                className="absolute right-4 top-4 rounded-full bg-coal/80 p-2 text-fog hover:text-cream transition-colors border border-line/60"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="aspect-square w-full overflow-hidden rounded-xl border border-line/60 bg-coal">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewMember.photo}
                  alt={previewMember.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="mt-4 text-center">
                <span className="inline-block rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold text-brand border border-brand/30">
                  {previewMember.role}
                </span>
                <h3 className="mt-2 text-xl font-bold text-cream">
                  {previewMember.name}
                </h3>
                <p className="mt-2 text-xs text-fog leading-relaxed">
                  {previewMember.bio}
                </p>

                {(previewMember.linkedin || previewMember.github || previewMember.email) && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-line/50 pt-4">
                    {previewMember.linkedin && (
                      <a
                        href={previewMember.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line/60 bg-coal px-3 py-1.5 text-xs text-fog hover:border-brand hover:text-cream transition-colors"
                      >
                        <LinkedinIcon className="h-3.5 w-3.5 text-brand" />
                        LinkedIn
                      </a>
                    )}
                    {previewMember.github && (
                      <a
                        href={previewMember.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line/60 bg-coal px-3 py-1.5 text-xs text-fog hover:border-brand hover:text-cream transition-colors"
                      >
                        <GithubIcon className="h-3.5 w-3.5 text-cream" />
                        GitHub
                      </a>
                    )}
                    {previewMember.email && (
                      <a
                        href={`mailto:${previewMember.email}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line/60 bg-coal px-3 py-1.5 text-xs text-fog hover:border-brand hover:text-cream transition-colors"
                      >
                        <MailIcon className="h-3.5 w-3.5 text-brand" />
                        Email
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Individual Builder Card Component — follows rank-card language:
 *  14px radius, hairline line border, surface bg, neutral lift shadow.
 *  Leads get a pill badge, not a whole mismatched brand border. */
function BuilderCard({
  member,
  isLead = false,
  onPhotoClick,
}: {
  member: TeamMember;
  isLead?: boolean;
  onPhotoClick: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = Boolean(member.photo) && !imgFailed;
  const hasLinks = Boolean(member.linkedin || member.github || member.email);

  return (
    <article
      className={cn(
        "rank-card group min-w-0 touch-manipulation overflow-hidden transition-all duration-300",
        "sm:hover:-translate-y-1 sm:hover:border-brand/50 sm:hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] sm:focus-within:-translate-y-1 sm:focus-within:border-brand/50"
      )}
    >
      {/* Photo */}
      <div className="relative aspect-square w-full overflow-hidden bg-coal">
        {showPhoto ? (
          <button
            type="button"
            onClick={onPhotoClick}
            aria-label={`View photo of ${member.name}`}
            className="block h-full w-full cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={member.photo}
              alt={member.name}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover transition-all duration-500 sm:grayscale sm:group-hover:scale-[1.03] sm:group-hover:grayscale-0"
            />
          </button>
        ) : (
          <div
            aria-hidden
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/20 via-coal to-surface text-3xl font-bold text-cream sm:text-4xl"
          >
            {initials(member.name)}
          </div>
        )}
        {isLead ? (
          <span className="absolute left-2.5 top-2.5 rounded-full border border-brand/30 bg-black/60 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-brand backdrop-blur-sm">
            Lead
          </span>
        ) : null}
      </div>

      {/* Body — always visible, no hover-gated text */}
      <div className="border-t border-line/60 p-3 sm:p-4">
        <h3
          title={member.name}
          className="truncate text-sm font-semibold leading-snug text-cream"
        >
          {member.name}
        </h3>
        <p className="mt-0.5 truncate text-xs font-medium text-brand">{member.role}</p>
        {hasLinks ? (
          <div className="mt-2 flex items-center gap-1">
            {member.linkedin ? (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on LinkedIn`}
                title="LinkedIn"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-faint transition-colors touch-manipulation hover:border-brand/50 hover:bg-white/5 hover:text-cream"
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-faint transition-colors touch-manipulation hover:border-brand/50 hover:bg-white/5 hover:text-cream"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
            ) : null}
            {member.email ? (
              <a
                href={`mailto:${member.email}`}
                aria-label={`Email ${member.name}`}
                title="Email"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-faint transition-colors touch-manipulation hover:border-brand/50 hover:bg-white/5 hover:text-cream"
              >
                <MailIcon className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
