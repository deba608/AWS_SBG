"use client";

import { AnimatePresence, motion } from "framer-motion";
import EventCard from "./EventCard";
import Tabs from "./Tabs";
import { EVENT_FILTERS, filterEvents, upcomingEvents, type EventFilter } from "@/data/events";
import { useState } from "react";

export default function EventsExplorer() {
  const [filter, setFilter] = useState<EventFilter>("All");
  const events = filterEvents(upcomingEvents, filter);

  return (
    <div>
      <Tabs
        options={EVENT_FILTERS}
        active={filter}
        onChange={setFilter}
        label="Filter events by type"
      />
      {events.length > 0 ? (
        <motion.div layout className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {events.map((event) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface/50 p-10 text-center">
          <p className="text-base font-medium text-cream">No events in this category yet.</p>
          <p className="mt-1 text-sm text-fog">
            Check back soon — new sessions are announced every month.
          </p>
        </div>
      )}
    </div>
  );
}
