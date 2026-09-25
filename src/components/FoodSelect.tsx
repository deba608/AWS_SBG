"use client";

import { Drumstick, Leaf } from "lucide-react";
import { FOODS, type FoodPref } from "@/lib/validate-contact";
import { cn } from "@/lib/utils";

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
        className="grid grid-cols-2 gap-2"
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
                "flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-all duration-200",
                active
                  ? veg
                    ? "border-emerald-400/60 bg-emerald-400/10 text-cream shadow-[0_0_20px_rgba(52,211,153,0.18)]"
                    : "border-red-400/60 bg-red-400/10 text-cream shadow-[0_0_20px_rgba(248,113,113,0.18)]"
                  : "border-line bg-surface text-fog hover:border-faint hover:text-cream",
              )}
            >
              {veg ? (
                <Leaf className="h-4 w-4 text-current" aria-hidden />
              ) : (
                <Drumstick className="h-4 w-4 text-current" aria-hidden />
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
