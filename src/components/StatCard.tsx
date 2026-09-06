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
    <div className={cn("min-w-0 border-l-2 border-brand/60 pl-4", className)}>
      <p className="text-4xl font-bold tabular-nums tracking-tight text-cream md:text-5xl">
        {value}
        {suffix ?? null}
      </p>
      <p className="mt-2 text-sm text-fog">{label}</p>
    </div>
  );
}
