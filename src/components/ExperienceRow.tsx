import Link from "next/link";

type Props = {
  title: string;
  line: string;
  when: string;
  /** City, "Remote", or the "Education" label on the final row. */
  where: string;
  caseStudy?: string;
};

/** One text-only row: dates left, role and result center, place right (#31). */
export function ExperienceRow({ title, line, when, where, caseStudy }: Props) {
  return (
    <li className="ln-list__row">
      <span className="ln-caption ln-list__when">{when}</span>
      <div className="ln-list__what">
        <span className="ln-list__role">{title}</span>
        <span className="ln-list__line">{line}</span>
        {caseStudy && <Link href={`/work/${caseStudy}`} className="ln-link">Case study →</Link>}
      </div>
      <span className="ln-caption ln-list__where">{where}</span>
    </li>
  );
}
