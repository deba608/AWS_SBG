import { cn } from "@/lib/utils";

export default function Container({
  children,
  className,
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-6 md:px-8",
        wide ? "max-w-7xl" : "max-w-6xl",
        className
      )}
    >
      {children}
    </div>
  );
}
