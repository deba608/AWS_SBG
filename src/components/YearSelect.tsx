"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { YEARS, type Year } from "@/lib/validate-contact";
import { cn } from "@/lib/utils";

export default function YearSelect({
  value,
  onChange,
  labelId,
  error,
  counts,
}: {
  value: string;
  onChange: (y: Year) => void;
  labelId?: string;
  error?: string;
  counts?: Record<string, { registered: number; limit: number; open: boolean }>;
}) {
  const autoId = useId();
  const id = labelId ?? `year-${autoId}`;
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-cream" id={id}>
        Year *
      </span>
      <div role="radiogroup" aria-labelledby={id} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {YEARS.map((y) => {
          const active = value === y;
          const slot = counts?.[y];
          const full = slot ? !slot.open : false;
          return (
            <button
              key={y}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={full && !active}
              onClick={() => onChange(y)}
              title={slot ? `${slot.registered}/${slot.limit} claimed` : undefined}
              className={cn(
                "relative flex min-h-[44px] flex-col items-center justify-center rounded-xl border px-3 py-1.5 text-sm font-semibold transition-all",
                active
                  ? "border-brand/60 bg-brand/10 text-cream shadow-[0_0_20px_rgba(173,92,255,0.18)]"
                  : full
                    ? "cursor-not-allowed border-line/50 bg-surface/50 text-faint/50"
                    : "border-line bg-surface text-fog hover:border-faint hover:text-cream",
              )}
            >
              <span>{y} year</span>
              {slot ? (
                <span className="font-mono text-[10px] font-normal text-faint">
                  {slot.registered}/{slot.limit}{full ? " · full" : ""}
                </span>
              ) : null}
              {active ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand">
                  <Check className="h-3 w-3 text-black" strokeWidth={3.5} aria-hidden />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-300">{error}</p>
      ) : null}
    </div>
  );
}
