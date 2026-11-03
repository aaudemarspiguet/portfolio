import Link from "next/link";
import type { Project } from "@/content/projects";
import { Metric, Tags } from "./marks";

export function ProjectCard({ project, lead }: { project: Project; lead?: boolean }) {
  return (
    <Link href={`/work/${project.slug}`} className="ln-card">
      <div className="ln-card__head">
        <span>
          {project.area} · {project.year}
        </span>
        <span className="ln-card__cta">Case study →</span>
      </div>
      <h3 className="ln-card__title">{project.title}</h3>
      <p className="ln-card__summary">{project.summary}</p>
      <div className="ln-card__foot">
        <Metric value={project.metric.value} base={project.metric.base} lead={lead} />
        <Tags items={project.tags} />
      </div>
    </Link>
  );
}
