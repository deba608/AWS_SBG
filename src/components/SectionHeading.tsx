import { cn } from "@/lib/utils";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  index,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  index?: string;
}) {
  // `index` is accepted for backward compatibility but never rendered:
  // sequence numbers on non-sequential content read as decoration.
  void index;
  return (
    <div
      className={cn(
        "measure mb-10 md:mb-12",
        align === "center" ? "mx-auto" : "mr-auto"
      )}
    >
      {eyebrow ? (
        <p className="mb-2 text-sm font-medium text-faint">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-cream md:text-4xl">
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
