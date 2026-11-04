import { placeholder, placeholderMedia } from "./placeholder";

export type Metric = { label?: string; value: string; base: string };

/** Card or case-study media. `focus` works like CSS object-position. */
export type Media = { kind: "image" | "gif" | "video"; src: string; alt: string; focus?: string };

export type CaseStudy = {
  title: string;
  lede: string;
  meta: { role: string; timeline: string; team: string; stack: string };
  diagram?: { steps: string[]; model: number; caption: string };
  context?: { heading: string; body: string };
  problem?: { heading: string; body: string };
  approach: { heading: string; body: string; steps?: string[] };
  result?: { heading: string; metrics: Metric[]; body?: string };
};

/**
 * Project flags. Add either or both to a `kind: "project"` entry.
 * - `highlighted`: shown in the home page carousel, in list order.
 * - `current`: still being worked on. Gets a "Current" chip on its cover, and the
 *   first highlighted current project starts in the middle of the carousel.
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
  flags?: ProjectFlag[];
  links?: { live?: string; repo?: string };
  metric: Metric;
  tags: string[];
  caseStudy: CaseStudy;
};

// ---- Template copy (#4) ---------------------------------------------------
// Lengths match the real copy so layouts are tuned to realistic text.

const cover = (title: string): Media => ({
  kind: "image",
  src: placeholderMedia.cover,
  alt: placeholder(`Placeholder cover for ${title}`),
});

const metric = (): Metric => ({ value: placeholder("00 units"), base: placeholder("What the number measures") });

const summary = () =>
  placeholder("One or two sentences on what this is, who it's for, and the result that makes it worth a click.");

type Sections = { diagram?: boolean; context?: boolean; problem?: boolean; steps?: boolean; result?: number | false; resultBody?: boolean };

function caseStudy(meta: CaseStudy["meta"], s: Sections): CaseStudy {
  return {
    title: placeholder("A plain-language headline about the problem"),
    lede: placeholder(
      "Two sentences that set up the tension: what was hard, who it was for, and what we shipped. Written from the evidence kit's story draft.",
    ),
    meta,
    diagram: s.diagram
      ? { steps: [placeholder("Input"), placeholder("Step two"), placeholder("Step three"), placeholder("Output")], model: 1, caption: placeholder("One line on what the diagram shows, from the evidence kit.") }
      : undefined,
    context: s.context
      ? { heading: placeholder("The situation"), body: placeholder("A short paragraph of context: who uses this, what they were trying to do, and why the existing way fell short. Three or four sentences, specific enough that a reader outside the team can follow it without the jargon.") }
      : undefined,
    problem: s.problem
      ? { heading: placeholder("What made it hard"), body: placeholder("The constraint or failure that shaped the work. Name the real obstacle, with a number if the claims ledger has one, and say what a good outcome would have looked like.") }
      : undefined,
    approach: {
      heading: placeholder("What we built"),
      body: placeholder("How the system works and why it was built this way. Credit the team with \"we\", and use \"I\" only for the specific pieces that were mine. Three to five sentences, one idea each."),
      steps: s.steps ? [placeholder("First concrete step, as one sentence."), placeholder("Second concrete step, as one sentence.")] : undefined,
    },
    result: s.result
      ? {
          heading: placeholder("How it turned out"),
          metrics: Array.from({ length: s.result }, (_, i) => ({ label: placeholder(`Metric ${i + 1}`), value: placeholder("00"), base: placeholder("what it measures") })),
          body: s.resultBody ? placeholder("One or two sentences on what's still rough or what comes next.") : undefined,
        }
      : undefined,
  };
}

// ---- Entries ----------------------------------------------------------------
// Titles, dates, areas, stacks and team facts are real. Prose and metrics are template.

export const caseStudies: Project[] = [
  {
    slug: "find-the-outfit", kind: "project", area: "University capstone", year: "2026",
    title: "Find the Outfit", flags: ["current", "highlighted"],
    summary: summary(), cover: cover("Find the Outfit"), metric: metric(),
    org: { name: "Amazon", logo: "/logos/amazon.jpg" },
    tags: ["TypeScript", "AWS Lambda", "Bedrock"],
    caseStudy: caseStudy(
      { role: "Backend contributor and Scrum Master", timeline: "September 2026 to present", team: "Five students, with Shopbop mentors", stack: "TypeScript, Expo, AWS Lambda, API Gateway, S3, Bedrock, Amplify" },
      { diagram: true, context: true, problem: true, steps: true, result: 2, resultBody: true },
    ),
  },
  {
    slug: "saw", kind: "project", area: "Agent tooling", year: "2026",
    title: "SAW: Shared Agent Workspace", flags: ["current", "highlighted"],
    summary: summary(), cover: cover("SAW"), metric: metric(),
    tags: ["TypeScript", "MCP", "WebSockets"],
    caseStudy: caseStudy(
      { role: "Project developer", timeline: "July 2026 to present", team: "Self-hosted project", stack: "TypeScript, Node.js, MCP, WebSockets, SQLite, Docker" },
      { diagram: true },
    ),
  },
  {
    slug: "llm-ablations", kind: "project", area: "Course research", year: "2026",
    title: "Safety and utility in LLMs", flags: ["highlighted"],
    summary: summary(), cover: cover("Safety and utility in LLMs"), metric: metric(),
    tags: ["PyTorch", "Gemma", "Llama"],
    caseStudy: caseStudy(
      { role: "Student research team lead", timeline: "January to May 2026", team: "Five students · CS 639, Deep Learning for NLP", stack: "PyTorch, Gemma-2-2B-IT, Llama-3.1-8B-Instruct, HelpSteer" },
      { context: true, problem: true, result: 2, resultBody: true },
    ),
  },
  {
    slug: "curio", kind: "project", area: "Education", year: "2024–25",
    title: "Curio", flags: ["highlighted"],
    summary: summary(), cover: cover("Curio"), metric: metric(),
    tags: ["FastAPI", "React", "Pydantic"],
    caseStudy: caseStudy(
      { role: "Full-stack developer", timeline: "October 2024 to January 2025", team: "MadHacks 2024 project", stack: "FastAPI, GPT-4o, Pydantic, WeasyPrint, React, Tailwind CSS, Vercel" },
      { diagram: true, problem: true },
    ),
  },
  {
    slug: "handlab", kind: "work", area: "AI search", year: "2026",
    title: "Handlab Poker Intelligence",
    summary: summary(), cover: cover("Handlab Poker Intelligence"), metric: metric(),
    tags: ["Pinecone", "SQL", "Pydantic"],
    caseStudy: caseStudy(
      { role: "Contract software engineer", timeline: "February to July 2026", team: "Two-person team", stack: "LLMs, Pinecone, SQL, Pydantic" },
      { diagram: true, context: true, problem: true, result: 3, resultBody: true },
    ),
  },
  {
    slug: "ebara-data", kind: "work", area: "Data engineering", year: "2026",
    title: "Ebara Elliott Energy",
    summary: summary(), cover: cover("Ebara Elliott Energy"), metric: metric(),
    tags: ["Python", "Spark", "Databricks"],
    caseStudy: caseStudy(
      { role: "Data engineer intern", timeline: "May to August 2026", team: "Ebara Elliott Energy", stack: "Python, Streamlit, Apache Spark, Databricks, RapidFuzz" },
      { diagram: true, context: true, problem: true, result: 3 },
    ),
  },
];

/** The home page's project cards. Work case studies are reached from Experience. */
export const projects = caseStudies.filter((p) => p.kind === "project");

export const hasFlag = (p: Project, flag: ProjectFlag) => p.flags?.includes(flag) ?? false;

/** The home page carousel. */
export const highlightedProjects = projects.filter((p) => hasFlag(p, "highlighted"));

export function getProject(slug: string) {
  return caseStudies.find((p) => p.slug === slug);
}

/** The next case study of the same kind, wrapping around. */
export function nextProject(slug: string) {
  const current = getProject(slug);
  const group = caseStudies.filter((p) => p.kind === current?.kind);
  const i = group.findIndex((p) => p.slug === slug);
  return group[(i + 1) % group.length];
}
