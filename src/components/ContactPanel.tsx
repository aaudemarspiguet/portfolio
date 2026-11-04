import { site } from "@/content/site";
import { CopyEmail } from "./CopyEmail";
import { LocalTime } from "./LocalTime";

/** Near-black closing panel with scarlet wave lines behind white text. */
export function ContactPanel({ heading, compact }: { heading: string; compact?: boolean }) {
  return (
    <section id="contact" className="ln-section ln-contact" aria-labelledby="contact-heading">
      <div className="ln-wrap">
        <div className={compact ? "ln-panel ln-panel--compact" : "ln-panel"}>
          <svg className="ln-panel__waves" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 250 C 180 120, 330 380, 540 230 S 860 90, 1000 190" strokeWidth="3" />
            <path d="M0 290 C 200 170, 350 420, 560 270 S 880 140, 1000 240" strokeWidth="2" opacity="0.55" />
            <path d="M0 330 C 220 220, 370 450, 580 310 S 900 190, 1000 290" strokeWidth="1.5" opacity="0.3" />
          </svg>
          <h2 id="contact-heading">{heading}</h2>
          <div className="ln-btn-row">
            <a href={`mailto:${site.email}`} className="ln-btn ln-btn--primary">Email me</a>
            {!compact && <CopyEmail email={site.email} />}
          </div>
          <div className="ln-panel__foot">
            <span>© {site.contact.year} {site.name}</span>
            <span>
              {site.city} · <LocalTime timeZone={site.timeZone} />
            </span>
            <span>
              Built with {site.contact.builtWith} · <a href={site.links.source}>Source ↗</a>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
