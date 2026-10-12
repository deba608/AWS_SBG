"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Sparkles,
  Compass,
  ZoomIn,
  Filter,
} from "lucide-react";
import type { TeamMember } from "@/data/team";
import { cn, initials } from "@/lib/utils";
import { LinkedinIcon, GithubIcon, MailIcon } from "./icons";

interface TeamExplorerProps {
  teamLeads: TeamMember[];
  domainLeads: TeamMember[];
  opsTeam: TeamMember[];
  coordinators: TeamMember[];
}

type TabKey = "all" | "leadership" | "domain" | "ops" | "coordinators";

interface TabOption {
  key: TabKey;
  label: string;
  badge: number;
}

function getDomainCategory(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("web")) return "Web Dev";
  if (r.includes("ai") || r.includes("ml")) return "AI-ML";
  if (r.includes("cloud")) return "Cloud & DevOps";
  if (r.includes("cyber") || r.includes("security")) return "Cybersecurity";
  if (r.includes("android") || r.includes("mobile")) return "Android";
  if (r.includes("data")) return "Data Analytics";
  if (r.includes("iiot")) return "IIoT & Edge";
  if (r.includes("iot")) return "IoT & Hardware";
  if (r.includes("event")) return "Events";
  if (r.includes("social")) return "Social Media";
  if (r.includes("pr") || r.includes("public")) return "PR & Outreach";
  if (r.includes("visual") || r.includes("media") || r.includes("design")) return "Visual Media";
  if (r.includes("leader") || r.includes("president") || r.includes("secretary") || r.includes("executive"))
    return "Leadership";
  if (r.includes("ordinat")) return "Coordination";
  return "General";
}

export default function TeamExplorer({
  teamLeads,
  domainLeads,
  opsTeam,
  coordinators,
}: TeamExplorerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
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

  // Combine lists with section markers
  const allMembers = useMemo(() => {
    return [
      ...teamLeads.map((m) => ({ ...m, sectionKey: "leadership" as TabKey })),
      ...domainLeads.map((m) => ({ ...m, sectionKey: "domain" as TabKey })),
      ...opsTeam.map((m) => ({ ...m, sectionKey: "ops" as TabKey })),
      ...coordinators.map((m) => ({ ...m, sectionKey: "coordinators" as TabKey })),
    ];
  }, [teamLeads, domainLeads, opsTeam, coordinators]);

  // Domain tags available for the current tab
  const domainTags = useMemo(() => {
    let source = allMembers;
    if (activeTab === "leadership") source = allMembers.filter((m) => m.sectionKey === "leadership");
    else if (activeTab === "domain") source = allMembers.filter((m) => m.sectionKey === "domain");
    else if (activeTab === "ops") source = allMembers.filter((m) => m.sectionKey === "ops");
    else if (activeTab === "coordinators") source = allMembers.filter((m) => m.sectionKey === "coordinators");

    const domains = Array.from(new Set(source.map((m) => getDomainCategory(m.role)))).filter(Boolean);
    return ["All", ...domains];
  }, [allMembers, activeTab]);

  // Derive domain filter selection without setState in effect
  const effectiveDomain = domainTags.includes(selectedDomain) ? selectedDomain : "All";

  // Tab definitions
  const tabs: TabOption[] = [
    { key: "all", label: "All Builders", badge: allMembers.length },
    { key: "leadership", label: "Leadership", badge: teamLeads.length },
    { key: "domain", label: "Domain Leads", badge: domainLeads.length },
    { key: "ops", label: "Events & Media", badge: opsTeam.length },
    { key: "coordinators", label: "Coordinators", badge: coordinators.length },
  ];

  // Filtering logic
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allMembers.filter((member) => {
      // Tab filter
      if (activeTab !== "all" && member.sectionKey !== activeTab) {
        return false;
      }
      // Domain filter
      if (effectiveDomain !== "All") {
        const cat = getDomainCategory(member.role);
        if (cat !== effectiveDomain) return false;
      }
      // Search query
      if (q) {
        const domain = getDomainCategory(member.role).toLowerCase();
        const matchesName = member.name.toLowerCase().includes(q);
        const matchesRole = member.role.toLowerCase().includes(q);
        const matchesBio = member.bio.toLowerCase().includes(q);
        const matchesDomain = domain.includes(q);
        if (!matchesName && !matchesRole && !matchesBio && !matchesDomain) {
          return false;
        }
      }
      return true;
    });
  }, [allMembers, activeTab, effectiveDomain, searchQuery]);

  const isDefaultView = activeTab === "all" && !searchQuery.trim() && effectiveDomain === "All";

  return (
    <div className="w-full">
      {/* Interactive Controls Bar */}
      <div className="sticky top-14 z-30 mb-10 -mx-4 px-4 py-4 backdrop-blur-xl bg-ink/80 border-y border-line/60 sm:mx-0 sm:px-6 sm:rounded-2xl sm:border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Main Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSelectedDomain("All");
                  }}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-brand text-black font-semibold shadow-[0_0_16px_rgba(173,92,255,0.35)]"
                      : "bg-surface/60 text-fog hover:bg-surface hover:text-cream border border-line/60"
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                      active
                        ? "bg-black/20 text-black font-bold"
                        : "bg-coal text-faint"
                    )}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] sm:min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-faint pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search builders, roles, tech domains..."
              className="w-full rounded-xl border border-line/80 bg-coal/80 pl-10 pr-9 py-2 text-sm text-cream placeholder-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-faint hover:text-cream hover:bg-surface transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-Filter: Domain Chips (visible when multiple domains exist) */}
        {domainTags.length > 2 && (
          <div className="mt-3.5 pt-3 border-t border-line/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-faint shrink-0 mr-1">
              <Filter className="h-3 w-3 text-brand" /> Domain:
            </span>
            {domainTags.map((domain) => {
              const active = effectiveDomain === domain;
              return (
                <button
                  key={domain}
                  type="button"
                  onClick={() => setSelectedDomain(domain)}
                  className={cn(
                    "shrink-0 rounded-lg px-2.5 py-1 text-xs transition-all duration-150",
                    active
                      ? "bg-brand/20 text-brand border border-brand/40 font-medium"
                      : "bg-coal/60 text-faint hover:text-fog hover:bg-surface border border-line/50"
                  )}
                >
                  {domain}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Header / Live count when filtered */}
      {(!isDefaultView || searchQuery) && (
        <div className="mb-6 flex items-center justify-between text-xs sm:text-sm text-faint">
          <p>
            Showing <span className="font-semibold text-cream">{filteredMembers.length}</span>{" "}
            {filteredMembers.length === 1 ? "builder" : "builders"}
            {effectiveDomain !== "All" && (
              <span>
                {" "}in <span className="text-brand font-medium">{effectiveDomain}</span>
              </span>
            )}
            {searchQuery && (
              <span>
                {" "}matching &ldquo;<span className="text-cream">{searchQuery}</span>&rdquo;
              </span>
            )}
          </p>
          {(searchQuery || effectiveDomain !== "All" || activeTab !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedDomain("All");
                setActiveTab("all");
              }}
              className="text-xs text-brand hover:underline font-medium"
            >
              Reset filters
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {isDefaultView ? (
        /* Structured Presentation for All Tab */
        <div className="space-y-16 sm:space-y-20">
          {/* 1. Core Leadership Spotlight */}
          <section aria-labelledby="section-leadership">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand/15 px-2 py-0.5 text-[11px] font-mono font-medium text-brand border border-brand/30">
                    <Sparkles className="h-3 w-3" /> Core Leadership
                  </span>
                </div>
                <h2
                  id="section-leadership"
                  className="mt-2 text-2xl font-bold tracking-tight text-cream sm:text-3xl"
                >
                  Leadership Team
                </h2>
              </div>
              <span className="text-xs font-mono text-faint">
                {teamLeads.length} Leaders
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="mb-6 flex items-center justify-between border-t border-line/60 pt-10 sm:pt-14">
              <div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-brand">
                  {"// Specializations & Labs"}
                </span>
                <h2
                  id="section-domain"
                  className="mt-1 text-2xl font-bold tracking-tight text-cream sm:text-3xl"
                >
                  Technical Domain Leads
                </h2>
              </div>
              <span className="text-xs font-mono text-faint">
                {domainLeads.length} Leads
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="mb-6 flex items-center justify-between border-t border-line/60 pt-10 sm:pt-14">
              <div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-brand">
                  {"// Community Engine"}
                </span>
                <h2
                  id="section-ops"
                  className="mt-1 text-2xl font-bold tracking-tight text-cream sm:text-3xl"
                >
                  Events, PR & Media
                </h2>
              </div>
              <span className="text-xs font-mono text-faint">
                {opsTeam.length} Members
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="mb-6 flex items-center justify-between border-t border-line/60 pt-10 sm:pt-14">
              <div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-brand">
                  {"// Execution & Support"}
                </span>
                <h2
                  id="section-coordinators"
                  className="mt-1 text-2xl font-bold tracking-tight text-cream sm:text-3xl"
                >
                  Coordinators
                </h2>
              </div>
              <span className="text-xs font-mono text-faint">
                {coordinators.length} Coordinators
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      ) : (
        /* Filtered Grid Presentation */
        <div>
          {filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member) => (
                <BuilderCard
                  key={member.id}
                  member={member}
                  isLead={member.lead || member.sectionKey === "leadership"}
                  onPhotoClick={() => member.photo && setPreviewMember(member)}
                />
              ))}
            </div>
          ) : (
            /* Clean Empty State */
            <div className="rounded-2xl border border-dashed border-line/80 bg-coal/40 p-12 text-center my-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-cream">
                No matching builders found
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-fog">
                Try searching with another keyword or clear the active domain filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDomain("All");
                  setActiveTab("all");
                }}
                className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-xs font-medium text-cream hover:border-brand transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90dvh] w-full max-w-md overflow-hidden rounded-2xl border border-line/80 bg-surface p-6 shadow-[0_24px_70px_rgba(0,0,0,0.8)]"
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
                  <div className="mt-4 flex items-center justify-center gap-3 border-t border-line/50 pt-4">
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

/** Individual Builder Card Component */
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
  const domainCategory = getDomainCategory(member.role);

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-300",
        isLead
          ? "border-brand/40 bg-gradient-to-b from-surface/90 to-coal/90 hover:border-brand hover:shadow-[0_8px_32px_rgba(173,92,255,0.2)]"
          : "border-line/70 bg-coal/60 hover:border-brand/50 hover:bg-surface/80 hover:shadow-[0_8px_24px_rgba(173,92,255,0.1)]",
        "hover:-translate-y-1"
      )}
    >
      {/* Subtle iridescent glow on card hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.08] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

      <div>
        {/* Card Header: Avatar & Domain Tag */}
        <div className="flex items-start justify-between gap-3">
          {showPhoto ? (
            <button
              type="button"
              onClick={onPhotoClick}
              aria-label={`View photo of ${member.name}`}
              className={cn(
                "group/avatar relative shrink-0 overflow-hidden rounded-xl border border-line/80 bg-coal transition-all",
                "hover:border-brand/80 cursor-zoom-in",
                isLead ? "h-16 w-16 sm:h-20 sm:w-20 ring-2 ring-brand/30" : "h-14 w-14"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={member.photo}
                alt={member.name}
                loading="lazy"
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover transition-transform duration-300 group-hover/avatar:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/avatar:opacity-100">
                <ZoomIn className="h-4 w-4 text-cream" />
              </div>
            </button>
          ) : (
            <div
              aria-hidden
              className={cn(
                "flex shrink-0 items-center justify-center rounded-xl border border-line/80 font-mono font-bold text-cream select-none shadow-inner",
                isLead
                  ? "h-16 w-16 sm:h-20 sm:w-20 text-xl bg-gradient-to-br from-brand/25 to-surface ring-2 ring-brand/30"
                  : "h-14 w-14 text-sm bg-surface/90"
              )}
            >
              {initials(member.name)}
            </div>
          )}

          {/* Role / Domain Chip */}
          <div className="flex flex-col items-end gap-1 text-right">
            {isLead ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-0.5 text-[10px] font-semibold text-brand border border-brand/30 uppercase tracking-wider">
                <Sparkles className="h-2.5 w-2.5" /> Core Lead
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-surface/80 px-2 py-0.5 text-[11px] font-mono text-faint border border-line/50">
                {domainCategory}
              </span>
            )}
          </div>
        </div>

        {/* Member Details */}
        <div className="mt-4">
          <h3
            className={cn(
              "font-bold text-cream tracking-tight transition-colors group-hover:text-white [overflow-wrap:anywhere]",
              isLead ? "text-lg sm:text-xl" : "text-base"
            )}
          >
            {member.name}
          </h3>
          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-brand">
            {member.role}
          </p>
          <p className="mt-2.5 text-xs sm:text-sm text-fog/90 leading-relaxed line-clamp-3 [overflow-wrap:anywhere]">
            {member.bio}
          </p>
        </div>
      </div>

      {/* Social Links Footer */}
      {(member.linkedin || member.github || member.email) && (
        <div className="mt-4 pt-3 border-t border-line/50 flex flex-wrap items-center gap-2">
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} on LinkedIn`}
              className="inline-flex items-center gap-1 rounded-lg border border-line/60 bg-coal/70 px-2.5 py-1 text-[11px] text-faint transition-all hover:border-brand/60 hover:text-cream hover:bg-brand/10"
            >
              <LinkedinIcon className="h-3 w-3 text-brand" />
              <span>LinkedIn</span>
            </a>
          )}
          {member.github && (
            <a
              href={member.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} on GitHub`}
              className="inline-flex items-center gap-1 rounded-lg border border-line/60 bg-coal/70 px-2.5 py-1 text-[11px] text-faint transition-all hover:border-brand/60 hover:text-cream hover:bg-brand/10"
            >
              <GithubIcon className="h-3 w-3 text-fog" />
              <span>GitHub</span>
            </a>
          )}
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              aria-label={`Email ${member.name}`}
              className="inline-flex items-center gap-1 rounded-lg border border-line/60 bg-coal/70 px-2.5 py-1 text-[11px] text-faint transition-all hover:border-brand/60 hover:text-cream hover:bg-brand/10"
            >
              <MailIcon className="h-3 w-3 text-brand" />
              <span>Email</span>
            </a>
          )}
        </div>
      )}
    </article>
  );
}
