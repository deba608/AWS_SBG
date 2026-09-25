"use client";

import { Drumstick, Leaf } from "lucide-react";
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
        <span className="h-0 w-0 border-x-[5px] border-b-[8px] border-x-transparent border-b-red-500" />
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
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="flex rounded-2xl border border-line bg-coal p-1.5"
      >
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
                "flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold transition-all duration-200",
                active
                  ? veg
                    ? "border-emerald-400 bg-emerald-400/15 text-cream shadow-[0_0_24px_rgba(52,211,153,0.3)]"
                    : "border-red-400 bg-red-400/15 text-cream shadow-[0_0_24px_rgba(248,113,113,0.3)]"
                  : "border-transparent text-fog hover:text-cream",
              )}
            >
              <VegMark veg={veg} />
              {veg ? (
                <Leaf className={cn("h-4 w-4", active ? "text-emerald-300" : "text-faint")} aria-hidden />
              ) : (
                <Drumstick className={cn("h-4 w-4", active ? "text-red-300" : "text-faint")} aria-hidden />
              )}
              {veg ? "Veg" : "Non-veg"}
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
