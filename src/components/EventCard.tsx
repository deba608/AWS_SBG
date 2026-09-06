import { ArrowRight, CalendarDays, Clock, MapPin } from "lucide-react";
import Badge from "./Badge";
import { SITE } from "@/lib/constants";
import type { EventItem } from "@/data/events";
import { cn } from "@/lib/utils";

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
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-white/15">
      <div
        aria-hidden
        className="relative h-32 shrink-0 overflow-hidden border-b border-line bg-coal"
      >
        <div className="bg-grid absolute inset-0 opacity-70" />
        <div className="glow-brand absolute -right-10 -top-10 h-40 w-40" />
        <div className="absolute left-4 top-4">
          <Badge tone="neutral">{event.category}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold leading-snug text-cream">
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
        <div className="mt-4 pt-2">
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
