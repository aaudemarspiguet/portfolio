import type { ReactNode } from "react";
import type { site } from "@/content/site";
import { CopyEmail } from "./CopyEmail";
import { NameTooltip } from "./NameTooltip";
import { TypingTagline } from "./TypingTagline";

export type HeroData = Pick<
  typeof site,
  "name" | "say" | "role" | "city" | "availability" | "taglines" | "email" | "links"
>;

/**
 * The intro the room hero and the plain hero share: name, meta line, typing tagline, the button
 * row and copy-email. `children` are extra buttons placed after "Email me".
 */
export function HeroIntro({
  hero,
  taglineClass,
  children,
}: {
  hero: HeroData;
  taglineClass: string;
  children?: ReactNode;
}) {
  const meta = [hero.role, hero.city, hero.availability].join(" · ").toLowerCase();
  return (
    <>
      <h1>
        <NameTooltip pronunciation={hero.say.pronunciation} meaning={hero.say.meaning}>
          {hero.name}
          <span className="ln-dot">.</span>
        </NameTooltip>
      </h1>
      <span className="ln-meta-line">{meta}</span>
      <TypingTagline lines={hero.taglines} className={taglineClass} />
      <div className="ln-btn-row">
        <a className="ln-btn ln-btn--primary" href={`mailto:${hero.email}`}>
          Email me
        </a>
        {children}
        <a className="ln-btn ln-btn--text" href={hero.links.github} target="_blank" rel="noopener noreferrer">
          GitHub ↗
        </a>
        <a className="ln-btn ln-btn--text" href={hero.links.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn ↗
        </a>
      </div>
      <CopyEmail email={hero.email} />
    </>
  );
}
