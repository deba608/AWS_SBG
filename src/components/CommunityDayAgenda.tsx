"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Calendar, Clock, MapPin } from "lucide-react";
import Badge from "@/components/Badge";
import { COMMUNITY_DAY_SCHEDULE } from "@/data/community-day";

export default function CommunityDayAgenda() {
  const [selectedDay, setSelectedDay] = useState(1);
  const reduce = useReducedMotion();

  const currentDay =
    COMMUNITY_DAY_SCHEDULE.find((d) => d.dayNumber === selectedDay) ??
    COMMUNITY_DAY_SCHEDULE[0];

  return (
    <div className="w-full">
      {/* Day Selector Tabs */}
      <div
        role="tablist"
        aria-label="Select Community Day Schedule"
        className="flex flex-wrap items-center gap-2 border-b border-line pb-4 sm:gap-3"
      >
        {COMMUNITY_DAY_SCHEDULE.map((day) => {
          const isSelected = day.dayNumber === selectedDay;
          return (
            <button
              key={day.dayNumber}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedDay(day.dayNumber)}
              className={`group relative flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? "bg-brand text-black shadow-lg shadow-brand/20 font-semibold"
                  : "bg-surface border border-line text-fog hover:border-brand/40 hover:text-cream"
              }`}
            >
              <Calendar
                className={`h-4 w-4 shrink-0 ${
                  isSelected ? "text-black" : "text-brand"
                }`}
                aria-hidden
              />
              <span>
                {day.dayLabel} · {day.shortDate}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day Overview Header */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface/80 p-5 sm:p-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">
            {currentDay.dayLabel} · {currentDay.date}
          </span>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-cream sm:text-2xl">
            {currentDay.theme}
          </h3>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-ink px-3.5 py-2 text-xs font-medium text-fog">
          <MapPin className="h-3.5 w-3.5 text-brand shrink-0" aria-hidden />
          <span>{currentDay.defaultVenue}</span>
        </div>
      </div>

      {/* Schedule Items Timeline */}
      <div className="mt-6 space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDay.dayNumber}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {currentDay.schedule.map((item, idx) => (
              <div
                key={`${currentDay.dayNumber}-${idx}-${item.time}`}
                className="group flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 transition-all duration-150 hover:border-brand/40 hover:bg-surface/90"
              >
                <div className="flex items-start gap-4">
                  <div className="flex min-w-[120px] shrink-0 items-center gap-1.5 text-xs font-semibold text-brand sm:text-sm">
                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{item.time}</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold text-cream">
                        {item.title}
                      </h4>
                      {item.tag ? (
                        <Badge tone="neutral">{item.tag}</Badge>
                      ) : null}
                    </div>
                    {item.description ? (
                      <p className="mt-1 text-xs leading-relaxed text-fog sm:text-sm">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                {item.venue ? (
                  <div className="flex shrink-0 items-center gap-1.5 self-start text-xs text-faint sm:self-center">
                    <MapPin className="h-3.5 w-3.5 text-brand" aria-hidden />
                    <span>{item.venue}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
