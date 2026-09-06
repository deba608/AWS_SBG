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
        "group min-w-0 border-t border-line pt-5 transition-colors duration-200 hover:border-white/25",
        className
      )}
    >
      <Icon
        className="h-5 w-5 text-brand transition-colors duration-200 group-hover:text-cream"
        aria-hidden
      />
      <h3 className="mt-3 text-base font-semibold text-cream [overflow-wrap:anywhere]">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-fog [overflow-wrap:anywhere]">
        {description}
      </p>
    </div>
  );
}
