import Link from "next/link";
import type { HomeProject } from "@/content/project-types";
import { site, type Role } from "@/content/site";
import { ContactPanel } from "./ContactPanel";
import { ExperienceRow } from "./ExperienceRow";
import { HeroIntro } from "./HeroIntro";
import { SectionHeader } from "./marks";
import { ProjectCollage } from "./ProjectCollage";

// The home page's plain and About views. They render on the server and reach HomeStudio as
// slots, so room state changes on the client never re-render them.

/** The About view's copy. The room's About peek shows the same paragraphs. */
export function AboutCopy() {
  return (
    <div className="ln-about-copy">
      {site.about.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

export function AboutView() {
  return (
    <section className="ln-section ln-aboutpage" id="about">
      <SectionHeader as="h1" heading={site.about.heading} />
      <AboutCopy />
    </section>
  );
}

export function PlainView({ projects, roles }: { projects: HomeProject[]; roles: Role[] }) {
  const { education, stack } = site;
  return (
    <>
      <div className="ln-wrap">
        <section className="ln-plainhero" aria-label="Intro">
          <HeroIntro hero={site} taglineClass="ln-plainhero__lede" />
        </section>

        <section className="ln-section" id="work">
          <SectionHeader
            heading={site.projects.heading}
            label={`highlighted projects · ${projects.length}`}
            action={
              <Link href="/projects" className="ln-link ln-more">
                All projects →
              </Link>
            }
          />
          <ProjectCollage projects={projects} />
        </section>

        <section className="ln-section" id="experience">
          <SectionHeader heading={site.experience.heading} label={`experience · ${roles.length} roles`} />
          <ul className="ln-list">
            {roles.map((r) => (
              <ExperienceRow
                key={`${r.org}-${r.when}`}
                title={r.title}
                org={r.org}
                logo={r.logo}
                line={r.line}
                when={r.when}
                where={r.where}
                caseStudy={r.caseStudy}
              />
            ))}
          </ul>
        </section>

        <section className="ln-section" id="background">
          <SectionHeader heading="Education and tools" label="background" />
          <div className="ln-school">
            {education.logo && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={education.logo.light} alt={`${education.school} logo`} />
            )}
            <div className="ln-school__text">
              <span className="ln-school__name">{education.school}</span>
              <span className="ln-school__deg">{education.degree}</span>
              <span className="ln-school__deg">{education.line}</span>
            </div>
            <span className="ln-school__when">{education.when.toLowerCase()}</span>
          </div>
          <div className="ln-stack">
            {stack.groups.map((g) => (
              <div key={g.label} className="ln-stack__row">
                <span className="ln-label">{g.label}</span>
                <div className="ln-stack__chips">
                  {g.items.map((item) => (
                    <span key={item} className="ln-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <ContactPanel heading={site.contact.heading} />
    </>
  );
}
