import { cn } from "@/lib/utils";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  index,
  size = "md",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  index?: string;
  size?: "md" | "sm";
}) {
  // `index` is accepted for backward compatibility but never rendered:
  // sequence numbers on non-sequential content read as decoration.
  void index;
  const nested = size === "sm";
  return (
    <div
      className={cn(
        "measure",
        nested ? "mb-6 md:mb-8" : "mb-10 md:mb-12",
        align === "center" ? "mx-auto" : "mr-auto"
      )}
    >
      {eyebrow ? (
        <p className="mb-2 text-sm font-medium text-faint">{eyebrow}</p>
      ) : null}
      <h2
        className={cn(
          "tracking-tight text-cream",
          nested
            ? "text-2xl font-semibold md:text-3xl"
            : "text-3xl font-semibold md:text-4xl"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-[68ch] text-base leading-relaxed text-fog">
          {description}
        </p>
      ) : null}
    </div>
  );
}
