import { cn } from "@/lib/utils";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  index,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  index?: string;
}) {
  return (
    <div
      className={cn(
        "mb-10 max-w-2xl md:mb-14",
        align === "center" ? "mx-auto text-center" : "text-left"
      )}
    >
      <p className={cn(
        "mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand",
        align === "center" && "justify-center"
      )}>
        <span aria-hidden className="h-px w-6 bg-brand/60" />
        {index ? (
          <span className="font-mono normal-case tracking-normal text-faint">
            {index}
          </span>
        ) : null}
        {eyebrow}
        {align === "center" ? <span aria-hidden className="h-px w-6 bg-brand/60" /> : null}
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
