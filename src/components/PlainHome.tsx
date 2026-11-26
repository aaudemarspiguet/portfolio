import Link from "next/link";
import type { HomeProject } from "@/content/project-types";
import { site, type Role } from "@/content/site";
import { BackgroundBlock } from "./Background";
import { ContactPanel } from "./ContactPanel";
import { ExperienceRow } from "./ExperienceRow";
import { SectionHeader } from "./marks";
import { ProjectCollage } from "./ProjectCollage";

// The home page's plain view (one long scroll). It renders on the server and reaches HomeStudio as
// a slot, so room state changes on the client never re-render it.

/** The About paragraphs. The room's About sheet shows the same copy. */
export function AboutCopy() {
  return (
    <div className="ln-about-copy">
      {site.about.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

export function PlainView({ projects, roles }: { projects: HomeProject[]; roles: Role[] }) {
  return (
    <>
      <div className="ln-wrap">
        {/* The hero comes first, but it lives in HomeStudio's stage: one hero for both views. */}
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

        {/* About and Background are one section now: the paragraphs, then education and tools.
            The #background anchor stays on the second half so old links still land there. */}
        <section className="ln-section" id="about">
          <SectionHeader heading={site.about.heading} label="about" />
          <AboutCopy />
          <div className="ln-about-bg" id="background">
            <h3 className="ln-about-bg__heading">Education and tools</h3>
            <BackgroundBlock />
          </div>
        </section>
      </div>

      <ContactPanel heading={site.contact.heading} />
    </>
  );
}
