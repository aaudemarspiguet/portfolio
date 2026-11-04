import { ContactPanel } from "@/components/ContactPanel";
import { CopyEmail } from "@/components/CopyEmail";
import { ProjectCard } from "@/components/ProjectCard";
import { Availability, NameTooltip, NowChip, SectionHeader, Squiggle } from "@/components/marks";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

export default function Home() {
  const { experience, about, stack } = site;

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

      <section id="work" className="ln-section">
        <div className="ln-wrap ln-stack-y">
          <SectionHeader label={`Selected work · ${projects.length} projects`} heading={site.work.heading} />
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
          <div className="ln-surface ln-list">
            {[...experience.roles, experience.education].map((r, i) => (
              <div key={i} className="ln-list__row">
                <span className="ln-caption ln-list__when">{r.when}</span>
                <div className="ln-list__what">
                  <span className="ln-list__role">{r.title}</span>
                  <span className="ln-list__line">{r.line}</span>
                </div>
                <span className="ln-caption">{r.where}</span>
              </div>
            ))}
          </div>
          <a href={site.links.resume} className="ln-btn ln-btn--text ln-after-list">Full résumé (PDF) ↗</a>
        </div>
      </section>

      <section id="about" className="ln-section">
        <div className="ln-wrap ln-stack-y">
          <SectionHeader heading={about.heading} />
          <div className="ln-about">
            <div className="ln-about__photo">
              <div className="ln-photo">
                <span className="ln-label">[Photo]</span>
                <span className="ln-sticker">{about.hometown}</span>
              </div>
            </div>
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
