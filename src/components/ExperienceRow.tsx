import Link from "next/link";
import type { Logo } from "@/content/site";

/** Org initials for the monogram tile: first letters of the first two words, or the first two letters of a single word. */
export function monogram(org: string) {
  const words = org.split(/[\s/]+/).filter((w) => /[A-Za-z]/.test(w));
  if (words.length === 1) return words[0].replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();
  return words.slice(0, 2).map((w) => w.match(/[A-Za-z]/)![0].toUpperCase()).join("");
}

export function OrgLogo({ org, logo }: { org: string; logo?: Logo }) {
  if (!logo) {
    return (
      <span className="ln-logo ln-logo--mono" role="img" aria-label={`${org} logo`}>
        <span aria-hidden="true">{monogram(org)}</span>
      </span>
    );
  }
  return (
    <span className="ln-logo">
      {/* eslint-disable-next-line @next/next/no-img-element -- small static marks, no optimization needed */}
      <img src={logo.light} alt={logo.alt} width={48} height={48} className={logo.dark ? "ln-logo__light" : undefined} />
      {logo.dark && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo.dark} alt={logo.alt} width={48} height={48} className="ln-logo__dark" />
      )}
    </span>
  );
}

type Props = {
  org: string;
  title: string;
  line: string;
  when: string;
  where: string;
  logo?: Logo;
  caseStudy?: string;
};

export function ExperienceRow({ org, title, line, when, where, logo, caseStudy }: Props) {
  return (
    <li className="ln-list__row">
      <OrgLogo org={org} logo={logo} />
      <div className="ln-list__what">
        <span className="ln-list__role">{title}</span>
        <span className="ln-list__line">{line}</span>
        {caseStudy && <Link href={`/work/${caseStudy}`} className="ln-link">Case study →</Link>}
      </div>
      <div className="ln-list__meta">
        <span className="ln-caption">{when}</span>
        <span className="ln-caption">{where}</span>
      </div>
    </li>
  );
}
