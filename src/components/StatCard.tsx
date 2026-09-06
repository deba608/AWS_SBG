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
        "rounded-2xl border border-line bg-surface p-6 text-center",
        className
      )}
    >
      <p className="font-mono text-4xl font-bold tracking-tight text-cream md:text-5xl">
        {value}
        {suffix ? <span className="text-brand">{suffix}</span> : null}
      </p>
      <p className="mt-2 text-sm font-medium uppercase tracking-wider text-faint">
        {label}
      </p>
    </div>
  );
}
