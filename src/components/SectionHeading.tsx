import { cn } from "@/lib/utils";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "mb-10 max-w-2xl md:mb-14",
        align === "center" ? "mx-auto text-center" : "text-left"
      )}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-bold tracking-tight text-cream md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-fog md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
