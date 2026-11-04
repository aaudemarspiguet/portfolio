import type { Metadata } from "next";
import Link from "next/link";
import { ContactPanel } from "@/components/ContactPanel";
import { ProjectCard } from "@/components/ProjectCard";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "All projects",
  description: `Every project by ${site.name}, each with a case study.`,
};

// Every `kind: "project"` entry, in list order. The home carousel shows only the highlighted ones.
export default function ProjectsPage() {
  const count = `${projects.length} ${projects.length === 1 ? "project" : "projects"}`;

  return (
    <>
      <div className="ln-wrap ln-page">
        <Link href="/#projects" className="ln-link ln-back">← Home</Link>
        <header className="ln-section-head">
          <h1>All projects</h1>
          <span className="ln-label">{count}</span>
        </header>
        <div className="ln-grid">
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </div>

      <ContactPanel heading={site.contact.caseStudyHeading} compact />
    </>
  );
}
