import { ArrowRight, CalendarDays, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import Badge from "./Badge";
import { SITE } from "@/lib/constants";
import type { EventItem } from "@/data/events";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dateBlock(date: string): { day: string; month: string } {
  const trimmed = (date ?? "").trim();
  const dayMatch = trimmed.match(/^(\d{1,2})/);
  const day = dayMatch ? dayMatch[1] : "◆";
  const lowered = trimmed.toLowerCase();
  const full =
    MONTHS.find((m) => lowered.includes(m.toLowerCase().slice(0, 3))) ?? "";
  return { day, month: full.slice(0, 3).toUpperCase() };
}

const statusMeta = {
  open: { label: "Registration open", tone: "success" as const },
  "filling-fast": { label: "Filling fast", tone: "brand" as const },
  closed: { label: "Registrations closed", tone: "neutral" as const },
};

export default function EventCard({
  event,
  compact = false,
}: {
  event: EventItem;
  compact?: boolean;
}) {
  const status = statusMeta[event.status];
  const { day, month } = dateBlock(event.date);
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
      <div className="relative shrink-0 overflow-hidden border-b border-line bg-coal px-5 py-4">
        <div className="bg-grid absolute inset-0 opacity-70" aria-hidden />
        <div className="glow-brand absolute -right-10 -top-14 h-40 w-40" aria-hidden />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-brand/30 bg-ink/80">
              <span className="font-mono text-lg font-bold leading-none text-cream">{day}</span>
              <span className="mt-1 font-mono text-[10px] font-semibold tracking-widest text-brand">{month}</span>
            </div>
          <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-cream">{event.date}</p>
              <p className="mt-0.5 truncate text-xs text-faint">{event.time}</p>
            </div>
          </div>
          <Badge tone="neutral">{event.category}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold leading-snug text-cream [overflow-wrap:anywhere]">
          {event.title}
        </h3>
        <dl className="mt-3 space-y-1.5 text-sm text-fog">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-brand" aria-hidden />
            <dt className="sr-only">Date</dt>
            <dd>{event.date}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-brand" aria-hidden />
            <dt className="sr-only">Time</dt>
            <dd>{event.time}</dd>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-brand" aria-hidden />
            <dt className="sr-only">Location</dt>
            <dd>{event.location}</dd>
          </div>
        </dl>
        {!compact ? (
          <p className="mt-3 text-sm leading-relaxed text-fog">
            {event.description}
          </p>
        ) : null}
        <div className="mt-4 flex items-center gap-2">
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              event.status === "open" && "bg-emerald-400",
              event.status === "filling-fast" && "bg-brand",
              event.status === "closed" && "bg-faint"
            )}
            aria-hidden
          />
          <span className="text-xs font-medium text-fog">{status.label}</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 pt-2">
          {event.detailsUrl ? (
            <Link
              href={event.detailsUrl}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-cream"
              aria-label={`View details for ${event.title}`}
            >
              View details
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          ) : null}
          <a
            href={event.registerUrl ?? SITE.links.eventDefault}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-cream transition-colors hover:text-brand"
            aria-label={`Register for ${event.title}`}
          >
            Register
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </a>
        </div>
      </div>
    </article>
  );
}
