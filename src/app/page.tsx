import { ContactPanel } from "@/components/ContactPanel";
import { HomeStudio } from "@/components/HomeStudio";
import { getProject, highlightedProjects } from "@/content/projects";
import { site } from "@/content/site";

export default function Home() {
  const roleCaseStudies: Record<string, string | undefined> = {};
  for (const r of site.experience.roles) {
    if (r.caseStudy && getProject(r.caseStudy)) {
      roleCaseStudies[r.caseStudy] = r.caseStudy;
    }
  }

  return (
    <HomeStudio
      siteData={site}
      projects={highlightedProjects}
      roleCaseStudies={roleCaseStudies}
      contactPanel={<ContactPanel heading={site.contact.heading} />}
    />
  );
}
