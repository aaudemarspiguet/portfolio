import { notFound } from "next/navigation";
import { caseStudyCard, ogSize } from "@/components/OgCard";
import { caseStudySlugs, getProject } from "@/content/projects";
import { site } from "@/content/site";

export const alt = `A case study from ${site.name}`;
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return caseStudySlugs.map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  return caseStudyCard(project);
}
