import type { Metadata } from "next";
import Link from "next/link";
import { ContactPanel } from "@/components/ContactPanel";
import { ProjectCollage } from "@/components/ProjectCollage";
import { projectDTOs } from "@/content/projects";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "All projects",
  description: `Every project by ${site.name}, each with a case study.`,
};

// Every `kind: "project"` entry, in the same collage the home page uses for its highlighted ones.
export default function ProjectsPage() {
  return (
    <>
      <div className="ln-wrap ln-page">
        <Link href="/#work" className="ln-link ln-back">← Home</Link>
        <section className="ln-section" aria-labelledby="all-projects">
          <div className="ln-section-head">
            <h1 id="all-projects">All projects</h1>
            <div className="ln-section-head__sub">
              <span className="ln-label">every project · {projectDTOs.length}</span>
            </div>
          </div>
          <ProjectCollage projects={projectDTOs} />
        </section>
      </div>

      <ContactPanel heading={site.contact.caseStudyHeading} compact />
    </>
  );
}
