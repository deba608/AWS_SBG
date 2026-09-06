import { cn } from "@/lib/utils";

export default function Tabs<T extends string>({
  options,
  active,
  onChange,
  label,
}: {
  options: readonly T[];
  active: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-line"
    >
      {options.map((option) => {
        const selected = option === active;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option)}
            className={cn(
              "relative inline-flex min-h-[44px] items-center pb-3 pt-2 text-sm transition-colors duration-150",
              selected
                ? "font-semibold text-cream after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:rounded-full after:bg-brand"
                : "font-normal text-faint hover:text-cream"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
