import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { Architecture } from "@/components/Architecture";
import { ContactPanel } from "@/components/ContactPanel";
import { Metric } from "@/components/marks";
import { caseStudies, getProject, nextProject, sectionId, type Body, type Section } from "@/content/projects";
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

function Paragraphs({ body }: { body: Body }) {
  return (typeof body === "string" ? [body] : body).map((p) => <p key={p}>{p}</p>);
}

function CaseSection({ section }: { section: Section }) {
  return (
    <section className="ln-case__section">
      <h2 id={sectionId(section.heading)}>{section.heading}</h2>
      <Paragraphs body={section.body} />
      {section.more && <p><Link href={section.more.href} className="ln-link">{section.more.label} →</Link></p>}
    </section>
  );
}

export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const cs = project.caseStudy;
  const diagram = cs.diagram;
  const arch = cs.architecture;
  const next = nextProject(slug);
  const links = project.links;
  const isWork = project.kind === "work";
  const partners = cs.meta.partners;
  const meta = [
    ["Role", cs.meta.role],
    ["Timeline", cs.meta.timeline],
    ...(!partners && cs.meta.team ? [["Team", cs.meta.team]] : []),
    ["Stack", cs.meta.stack],
  ];
  // Figures are numbered in page order: the strip diagram, the architecture, then images.
  const archFigure = diagram ? 2 : 1;
  const firstFigure = 1 + (diagram ? 1 : 0) + (arch ? 1 : 0);
  // Portrait phone captures sit side by side, so two of them don't fill two screens.
  const phoneFigures = cs.figures?.every((f) => f.height > f.width) ?? false;
  const sizes = phoneFigures ? "(max-width: 560px) 100vw, 320px" : "(max-width: 704px) 100vw, 640px";
  // Walkthrough steps that end in "nothing happens" share the diagram's stop colour.
  const stopSteps = new Set(arch?.edges.filter((e) => e.stop && e.step).map((e) => e.step));

  const opening = <>
    {cs.context && <CaseSection section={cs.context} />}
    {cs.problem && <CaseSection section={cs.problem} />}
    {cs.explainer && <CaseSection section={cs.explainer} />}
  </>;

  const rest = <>
    {cs.walkthrough && <section className="ln-case__section">
      <h2 id={sectionId(cs.walkthrough.heading)}>{cs.walkthrough.heading}</h2>
      {cs.walkthrough.intro && <p>{cs.walkthrough.intro}</p>}
      <ol className="ln-steps">
        {cs.walkthrough.steps.map((s, i) => (
          <li key={s} className={stopSteps.has(i + 1) ? "ln-steps__item ln-steps__item--stop" : "ln-steps__item"}>{s}</li>
        ))}
      </ol>
    </section>}

    <section className="ln-case__section">
      <h2 id={sectionId(cs.approach.heading)}>{cs.approach.heading}</h2>
      <Paragraphs body={cs.approach.body} />
      {cs.approach.steps && <ol>
        {cs.approach.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>}
    </section>

    {cs.figures && <div className={phoneFigures ? "ln-figures ln-figures--phones" : "ln-figures"}>
      {cs.figures.map((f, i) => (
        <figure key={f.src} className="ln-figure">
          <div className="ln-surface ln-figure__frame">
            <Image src={f.src} alt={f.alt} width={f.width} height={f.height} sizes={sizes} className={f.srcDark ? "ln-theme-light" : undefined} />
            {f.srcDark && <Image src={f.srcDark} alt={f.alt} width={f.width} height={f.height} sizes={sizes} className="ln-theme-dark" />}
          </div>
          <figcaption>Fig. {firstFigure + i} · {f.caption}</figcaption>
        </figure>
      ))}
    </div>}

    {cs.sections?.map((s) => <CaseSection key={s.heading} section={s} />)}

    {cs.result && <section className="ln-case__section ln-case__section--result">
      <h2>{cs.result.heading}</h2>
      <div className="ln-surface ln-results">
        {cs.result.metrics.map((m, i) => (
          <Metric key={m.label} {...m} lead={i === 0} />
        ))}
      </div>
      {cs.result.body && <p>{cs.result.body}</p>}
    </section>}

    {cs.lessons && <section className="ln-case__section">
      <h2>Lessons</h2>
      {cs.lessons.map((l) => (
        <div key={l.title} className="ln-lesson">
          <h3>{l.title}</h3>
          <p>{l.body}</p>
        </div>
      ))}
    </section>}

    <Link href={`/work/${next.slug}`} className="ln-surface ln-next">
      <span className="ln-next__title">{next.title}</span>
      <span className="ln-label">{isWork ? "Next role →" : "Next project →"}</span>
    </Link>
  </>;

  return (
    <>
      <article>
        <div className="ln-wrap ln-case">
          <Link href={isWork ? "/#experience" : "/projects"} className="ln-link ln-case__back">
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
            {/* Partners come last so a long list can span its own row (#10). */}
            {partners && <div className={partners.length > 2 ? "ln-meta__wide" : undefined}>
              <dt>Partners</dt>
              <dd>
                {partners.map((p, i) => (
                  <Fragment key={p.name}>
                    {i > 0 && ", "}
                    {p.link ? <a href={p.link} className="ln-link" target="_blank" rel="noopener noreferrer">{p.name}</a> : p.name}
                  </Fragment>
                ))}
              </dd>
            </div>}
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

        {arch ? <>
          <div className="ln-wrap ln-wrap--measure ln-case__body">{opening}</div>
          {/* The system diagram needs the full width, so it breaks out of the reading column. */}
          <div className="ln-wrap ln-case__wide">
            <figure className="ln-figure">
              <div className="ln-surface ln-arch__scroll">
                <Architecture arch={arch} labelId="arch-caption" />
              </div>
              <figcaption id="arch-caption">
                Fig. {archFigure} · {arch.caption}
                <span className="ln-arch__hint"> Swipe sideways to see the whole diagram.</span>
              </figcaption>
            </figure>
          </div>
          <div className="ln-wrap ln-wrap--measure ln-case__body">{rest}</div>
        </> : (
          <div className="ln-wrap ln-wrap--measure ln-case__body">{opening}{rest}</div>
        )}
      </article>

      <ContactPanel heading={site.contact.caseStudyHeading} compact />
    </>
  );
}
