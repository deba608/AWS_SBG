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
      className="flex flex-wrap items-center gap-2"
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
              "inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              selected
                ? "border-brand bg-brand font-semibold text-black"
                : "border-line bg-surface text-fog hover:border-white/20 hover:text-cream"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
