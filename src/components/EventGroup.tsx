import { ArrowRight } from "lucide-react";
import Link from "next/link";
import CommunityDayRegisterModal from "./CommunityDayRegisterModal";
import EventCard, { statusMeta } from "./EventCard";
import { cn } from "@/lib/utils";
import type { EventItem } from "@/data/events";

/** Flagship parent with its sessions nested inside — one pass covers all. */
export default function EventGroup({
  parent,
  sessions,
  compact = false,
}: {
  parent: EventItem;
  sessions: EventItem[];
  compact?: boolean;
}) {
  const status = statusMeta[parent.status];
  if (compact) {
    return (
      <section aria-label={parent.title} className="rank-card flex h-full flex-col p-5">
        <p className="text-xs font-mono tracking-widest text-brand uppercase">
          {"// flagship · 3 days"}
        </p>
        <h3 className="mt-2 text-lg font-bold tracking-tight text-cream">
          {parent.detailsUrl ? (
            <Link
              href={parent.detailsUrl}
              className="underline decoration-line underline-offset-4 transition-colors hover:decoration-cream"
            >
              {parent.title}
            </Link>
          ) : (
            parent.title
          )}
        </h3>
        <p className="mt-1 text-sm text-fog">
          {parent.date} · {parent.location}
        </p>
        <ul className="mt-4 space-y-2 border-l-2 border-brand/50 pl-4">
          {sessions.map((s) => (
            <li key={s.id} className="text-sm">
              <span className="font-semibold text-cream">{s.title}</span>
              <span className="block text-xs text-faint">
                {s.date} · {s.time}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex min-h-[44px] items-center gap-2 text-sm text-fog">
          <span
            className={cn("inline-block h-2 w-2 shrink-0 rounded-full", status.dot)}
            aria-hidden
          />
          {status.label} · one pass covers all
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 pt-2">
          <CommunityDayRegisterModal className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-cream underline decoration-brand/60 underline-offset-4 transition-colors hover:decoration-cream">
            Register
            <ArrowRight className="h-4 w-4" aria-hidden />
          </CommunityDayRegisterModal>
          {parent.detailsUrl ? (
            <Link
              href={parent.detailsUrl}
              className="inline-flex min-h-[44px] items-center text-sm text-fog underline decoration-line underline-offset-4 transition-colors hover:text-cream hover:decoration-cream"
            >
              View details
            </Link>
          ) : null}
        </div>
      </section>
    );
  }
  return (
    <section aria-label={parent.title} className="rank-panel overflow-hidden">
      <div className="bg-grid border-b border-line p-5 sm:p-6">
        <p className="text-xs font-mono tracking-widest text-brand uppercase">
          {"// flagship · 3 days"}
        </p>
        <h3 className="mt-2 text-xl font-bold tracking-tight text-cream sm:text-2xl">
          {parent.detailsUrl ? (
            <Link
              href={parent.detailsUrl}
              className="underline decoration-line underline-offset-4 transition-colors hover:decoration-cream"
            >
              {parent.title}
            </Link>
          ) : (
            parent.title
          )}
        </h3>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-fog">
          {parent.description}
        </p>
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <div className="flex min-w-0 gap-2">
            <dt className="shrink-0 text-faint">Date</dt>
            <dd className="min-w-0 break-words text-fog">{parent.date}</dd>
          </div>
          <div className="flex min-w-0 gap-2">
            <dt className="shrink-0 text-faint">Time</dt>
            <dd className="min-w-0 break-words text-fog">{parent.time}</dd>
          </div>
          <div className="flex min-w-0 gap-2">
            <dt className="shrink-0 text-faint">Venue</dt>
            <dd className="min-w-0 break-words text-fog">{parent.location}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1">
          <p className="flex min-h-[44px] items-center gap-2 text-sm text-fog">
            <span
              className={cn("inline-block h-2 w-2 shrink-0 rounded-full", status.dot)}
              aria-hidden
            />
            {status.label}
          </p>
          {parent.id === "aws-student-community-day-suiit-2026" ? (
            <CommunityDayRegisterModal className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-cream underline decoration-brand/60 underline-offset-4 transition-colors hover:decoration-cream">
              Register
              <ArrowRight className="h-4 w-4" aria-hidden />
            </CommunityDayRegisterModal>
          ) : (
            <Link
              href={parent.registerUrl ?? "/passes"}
              aria-label={`Register for ${parent.title}`}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-cream underline decoration-brand/60 underline-offset-4 transition-colors hover:decoration-cream"
            >
              Register
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
          {parent.detailsUrl ? (
            <Link
              href={parent.detailsUrl}
              aria-label={`View details for ${parent.title}`}
              className="inline-flex min-h-[44px] items-center text-sm text-fog underline decoration-line underline-offset-4 transition-colors hover:text-cream hover:decoration-cream"
            >
              View details
            </Link>
          ) : null}
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-xs font-semibold tracking-wider text-faint uppercase">
          {sessions.length} sessions inside · one pass covers all
        </p>
        <div className="mt-2 border-l-2 border-brand/50 pl-4 sm:pl-5">
          {sessions.map((child) => (
            <EventCard key={child.id} event={child} />
          ))}
        </div>
      </div>
    </section>
  );
}
