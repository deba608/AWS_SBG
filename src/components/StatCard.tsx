import { cn } from "@/lib/utils";

export default function StatCard({
  value,
  suffix,
  label,
  className,
}: {
  value: string;
  suffix?: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-2xl border border-line bg-surface p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent"
        aria-hidden
      />
      <p className="font-mono text-4xl font-bold tracking-tight text-cream tabular-nums md:text-5xl">
        {value}
        {suffix ? <span className="text-brand">{suffix}</span> : null}
      </p>
      <p className="mt-2 text-sm font-medium uppercase tracking-wider text-faint">
        {label}
      </p>
    </div>
  );
}
