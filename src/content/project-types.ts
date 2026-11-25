export type Metric = { label?: string; value: string; base: string };

/** Card or case-study media. `focus` works like CSS object-position. */
export type Media = {
  kind: "image" | "gif" | "video";
  src: string;
  alt: string;
  focus?: string;
  /** Shown instead of `src` in dark mode (images only). */
  srcDark?: string;
  /** Optional muted loop clip for HTML card stages while 3D room uses `src`. */
  videoSrc?: string;
  videoPoster?: string;
};

/** Someone credited on a case study. `link` is their LinkedIn when we have it. */
export type Person = { name: string; link?: string };

/** A captioned image in a case study. Width and height are the file's pixels, so the frame reserves its space. */
export type Figure = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  /** Shown instead of `src` in dark mode, same size. */
  srcDark?: string;
};

/** One paragraph, or several. */
export type Body = string | string[];

/** `more` adds one link after the body, e.g. to the case study that already teaches a term. */
export type Section = { heading: string; body: Body; more?: { href: string; label: string } };

/** A side of a box in the architecture diagram: left, right, top, bottom. */
export type Side = "l" | "r" | "t" | "b";

/**
 * A system diagram drawn from the evidence kit's `visuals/architecture`.
 * Boxes sit on a grid (`at` is [column, row]); edges route at right angles.
 * An edge with `step` shows a numbered badge that matches the walkthrough's list item.
 */
export type Architecture = {
  cols: number;
  rows: number;
  nodes: { id: string; label: string; sub?: string; at: [number, number]; kind?: "store" | "model" | "stop" }[];
  /** `dashed` is for control flow rather than data, e.g. a runner that drives a step. */
  edges: { from: string; to: string; step?: number; exit?: Side; enter?: Side; stop?: boolean; dashed?: boolean }[];
  groups?: { label: string; nodes: string[] }[];
  caption: string;
};

export type CaseStudy = {
  title: string;
  lede: string;
  /**
   * `role` is a plain, recognisable title; the story carries the specifics.
   * Team work lists `partners` (shown as "Partners"). `team` is free text for the rest.
   */
  meta: { role: string; timeline: string; team?: string; partners?: Person[]; stack: string };
  /** The one-line strip under the meta row. Superseded by `architecture` where a kit has a system diagram. */
  diagram?: { steps: string[]; model: number; caption: string };
  context?: Section;
  problem?: Section;
  /** Teaches the one idea a reader needs before the system makes sense. */
  explainer?: Section;
  architecture?: Architecture;
  /** One request's trip through the architecture. Item n matches badge n. */
  walkthrough?: { heading: string; intro?: string; steps: string[] };
  approach: { heading: string; body: Body; steps?: string[] };
  figures?: Figure[];
  /** Deeper sections after the figures: the hard part, the evaluation. */
  sections?: Section[];
  result?: { heading: string; metrics: Metric[]; body?: string };
  lessons?: { title: string; body: string }[];
};

/**
 * Project flags. Add either or both to a `kind: "project"` entry (evaluated server-side only).
 * - `highlighted`: shown in the home page grid, in list order.
 * - `current`: still being worked on. Gets a "Current" chip on its cover.
 */
export type ProjectFlag = "current" | "highlighted";

/**
 * A case study. `kind: "project"` entries are the home page's project cards.
 * `kind: "work"` entries belong to a job and are linked from its experience row.
 */
export type Project = {
  slug: string;
  kind: "project" | "work";
  area: string;
  year: string;
  title: string;
  summary: string;
  cover: Media;
  /** Org tied to the project, shown as a small square logo before `area` on the card. */
  org?: { name: string; logo: string };
  /** Multiple orgs tied to the project (e.g. Amazon + Shopbop). */
  orgs?: { name: string; logo: string }[];
  flags?: ProjectFlag[];
  /** Draft entries stay hidden on the server unless SHOW_DRAFTS=1. */
  draft?: boolean;
  links?: { live?: string; repo?: string };
  /** The card's headline result. Leave it out rather than fill it with a count of tests or commits. */
  metric?: Metric;
  tags: string[];
  caseStudy: CaseStudy;
};

/** Public, flag-stripped projection safe to serialize from Server Components into Client Components. */
export type HomeProject = Pick<
  Project,
  "slug" | "area" | "year" | "title" | "summary" | "cover" | "org" | "orgs" | "tags"
> & {
  lede: string;
};
