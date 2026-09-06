import { ArrowRight, Clock } from "lucide-react";
import Badge from "./Badge";
import { SITE } from "@/lib/constants";
import type { LearningPath } from "@/data/learning";

export default function LearningCard({ path }: { path: LearningPath }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-white/15 hover:bg-raised">
      <div className="flex items-center justify-between gap-2">
        <Badge tone={path.level === "Beginner" ? "success" : "brand"}>
          {path.level}
        </Badge>
        <span className="inline-flex items-center gap-1.5 text-xs text-faint">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {path.duration}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-cream">{path.title}</h3>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-faint">
        {path.difficulty}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-fog">
        {path.description}
      </p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Topics covered">
        {path.topics.map((topic) => (
          <li
            key={topic}
            className="rounded-full bg-white/5 px-2.5 py-1 font-mono text-[11px] text-fog"
          >
            {topic}
          </li>
        ))}
      </ul>
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-faint">
          <span>Your progress</span>
          <span>{path.progress}%</span>
        </div>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={path.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${path.title} progress`}
        >
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${path.progress}%` }}
          />
        </div>
      </div>
      <div className="mt-5 pt-1">
        <a
          href={SITE.links.join}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-cream transition-colors hover:text-brand"
        >
          Start Learning
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </a>
      </div>
    </article>
  );
}
