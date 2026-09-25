"use client";

import { Check } from "lucide-react";
import { GENDERS, type Gender } from "@/lib/validate-contact";
import { cn } from "@/lib/utils";

export default function GenderSelect({
  value,
  onChange,
  labelId,
  error,
}: {
  value: string;
  onChange: (g: Gender) => void;
  labelId: string;
  error?: string;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-cream" id={labelId}>
        Gender *
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-2 gap-2">
        {GENDERS.map((g) => {
          const active = value === g;
          return (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(g)}
              className={cn(
                "relative flex min-h-[44px] items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-all",
                active
                  ? "border-brand/60 bg-brand/10 text-cream shadow-[0_0_20px_rgba(173,92,255,0.18)]"
                  : "border-line bg-surface text-fog hover:border-faint hover:text-cream",
              )}
            >
              {g}
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
