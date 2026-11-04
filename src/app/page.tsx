import Image from "next/image";
import Link from "next/link";
import { ContactPanel } from "@/components/ContactPanel";
import { CopyEmail } from "@/components/CopyEmail";
import { ExperienceRow } from "@/components/ExperienceRow";
import { ProjectCarousel } from "@/components/ProjectCarousel";
import { NameTooltip } from "@/components/NameTooltip";
import { Availability, NowChip, SectionHeader, Squiggle } from "@/components/marks";
import { highlightedProjects } from "@/content/projects";
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
              <a href={site.links.github} className="ln-btn ln-btn--text">GitHub ↗</a>
              <a href={site.links.linkedin} className="ln-btn ln-btn--text">LinkedIn ↗</a>
            </div>
            <CopyEmail email={site.email} />
          </div>
        </div>
      </section>

      <section id="projects" className="ln-section">
        <ProjectCarousel projects={highlightedProjects} header={<SectionHeader label="Highlighted projects" heading={site.projects.heading} />} />
        <div className="ln-wrap ln-section-foot">
          <Link href="/projects" className="ln-link ln-more">All projects →</Link>
        </div>
      </section>

      <section id="experience" className="ln-section">
        <div className="ln-wrap ln-stack-y">
          <SectionHeader label={`Experience · ${experience.roles.length} roles`} heading={experience.heading} />
          <ul className="ln-surface ln-list">
            {experience.roles.map((r) => (
              <ExperienceRow key={`${r.org}-${r.when}`} title={r.title} org={r.org} logo={r.logo} line={r.line} when={r.when} where={r.where} caseStudy={r.caseStudy} />
            ))}
            <ExperienceRow title={education.degree} org={education.school} logo={education.logo} line={education.line} when={education.when} where="Education" />
          </ul>
        </div>
      </section>

      <section id="about" className="ln-section">
        <div className="ln-wrap ln-stack-y">
          <SectionHeader heading={about.heading} />
          <div className="ln-about">
            <div className="ln-about__photo">
              <div className="ln-photo">
                {about.photo ? (
                  <Image src={about.photo.src} alt={about.photo.alt} fill sizes="(max-width: 640px) 100vw, 280px" />
                ) : (
                  <span className="ln-label">Photo</span>
                )}
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
        <div className="ln-wrap ln-stack-y">
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
