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
      <div role="radiogroup" aria-labelledby="gender-label" className="grid grid-cols-2 gap-2">
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
                "relative flex min-h-[56px] items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-bold transition-all",
                active
                  ? "border-brand/60 bg-brand/10 text-cream shadow-[0_0_24px_rgba(173,92,255,0.25)]"
                  : "border-line bg-surface text-fog hover:border-brand/30 hover:text-cream",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  active ? "bg-brand shadow-[0_0_8px_rgba(173,92,255,0.9)]" : "bg-faint",
                )}
              />
              {g}
              {active ? (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand">
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
