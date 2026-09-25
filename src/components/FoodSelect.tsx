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
                "flex min-h-[48px] flex-1 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all duration-200",
                active
                  ? veg
                    ? "border-green-500 bg-green-500/10 text-cream shadow-[0_0_20px_rgba(34,197,94,0.25)]"
                    : "border-red-500 bg-red-500/10 text-cream shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                  : "border-line bg-coal text-fog hover:text-cream",
              )}
            >
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
