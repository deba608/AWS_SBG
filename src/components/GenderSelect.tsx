"use client";

import { Check } from "lucide-react";
import { GENDERS } from "@/lib/validate-contact";
import { cn } from "@/lib/utils";

export default function GenderSelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (g: string) => void;
  error?: string;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-cream" id="gender-label">
        Gender *
      </span>
      <div
        role="radiogroup"
        aria-labelledby="gender-label"
        className="flex rounded-2xl border border-line bg-coal p-1.5"
      >
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
                "flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-200",
                active
                  ? "bg-gradient-to-b from-brand to-brandpressed text-black shadow-[0_4px_20px_rgba(173,92,255,0.4)]"
                  : "text-fog hover:text-cream",
              )}
            >
              {active ? (
                <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
              ) : null}
              {g}
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
