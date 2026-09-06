import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  // Primary carries the vibrant purple palette from the logo
  primary:
    "bg-gradient-to-r from-brand to-[#9333ea] text-white shadow-[0_2px_18px_rgba(173,92,255,0.35)] hover:shadow-[0_4px_24px_rgba(173,92,255,0.55)] hover:brightness-110 active:brightness-95",
  secondary:
    "border border-line bg-transparent text-cream hover:border-brand/50 hover:bg-brand/5 hover:text-white",
  ghost: "text-fog hover:bg-brand/10 hover:text-white",
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
  const isExternal =
    external ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("#");

  const classes = cn(
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-150",
    styles[variant],
    className
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
