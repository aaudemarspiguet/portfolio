import { site } from "@/content/site";

/**
 * Education and tools. It sits at the end of the About section in the plain scroll, and is the
 * Background page of the room's About sheet.
 */
export function BackgroundBlock() {
  const { education, stack } = site;
  return (
    <>
      <div className="ln-school">
        {education.logo && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={education.logo.light} alt={`${education.school} logo`} />
        )}
        <div className="ln-school__text">
          <span className="ln-school__name">{education.school}</span>
          <span className="ln-school__deg">{education.degree}</span>
          <span className="ln-school__deg">{education.line}</span>
        </div>
        <span className="ln-school__when">{education.when.toLowerCase()}</span>
      </div>
      <div className="ln-stack">
        {stack.groups.map((g) => (
          <div key={g.label} className="ln-stack__row">
            <span className="ln-label">{g.label}</span>
            <div className="ln-stack__chips">
              {g.items.map((item) => (
                <span key={item} className="ln-chip">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
