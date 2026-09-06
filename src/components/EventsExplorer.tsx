"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarX2 } from "lucide-react";
import EventCard from "./EventCard";
import Tabs from "./Tabs";
import { EVENT_FILTERS, filterEvents, upcomingEvents, type EventFilter } from "@/data/events";
import { useState } from "react";

export default function EventsExplorer() {
  const [filter, setFilter] = useState<EventFilter>("All");
  const reduce = useReducedMotion();
  const events = filterEvents(upcomingEvents, filter);

  return (
    <div>
      <Tabs
        options={EVENT_FILTERS}
        active={filter}
        onChange={setFilter}
        label="Filter events by type"
      />
      <p className="mt-4 text-sm text-faint" role="status">
        Showing {events.length} {events.length === 1 ? "event" : "events"}
        {filter !== "All" ? ` in ${filter}` : ""}
      </p>
      {events.length > 0 ? (
        <motion.div layout={!reduce} className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {events.map((event) => (
              <motion.div
                key={event.id}
                layout={!reduce}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface/50 p-10 text-center">
          <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-coal text-faint">
            <CalendarX2 className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-base font-medium text-cream">
            No {filter.toLowerCase()} scheduled yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-fog">
            New sessions post monthly. Check back soon or browse everything.
          </p>
          <button
            type="button"
            onClick={() => setFilter("All")}
            className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full border border-line bg-surface px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:border-brand/60 hover:text-brand"
          >
            Show all events
          </button>
        </div>
      )}
    </div>
  );
}
