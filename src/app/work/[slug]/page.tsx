import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { ContactPanel } from "@/components/ContactPanel";
import { Metric } from "@/components/marks";
import { getProject, nextProject, projects } from "@/content/projects";
import { site } from "@/content/site";

// Every real slug is prerendered below. Unknown slugs may block and then 404,
// which is better than streaming a placeholder shell that turns into a soft 404.
export const instant = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const project = getProject((await params).slug);
  return { title: project ? project.caseStudy.title : "Not found" };
}

export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const cs = project.caseStudy;
  const next = nextProject(slug);
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
          <Link href="/#work" className="ln-link ln-case__back">← All work</Link>
          <header className="ln-case__intro">
            <span className="ln-label">
              Case study · {project.area} · {project.year}
            </span>
            <h1 className="ln-case__title">{cs.title}</h1>
            <p className="ln-case__lede">{cs.lede}</p>
          </header>

          <dl className="ln-surface ln-meta">
            {meta.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            <div>
              <dt>Links</dt>
              <dd className="ln-meta__links">
                <a href={cs.meta.repo} className="ln-link">Repo ↗</a>
                <a href={cs.meta.demo} className="ln-link">Demo ↗</a>
              </dd>
            </div>
          </dl>

          <figure className="ln-figure">
            <div className="ln-surface ln-diagram">
              {cs.diagram.steps.map((step, i) => (
                <Fragment key={step}>
                  {i > 0 && <span className="ln-diagram__arrow" aria-hidden="true">→</span>}
                  <span className={i === cs.diagram.model ? "ln-diagram__node ln-diagram__node--model" : "ln-diagram__node"}>{step}</span>
                </Fragment>
              ))}
            </div>
            <figcaption>Fig. 1 · {cs.diagram.caption}</figcaption>
          </figure>
        </div>

        <div className="ln-wrap ln-wrap--measure ln-case__body">
          <section className="ln-case__section">
            <span className="ln-label">Context</span>
            <h2>{cs.context.heading}</h2>
            <p>{cs.context.body}</p>
          </section>

          <section className="ln-case__section">
            <span className="ln-label">Problem</span>
            <h2>{cs.problem.heading}</h2>
            <p>{cs.problem.body}</p>
          </section>

          <section className="ln-case__section">
            <span className="ln-label">Approach</span>
            <h2>{cs.approach.heading}</h2>
            <p>{cs.approach.body}</p>
            <ol>
              {cs.approach.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <pre className="ln-code">
              <code>{cs.approach.code}</code>
            </pre>
          </section>

          <section className="ln-case__section ln-case__section--result">
            <div className="ln-case__section">
              <span className="ln-label">Result</span>
              <h2>{cs.result.heading}</h2>
            </div>
            <div className="ln-surface ln-results">
              {cs.result.metrics.map((m, i) => (
                <Metric key={m.label} {...m} lead={i === 0} />
              ))}
            </div>
            <p>{cs.result.body}</p>
            <figure className="ln-figure">
              <div className="ln-well">
                <span className="ln-label">[Chart: before vs after]</span>
              </div>
              <figcaption>Fig. 2 · {cs.result.chartCaption}</figcaption>
            </figure>
          </section>

          <section className="ln-case__section">
            <span className="ln-label">What I&apos;d do differently</span>
            <h2>{cs.lesson.heading}</h2>
            <p>{cs.lesson.body}</p>
          </section>

          <Link href={`/work/${next.slug}`} className="ln-surface ln-next">
            <span className="ln-label">Next case study →</span>
            <span className="ln-next__title">{next.title}</span>
          </Link>
        </div>
      </article>

      <ContactPanel heading={site.contact.caseStudyHeading} compact />
    </>
  );
}
