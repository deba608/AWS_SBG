import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "bg-brand text-black hover:bg-brandhover shadow-[0_8px_30px_rgba(255,153,0,0.25)]",
  secondary:
    "border border-line bg-surface text-cream hover:border-brand/60 hover:bg-raised",
  ghost: "text-fog hover:bg-white/5 hover:text-cream",
};

export default function Button({
  children,
  href,
  variant = "primary",
  className,
  external = false,
}: {
  children: React.ReactNode;
  href: string;
  variant?: Variant;
  className?: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0",
        styles[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}
