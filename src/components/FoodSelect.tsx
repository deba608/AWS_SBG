"use client";

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
                "flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-200",
                active
                  ? veg
                    ? "bg-gradient-to-b from-emerald-400 to-emerald-600 text-black shadow-[0_4px_20px_rgba(52,211,153,0.4)]"
                    : "bg-gradient-to-b from-red-400 to-red-600 text-white shadow-[0_4px_20px_rgba(248,113,113,0.4)]"
                  : "text-fog hover:text-cream",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-2 w-2 rounded-full",
                  veg ? "bg-emerald-500" : "bg-red-500",
                  active ? "bg-black/30" : "",
                )}
              />
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
