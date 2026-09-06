import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group rounded-2xl border border-line bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-white/15 hover:bg-raised",
        className
      )}
    >
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-cream">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-fog">{description}</p>
    </div>
  );
}
