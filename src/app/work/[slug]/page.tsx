import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { ContactPanel } from "@/components/ContactPanel";
import { Metric } from "@/components/marks";
import { caseStudies, getProject, nextProject } from "@/content/projects";
import { site } from "@/content/site";

// Prerender known projects. Unknown slugs use Next.js's not-found UI.
export const instant = false;

export function generateStaticParams() {
  return caseStudies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const project = getProject((await params).slug);
  return {
    title: project ? project.caseStudy.title : "Not found",
    description: project?.caseStudy.lede,
  };
}

export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const cs = project.caseStudy;
  const diagram = cs.diagram;
  const next = nextProject(slug);
  const links = project.links;
  const isWork = project.kind === "work";
  const meta = [
    ["Role", cs.meta.role],
    ["Timeline", cs.meta.timeline],
    ["Team", cs.meta.team],
    ["Stack", cs.meta.stack],
  ];

  return (
    <>
      <article>
        <div className="ln-wrap ln-case">
          <Link href={isWork ? "/#experience" : "/#work"} className="ln-link ln-case__back">
            {isWork ? "← Experience" : "← All projects"}
          </Link>
          <header className="ln-case__intro">
            <h1 className="ln-case__title">{cs.title}</h1>
            <span className="ln-label">
              Case study · {project.area} · {project.year}
            </span>
            <p className="ln-case__lede">{cs.lede}</p>
          </header>

          <dl className="ln-surface ln-meta">
            {meta.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            {(links?.live || links?.repo) && <div>
              <dt>Links</dt>
              <dd className="ln-meta__links">
                {links.live && <a href={links.live} className="ln-link">Live ↗</a>}
                {links.repo && <a href={links.repo} className="ln-link">Repo ↗</a>}
              </dd>
            </div>}
          </dl>

          {diagram && <figure className="ln-figure">
            <div className="ln-surface ln-diagram">
              {diagram.steps.map((step, i) => (
                <Fragment key={step}>
                  {i > 0 && <span className="ln-diagram__arrow" aria-hidden="true">→</span>}
                  <span className={i === diagram.model ? "ln-diagram__node ln-diagram__node--model" : "ln-diagram__node"}>{step}</span>
                </Fragment>
              ))}
            </div>
            <figcaption>Fig. 1 · {diagram.caption}</figcaption>
          </figure>}
        </div>

        <div className="ln-wrap ln-wrap--measure ln-case__body">
          {cs.context && <section className="ln-case__section">
            <h2>{cs.context.heading}</h2>
            <p>{cs.context.body}</p>
          </section>}

          {cs.problem && <section className="ln-case__section">
            <h2>{cs.problem.heading}</h2>
            <p>{cs.problem.body}</p>
          </section>}

          <section className="ln-case__section">
            <h2>{cs.approach.heading}</h2>
            <p>{cs.approach.body}</p>
            {cs.approach.steps && <ol>
              {cs.approach.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>}
          </section>

          {cs.result && <section className="ln-case__section ln-case__section--result">
            <h2>{cs.result.heading}</h2>
            <div className="ln-surface ln-results">
              {cs.result.metrics.map((m, i) => (
                <Metric key={m.label} {...m} lead={i === 0} />
              ))}
            </div>
            {cs.result.body && <p>{cs.result.body}</p>}
          </section>}

          <Link href={`/work/${next.slug}`} className="ln-surface ln-next">
            <span className="ln-next__title">{next.title}</span>
            <span className="ln-label">{isWork ? "Next role →" : "Next project →"}</span>
          </Link>
        </div>
      </article>

      <ContactPanel heading={site.contact.caseStudyHeading} compact />
    </>
  );
}
