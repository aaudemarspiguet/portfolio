import Link from "next/link";
import { hasFlag, type Project } from "@/content/projects";
import { CoverMedia } from "./CoverMedia";
import { Metric, Tags } from "./marks";

/**
 * The 16:10 cover frame, with a "Current" chip for in-progress projects.
 * `decorative` and `parallax` are for the carousel's repeated copies and its script.
 */
export function ProjectCover({ project, decorative, parallax }: { project: Project; decorative?: boolean; parallax?: boolean }) {
  return (
    <span className="ln-card__cover" data-parallax-frame={parallax ? "" : undefined}>
      <CoverMedia media={project.cover} decorative={decorative} parallax={parallax} className="ln-card__media" />
      {hasFlag(project, "current") && (
        <span className="ln-card__badge">
          <span className="ln-live__dot" aria-hidden="true" />
          Current
        </span>
      )}
    </span>
  );
}

/** The text half of a project card, shared by the grid card and the carousel slide. */
export function ProjectCardBody({ project, lead }: { project: Project; lead?: boolean }) {
  return (
    <div className="ln-card__body">
      <h3 className="ln-card__title">{project.title}</h3>
      <div className="ln-card__head">
        <span className="ln-card__area">
          {project.org && (
            // eslint-disable-next-line @next/next/no-img-element -- small static mark
            <img src={project.org.logo} alt={`${project.org.name} logo`} width={18} height={18} className="ln-card__org" />
          )}
          {project.area} · {project.year}
        </span>
        <span className="ln-card__cta">Case study →</span>
      </div>
      <p className="ln-card__summary">{project.summary}</p>
      <div className="ln-card__foot">
        {project.metric && <Metric value={project.metric.value} base={project.metric.base} lead={lead} />}
        <Tags items={project.tags} />
      </div>
    </div>
  );
}

/** Grid card: cover on top, text below. */
export function ProjectCard({ project, lead }: { project: Project; lead?: boolean }) {
  return (
    <Link href={`/work/${project.slug}`} className="ln-card ln-card--media">
      <ProjectCover project={project} />
      <ProjectCardBody project={project} lead={lead} />
    </Link>
  );
}
