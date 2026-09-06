import { ArrowUpRight } from "lucide-react";
import Badge from "./Badge";
import { GithubIcon } from "./icons";
import type { Project } from "@/data/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-white/15">
      <div
        aria-hidden
        className="relative h-32 shrink-0 overflow-hidden border-b border-line bg-coal"
      >
        <div className="bg-grid absolute inset-0 opacity-70" />
        <div className="glow-brand absolute -left-10 -top-10 h-40 w-40" />
        <span className="absolute bottom-3 left-4 font-mono text-xs text-faint">
          ~/projects/{project.id}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold text-cream">{project.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-fog">
          {project.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
          {project.tech.map((t) => (
            <Badge key={t} tone="neutral">
              {t}
            </Badge>
          ))}
        </div>
        <p className="mt-3 font-mono text-xs text-faint">
          <span className="text-brand">aws:</span> {project.aws.join(" · ")}
        </p>
        <div className="mt-5 flex items-center gap-2 pt-1">
          <a
            href={project.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-brandhover"
          >
            View Project
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} source code on GitHub`}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-line text-fog transition-colors hover:border-white/20 hover:text-cream"
          >
            <GithubIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
    </article>
  );
}
