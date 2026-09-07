import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import type { EventItem } from "@/data/events";
import { cn } from "@/lib/utils";
import CommunityDayRegisterModal from "./CommunityDayRegisterModal";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Defensively pulls a day numeral + short month out of dates like
 *  "12 September 2026" or ranges like "8 – 9 November 2026". */
function dateParts(date: string): { day: string; month: string } {
  const text = (date ?? "").trim();
  const dayMatch = text.match(/(\d{1,2})/);
  const lowered = text.toLowerCase();
  const full =
    MONTHS.find((m) => lowered.includes(m.toLowerCase())) ??
    MONTHS.find((m) => lowered.includes(m.slice(0, 3).toLowerCase())) ??
    "";
  return {
    day: dayMatch ? dayMatch[1] : "—",
    month: full ? full.slice(0, 3) : "",
  };
}

const statusMeta = {
  open: { label: "Registration open", dot: "bg-emerald-400" },
  "filling-fast": { label: "Filling fast", dot: "bg-brand" },
  closed: { label: "Registrations closed", dot: "bg-faint" },
} as const;

export default function EventCard({
  event,
  compact = false,
}: {
  event: EventItem;
  compact?: boolean;
}) {
  const status = statusMeta[event.status];
  const { day, month } = dateParts(event.date);
  return (
    <article className="flex min-w-0 gap-4 border-t border-line py-6 sm:gap-6">
      <div className="w-12 shrink-0 text-left sm:w-14">
        <span className="block text-3xl font-bold tabular-nums leading-none text-cream">
          {day}
        </span>
        {month ? (
          <span className="mt-1.5 block text-sm text-faint">{month}</span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-faint">{event.category}</p>
        <h3 className="mt-1 text-lg font-semibold leading-snug text-cream [overflow-wrap:anywhere]">
          {event.detailsUrl ? (
            <Link
              href={event.detailsUrl}
              className="underline decoration-line underline-offset-4 transition-colors hover:decoration-cream"
            >
              {event.title}
            </Link>
          ) : (
            event.title
          )}
        </h3>
        {!compact ? (
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-fog [overflow-wrap:anywhere]">
            {event.description}
          </p>
        ) : null}
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <div className="flex min-w-0 gap-2">
            <dt className="shrink-0 text-faint">Time</dt>
            <dd className="min-w-0 break-words text-fog">{event.time}</dd>
          </div>
          <div className="flex min-w-0 gap-2">
            <dt className="shrink-0 text-faint">Venue</dt>
            <dd className="min-w-0 break-words text-fog">{event.location}</dd>
          </div>
        </dl>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
          <p className="flex min-h-[44px] items-center gap-2 text-sm text-fog">
            <span
              className={cn("inline-block h-2 w-2 shrink-0 rounded-full", status.dot)}
              aria-hidden
            />
            {status.label}
          </p>
          {event.id === "aws-student-community-day-suiit-2026" ? (
            <CommunityDayRegisterModal className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-cream underline decoration-brand/60 underline-offset-4 transition-colors hover:decoration-cream">
              Register
              <ArrowRight className="h-4 w-4" aria-hidden />
            </CommunityDayRegisterModal>
          ) : (
            <a
              href={event.registerUrl ?? SITE.links.eventDefault}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Register for ${event.title}`}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-cream underline decoration-brand/60 underline-offset-4 transition-colors hover:decoration-cream"
            >
              Register
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          )}
          {event.detailsUrl ? (
            <Link
              href={event.detailsUrl}
              aria-label={`View details for ${event.title}`}
              className="inline-flex min-h-[44px] items-center text-sm text-fog underline decoration-line underline-offset-4 transition-colors hover:text-cream hover:decoration-cream"
            >
              View details
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
