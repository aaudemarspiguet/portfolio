import type { Metadata } from "next";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectCarousel } from "@/components/ProjectCarousel";
import { SectionHeader } from "@/components/marks";
import { projects } from "@/content/projects";

// Temporary comparison page for #6: carousel (shipped on home) vs media grid.
// Delete once the layout is settled.
export const metadata: Metadata = {
  title: "Card layouts (lab)",
  robots: { index: false, follow: false },
};

export default function CardsLab() {
  return (
    <>
      <section className="ln-section">
        <ProjectCarousel projects={projects} header={<SectionHeader label="Variant A · Parallax carousel" heading="Carousel" />} />
      </section>
      <section className="ln-section">
        <div className="ln-wrap ln-stack-y">
          <SectionHeader label="Variant B · Media grid" heading="Grid" />
          <div className="ln-grid">
            {projects.map((p, i) => (
              <ProjectCard key={p.slug} project={p} lead={i === 0} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
