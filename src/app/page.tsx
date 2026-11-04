import { ContactPanel } from "@/components/ContactPanel";
import { CopyEmail } from "@/components/CopyEmail";
import { ExperienceRow } from "@/components/ExperienceRow";
import { ProjectCard } from "@/components/ProjectCard";
import { Availability, NameTooltip, NowChip, SectionHeader, Squiggle } from "@/components/marks";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

export default function Home() {
  const { experience, education, about, stack } = site;

  return (
    <>
      <section id="top" className="ln-hero">
        <div className="ln-wrap">
          <div className="ln-hero__intro">
            <NameTooltip pronunciation={site.say.pronunciation} meaning={site.say.meaning}>
              <h1 className="ln-hero__name">
                {site.name}
                <span className="ln-dot">.</span>
              </h1>
            </NameTooltip>
            <Availability>
              {site.role} · {site.city} · {site.availability}
            </Availability>
          </div>
          <div className="ln-hero__body">
            <p className="ln-hero__lede">
              <Squiggle>{site.lede.highlight}</Squiggle>
              {site.lede.rest}
            </p>
            <NowChip>{site.now}</NowChip>
            <div className="ln-btn-row ln-hero__actions">
              <a href={`mailto:${site.email}`} className="ln-btn ln-btn--primary">Email me</a>
              <a href={site.links.resume} className="ln-btn">Résumé</a>
              <a href={site.links.github} className="ln-btn ln-btn--text">GitHub ↗</a>
              <a href={site.links.linkedin} className="ln-btn ln-btn--text">LinkedIn ↗</a>
            </div>
            <CopyEmail email={site.email} />
          </div>
        </div>
      </section>

      <section id="projects" className="ln-section">
        <div className="ln-wrap ln-stack-y">
          <SectionHeader label={`Projects · ${projects.length}`} heading={site.projects.heading} />
          <div className="ln-grid">
            {projects.map((p, i) => (
              <ProjectCard key={p.slug} project={p} lead={i === 0} />
            ))}
          </div>
        </div>
      </section>

      <section id="experience" className="ln-section">
        <div className="ln-wrap ln-stack-y">
          <SectionHeader label={`Experience · ${experience.roles.length} roles`} heading={experience.heading} />
          <ul className="ln-surface ln-list">
            {experience.roles.map((r) => (
              <ExperienceRow key={`${r.org}-${r.when}`} org={r.org} title={`${r.title} · ${r.org}`} line={r.line} when={r.when} where={r.where} logo={r.logo} caseStudy={r.caseStudy} />
            ))}
          </ul>
          <div className="ln-edu">
            <h3 className="ln-label">Education</h3>
            <ul className="ln-surface ln-list">
              <ExperienceRow org={education.school} title={`${education.degree} · ${education.school}`} line={education.line} when={education.when} where={education.where} logo={education.logo} />
            </ul>
          </div>
          <a href={site.links.resume} className="ln-btn ln-btn--text ln-after-list">Full résumé (PDF) ↗</a>
        </div>
      </section>

      <section id="about" className="ln-section">
        <div className="ln-wrap ln-stack-y">
          <SectionHeader heading={about.heading} />
          <div className="ln-about">
            <div className="ln-about__text">
              {about.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="stack" className="ln-section">
        <div className="ln-wrap ln-stack-y" style={{ gap: 32 }}>
          <SectionHeader heading={stack.heading} />
          <div className="ln-stack">
            {stack.groups.map((g) => (
              <div key={g.label} className="ln-stack__row">
                <span className="ln-label">{g.label}</span>
                {g.items.map((item) => (
                  <span key={item} className="ln-chip">{item}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <ContactPanel heading={site.contact.heading} />
    </>
  );
}
