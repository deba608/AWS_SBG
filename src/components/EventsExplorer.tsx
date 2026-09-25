"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarX2 } from "lucide-react";
import EventCard from "./EventCard";
import EventGroup from "./EventGroup";
import Tabs from "./Tabs";
import { EVENT_FILTERS, filterEvents, upcomingEvents, type EventFilter } from "@/data/events";
import { useState } from "react";

export default function EventsExplorer() {
  const [filter, setFilter] = useState<EventFilter>("All");
  const reduce = useReducedMotion();

  // "All" → flagship groups with sessions nested inside.
  // Filtered → flat matching list (existing behavior).
  const grouped = filter === "All";
  const parents = upcomingEvents.filter((e) => !e.parentId);
  const childrenOf = (id: string) => upcomingEvents.filter((e) => e.parentId === id);
  const flat = filterEvents(upcomingEvents, filter);
  const count = grouped
    ? parents.length + parents.reduce((n, p) => n + childrenOf(p.id).length, 0)
    : flat.length;

  return (
    <div>
      <Tabs
        options={EVENT_FILTERS}
        active={filter}
        onChange={setFilter}
        label="Filter events by type"
      />
      <p className="mt-4 text-sm text-faint" role="status">
        Showing {count} {count === 1 ? "event" : "events"}
        {filter !== "All" ? ` in ${filter}` : ""}
      </p>
      {grouped ? (
        <div className="mt-6 space-y-6">
          <AnimatePresence mode="wait">
            {parents.map((parent) => (
              <motion.div
                key={parent.id}
                className="min-w-0"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <EventGroup parent={parent} sessions={childrenOf(parent.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : flat.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="wait">
            {flat.map((event) => (
              <motion.div
                key={event.id}
                className="min-w-0"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface/50 p-6 text-center sm:p-10">
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
