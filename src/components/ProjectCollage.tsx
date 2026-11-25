import Link from "next/link";
import type { HomeProject } from "@/content/project-types";
import { CoverVideo } from "./CoverVideo";

/**
 * The plain-view project collage: one piece per project, linking to its case study. The home page
 * shows the highlighted projects; /projects shows all of them in the same layout.
 */
export function ProjectCollage({ projects }: { projects: HomeProject[] }) {
  return (
    <div className="ln-collage">
      {projects.map((p) => {
        const orgs = p.orgs ?? (p.org ? [p.org] : []);
        return (
          <Link key={p.slug} href={`/work/${p.slug}`} className={`ln-piece ln-piece--${p.slug}`}>
            <span className="ln-piece__frame">
              {p.cover.videoSrc ? (
                <span className="ln-iphone">
                  <span className="ln-iphone__btn ln-iphone__btn--action" aria-hidden="true" />
                  <span className="ln-iphone__btn ln-iphone__btn--vol1" aria-hidden="true" />
                  <span className="ln-iphone__btn ln-iphone__btn--vol2" aria-hidden="true" />
                  <span className="ln-iphone__btn ln-iphone__btn--power" aria-hidden="true" />
                  <span className="ln-iphone__screen">
                    <span className="ln-iphone__status" aria-hidden="true">
                      <span className="ln-iphone__time">9:41</span>
                      <span className="ln-iphone__island" />
                      <span className="ln-iphone__icons">
                        <svg viewBox="0 0 18 10" width="14" height="8" fill="currentColor">
                          <rect x="0" y="6" width="2.2" height="4" rx="0.6" />
                          <rect x="3.5" y="4" width="2.2" height="6" rx="0.6" />
                          <rect x="7" y="2" width="2.2" height="8" rx="0.6" />
                          <rect x="10.5" y="0" width="2.2" height="10" rx="0.6" />
                        </svg>
                        <span className="ln-iphone__bat" />
                      </span>
                    </span>
                    <CoverVideo
                      src={p.cover.videoSrc}
                      poster={p.cover.videoPoster ?? p.cover.src}
                      label={p.cover.alt}
                    />
                    <span className="ln-iphone__home" aria-hidden="true" />
                  </span>
                </span>
              ) : p.cover.srcDark ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.cover.src} alt={p.cover.alt} loading="lazy" className="ln-theme-light" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.cover.srcDark} alt={p.cover.alt} loading="lazy" className="ln-theme-dark" />
                </>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={p.cover.src} alt={p.cover.alt} loading="lazy" />
              )}
              <span className="ln-piece__hover" aria-hidden="true">
                <span className="ln-piece__more">Read more →</span>
              </span>
            </span>
            <span className="ln-piece__cap">
              <span className="ln-piece__head">
                <h3 className="ln-card__title">{p.title}</h3>
                {orgs.length > 0 && (
                  <span className="ln-piece__orgs">
                    {orgs.map((o) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img key={o.name} src={o.logo} alt={`${o.name} logo`} width={18} height={18} className="ln-card__org" />
                    ))}
                  </span>
                )}
              </span>
              <p className="ln-card__summary">{p.summary}</p>
              <span className="ln-card__meta">
                {p.area.toLowerCase()} · {p.year}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
