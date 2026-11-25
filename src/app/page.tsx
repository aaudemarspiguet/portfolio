import { ContactPanel } from "@/components/ContactPanel";
import { HomeStudio } from "@/components/HomeStudio";
import { getProject, highlightedProjectDTOs } from "@/content/projects";
import { site } from "@/content/site";

export default function Home() {
  const roleCaseStudies: Record<string, string | undefined> = {};
  const roles = site.experience.roles.map((r) => {
    const activeSlug = r.caseStudy && getProject(r.caseStudy) ? r.caseStudy : undefined;
    if (activeSlug) roleCaseStudies[activeSlug] = activeSlug;
    return { ...r, caseStudy: activeSlug };
  });

  const publicSite = {
    ...site,
    experience: {
      ...site.experience,
      roles,
    },
  };

  return (
    <HomeStudio
      siteData={publicSite}
      projects={highlightedProjectDTOs}
      roleCaseStudies={roleCaseStudies}
      contactPanel={<ContactPanel heading={site.contact.heading} />}
    />
  );
}
