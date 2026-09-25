"use client";

import { Check } from "lucide-react";
import { FOODS, type FoodPref } from "@/lib/validate-contact";
import { cn } from "@/lib/utils";

/** Indian veg / non-veg mark: circle (veg) or triangle (non-veg) in a square. */
export function VegMark({ veg, className }: { veg: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-2",
        veg ? "border-emerald-500" : "border-red-500",
        className,
      )}
    >
      {veg ? (
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
      ) : (
        <span
          className="h-0 w-0 border-x-[5px] border-b-[8px] border-x-transparent border-b-red-500"
        />
      )}
    </span>
  );
}

export default function FoodSelect({
  value,
  onChange,
  labelId,
  error,
}: {
  value: string;
  onChange: (f: FoodPref) => void;
  labelId: string;
  error?: string;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-cream" id={labelId}>
        Food preference *
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-2 gap-2">
        {FOODS.map((f) => {
          const veg = f === "Veg";
          const active = value === f;
          return (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(f)}
              className={cn(
                "relative flex min-h-[56px] items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all",
                active
                  ? veg
                    ? "border-emerald-400/70 bg-emerald-400/10 shadow-[0_0_20px_rgba(52,211,153,0.18)]"
                    : "border-red-400/70 bg-red-400/10 shadow-[0_0_20px_rgba(248,113,113,0.18)]"
                  : "border-line bg-surface hover:border-faint",
              )}
            >
              <VegMark veg={veg} />
              <span className={cn("block text-sm font-bold", active ? "text-cream" : "text-fog")}>
                {veg ? "Veg" : "Non-veg"}
              </span>
              {active ? (
                <span
                  className={cn(
                    "absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full",
                    veg ? "bg-emerald-500" : "bg-red-500",
                  )}
                >
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
