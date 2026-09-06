import { cn } from "@/lib/utils";

export default function Badge({
  children,
  tone = "brand",
  className,
}: {
  children: React.ReactNode;
  tone?: "brand" | "neutral" | "success";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        tone === "brand" &&
          "border-brand/30 bg-brand/10 text-brand",
        tone === "neutral" && "border-line bg-white/5 text-fog",
        tone === "success" && "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
        className
      )}
    >
      {children}
    </span>
  );
}
