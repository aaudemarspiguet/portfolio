import { HomeStudio } from "@/components/HomeStudio";
import { AboutCopy, AboutView, PlainView } from "@/components/PlainHome";
import { getProject, highlightedProjectDTOs } from "@/content/projects";
import { site } from "@/content/site";

export default function Home() {
  // A role links to its case study only once that case study is public.
  const roles = site.experience.roles.map((r) => ({
    ...r,
    caseStudy: r.caseStudy && getProject(r.caseStudy) ? r.caseStudy : undefined,
  }));
  const { name, say, role, city, availability, taglines, email, links } = site;

  return (
    <HomeStudio
      hero={{ name, say, role, city, availability, taglines, email, links }}
      projects={highlightedProjectDTOs}
      roles={roles}
      aboutCopy={<AboutCopy />}
      aboutView={<AboutView />}
      plainView={<PlainView projects={highlightedProjectDTOs} roles={roles} />}
    />
  );
}
