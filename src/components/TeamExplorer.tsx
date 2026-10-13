"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil } from "lucide-react";
import type { TeamMember } from "@/data/team";
import type { TeamSubmission } from "@/lib/team-store";
import { cn, initials } from "@/lib/utils";
import { LinkedinIcon, GithubIcon, MailIcon } from "./icons";
import type { QuickEditMeta } from "./TeamQuickEdit";

// Admin editor is heavy (cropper/canvas) — load only when an admin taps edit.
const TeamQuickEdit = dynamic(() => import("./TeamQuickEdit"), { ssr: false });

interface TeamExplorerProps {
  teamLeads: TeamMember[];
  domainLeads: TeamMember[];
  opsTeam: TeamMember[];
  coordinators: TeamMember[];
  /** Full-admin session (server-checked) — shows inline edit buttons on cards. */
  adminMode?: boolean;
}

interface AdminList {
  subs: TeamSubmission[];
  meta: QuickEditMeta;
}

export default function TeamExplorer({
  teamLeads,
  domainLeads,
  opsTeam,
  coordinators,
  adminMode = false,
}: TeamExplorerProps) {
  const [previewMember, setPreviewMember] = useState<TeamMember | null>(null);
  const [adminList, setAdminList] = useState<AdminList | null>(null);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [isAdmin, setIsAdmin] = useState(adminMode);

  const loadAdminList = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/team", { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      setAdminList({
        subs: (d.submissions ?? []) as TeamSubmission[],
        meta: {
          members: Array.isArray(d.meta?.members) ? d.meta.members : [],
          roles: Array.isArray(d.meta?.roles) ? d.meta.roles : [],
        },
      });
      setIsAdmin(true);
    } catch {
      // Not authed or offline — cards simply render without edit buttons.
    }
  }, []);

  useEffect(() => {
    // Static page: detect admin session client-side (one cheap probe).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAdminList();
  }, [loadAdminList]);

  // Latest submission for a live card (approved first) — pre-fills quick edit.
  function subFor(member: TeamMember): TeamSubmission | null {
    if (!adminList) return null;
    const norm = member.name.trim().toLowerCase();
    const matches = adminList.subs.filter((s) => s.name.trim().toLowerCase() === norm);
    if (matches.length === 0) return null;
    const approved = matches.filter((s) => s.status === "approved");
    const pool = approved.length > 0 ? approved : matches;
    return [...pool].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0] ?? null;
  }

  const editFor = (member: TeamMember) =>
    adminList ? () => setEditing(member) : undefined;

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
      {isAdmin && adminList ? (
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand">
          <Pencil className="h-3.5 w-3.5" aria-hidden /> Admin mode — tap the pencil on any card to edit inline
        </p>
      ) : null}
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
              {teamLeads.map((member, i) => (
                <BuilderCard
                  key={member.id}
                  member={member}
                  isLead
                  priority={i < 4}
                  onPhotoClick={() => member.photo && setPreviewMember(member)}
                  onEdit={editFor(member)}
                />
              ))}
            </div>
          </section>

          {/* 2. Technical Domain Leads */}
          <section aria-labelledby="section-domain" style={{ contentVisibility: "auto", containIntrinsicSize: "800px" }}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-t border-line/60 pt-8 sm:mb-6 sm:pt-14">
              <div className="min-w-0">
                <span className="text-[11px] font-mono tracking-wider uppercase text-brand">
                  {"// Specializations & Labs"}
                </span>
                <h2
                  id="section-domain"
                  className="mt-1 text-xl font-bold tracking-tight text-cream sm:text-3xl"
                >
                  Technical & Domain Leads
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
                  onEdit={editFor(member)}
                />
              ))}
            </div>
          </section>

          {/* 3. Operations, PR & Media */}
          <section aria-labelledby="section-ops" style={{ contentVisibility: "auto", containIntrinsicSize: "800px" }}>
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
                  onEdit={editFor(member)}
                />
              ))}
            </div>
          </section>

          {/* 4. Coordinators */}
          <section aria-labelledby="section-coordinators" style={{ contentVisibility: "auto", containIntrinsicSize: "600px" }}>
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
                  onEdit={editFor(member)}
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

              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-line/60 bg-coal">
                {previewMember.photo.startsWith("data:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewMember.photo}
                    alt={previewMember.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={previewMember.photo}
                    alt={previewMember.name}
                    width={800}
                    height={800}
                    sizes="(max-width: 640px) 90vw, 448px"
                    className="h-full w-full object-cover"
                  />
                )}
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

      {/* Admin quick edit — direct modification from /team */}
      {editing && adminList ? (
        <TeamQuickEdit
          member={editing}
          submission={subFor(editing)}
          meta={adminList.meta}
          onClose={() => setEditing(null)}
          onSaved={() => void loadAdminList()}
        />
      ) : null}
    </div>
  );
}

/** Individual Builder Card — rank-card border + slide-up detail sheet.
 *  Name/role always visible; links rise from bottom on hover (desktop),
 *  focus, or tap (touch). Photos served via next/image (WebP/AVIF). */
function BuilderCard({
  member,
  isLead = false,
  priority = false,
  onPhotoClick,
  onEdit,
}: {
  member: TeamMember;
  isLead?: boolean;
  priority?: boolean;
  onPhotoClick: () => void;
  onEdit?: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [peek, setPeek] = useState(false);
  const showPhoto = Boolean(member.photo) && !imgFailed;
  const isDataUrl = member.photo?.startsWith("data:") ?? false;
  const hasLinks = Boolean(member.linkedin || member.github || member.email);

  function handlePhotoActivate(e: React.SyntheticEvent) {
    if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches && !peek) {
      e.preventDefault();
      setPeek(true);
      return;
    }
    onPhotoClick();
  }

  return (
    <article
      data-peek={peek}
      className={cn(
        "rank-card group relative min-w-0 touch-manipulation overflow-hidden transition-all duration-300",
        "focus-within:border-brand/60 focus-within:shadow-[0_0_0_1px_rgba(173,92,255,0.4),0_12px_32px_rgba(0,0,0,0.35)]",
        "sm:hover:-translate-y-1 sm:hover:border-brand/50 sm:hover:shadow-[0_12px_32px_rgba(0,0,0,0.35),0_0_24px_rgba(173,92,255,0.15)] sm:focus-within:-translate-y-1",
        isLead && "border-brand/25 bg-gradient-to-b from-brand/[0.07] to-transparent"
      )}
    >
      {/* Lead accent hairline */}
      {isLead ? (
        <div aria-hidden className="absolute inset-x-0 top-0 z-10 h-[2px] bg-gradient-to-r from-transparent via-brand/70 to-transparent" />
      ) : null}
      {/* Photo */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-coal sm:aspect-square">
        {showPhoto ? (
          <button
            type="button"
            onClick={handlePhotoActivate}
            aria-label={`View photo of ${member.name}`}
            aria-expanded={peek}
            className="relative block h-full w-full cursor-pointer"
          >
            {isDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.photo}
                alt={member.name}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                onError={() => setImgFailed(true)}
                className={cn("h-full w-full object-cover transition-all duration-500 sm:grayscale sm:group-hover:scale-[1.04] sm:group-hover:grayscale-0 sm:group-focus-within:scale-[1.04] sm:group-focus-within:grayscale-0", peek && "scale-[1.02] grayscale-0 sm:scale-[1.04]")}
              />
            ) : (
              <Image
                src={member.photo as string}
                alt={member.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "low"}
                onError={() => setImgFailed(true)}
                className={cn("object-cover transition-all duration-500 sm:grayscale sm:group-hover:scale-[1.04] sm:group-hover:grayscale-0 sm:group-focus-within:scale-[1.04] sm:group-focus-within:grayscale-0", peek && "scale-[1.02] grayscale-0 sm:scale-[1.04]")}
              />
            )}
          </button>
        ) : (
          <div
            aria-hidden
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/25 via-coal to-surface text-3xl font-bold text-cream sm:text-4xl"
          >
            {initials(member.name)}
          </div>
        )}
        {onEdit ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label={`Edit ${member.name}`}
            title="Edit member (admin)"
            className="absolute right-2.5 top-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand/50 bg-black/70 text-brand backdrop-blur-sm transition-colors hover:bg-brand hover:text-black"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
        {/* Readability shade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/55 to-transparent"
        />

        {/* Detail sheet — name + role always visible, links rise on hover */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="p-2.5 sm:p-3.5">
            <h3
              title={member.name}
              className="truncate text-[13px] font-semibold leading-snug text-cream drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] sm:text-sm"
            >
              {member.name}
            </h3>
            <p className="mt-0.5 truncate text-[11px] font-medium text-brand drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] sm:text-xs">
              {member.role}
            </p>

            {/* Rising detail: links only */}
            <div
              className={cn(
                "grid grid-rows-[0fr] opacity-0 transition-all duration-300 ease-out",
                "sm:group-hover:grid-rows-[1fr] sm:group-hover:opacity-100 sm:group-focus-within:grid-rows-[1fr] sm:group-focus-within:opacity-100",
                peek && "grid-rows-[1fr] opacity-100"
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div className={cn("translate-y-3 transition-transform duration-300 ease-out sm:group-hover:translate-y-0 sm:group-focus-within:translate-y-0", peek && "translate-y-0")}>
                  <div className="mt-2 flex items-center gap-1">
                    {hasLinks ? (
                      <div className="flex items-center gap-1">
                        {member.linkedin ? (
                          <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${member.name} on LinkedIn`}
                            title="LinkedIn"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-cream transition-colors touch-manipulation hover:bg-brand hover:text-black sm:h-9 sm:w-9"
                          >
                            <LinkedinIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </a>
                        ) : null}
                        {member.github ? (
                          <a
                            href={member.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${member.name} on GitHub`}
                            title="GitHub"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-cream transition-colors touch-manipulation hover:bg-brand hover:text-black sm:h-9 sm:w-9"
                          >
                            <GithubIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </a>
                        ) : null}
                        {member.email ? (
                          <a
                            href={`mailto:${member.email}`}
                            aria-label={`Email ${member.name}`}
                            title="Email"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-cream transition-colors touch-manipulation hover:bg-brand hover:text-black sm:h-9 sm:w-9"
                          >
                            <MailIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Progress hairline — fills on expand */}
          <div
            aria-hidden
            className={cn(
              "h-0.5 w-full origin-left scale-x-0 bg-brand transition-transform duration-300",
              "sm:group-hover:scale-x-100 sm:group-focus-within:scale-x-100",
              peek && "scale-x-100"
            )}
          />
        </div>
      </div>
    </article>
  );
}
