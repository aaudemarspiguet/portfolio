import Link from "next/link";
import type { Logo } from "@/content/site";
import { OrgMark } from "./OrgMark";

type Props = {
  title: string;
  org: string;
  logo?: Logo;
  line: string;
  when: string;
  /** City, "Remote", or the "Education" label on the final row. */
  where: string;
  caseStudy?: string;
};

/** One row: dates left; the org's mark, role and result center; place right (#31). */
export function ExperienceRow({ title, org, logo, line, when, where, caseStudy }: Props) {
  return (
    <li className="ln-list__row">
      <span className="ln-caption ln-list__when">{when}</span>
      <div className="ln-list__what">
        {logo && <OrgMark org={org} logo={logo} />}
        <span className="ln-list__role">{logo ? title : `${title} · ${org}`}</span>
        <span className="ln-list__line">{line}</span>
        {caseStudy && <Link href={`/work/${caseStudy}`} className="ln-link">Case study →</Link>}
      </div>
      <span className="ln-caption ln-list__where">{where}</span>
    </li>
  );
}
