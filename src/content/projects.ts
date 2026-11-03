// The four project slots and their case studies. All placeholders until the
// content phase. The first project is the lead: its metric is set in scarlet.

export type Metric = { label?: string; value: string; base: string };

export type CaseStudy = {
  title: string;
  lede: string;
  meta: { role: string; timeline: string; team: string; stack: string; repo: string; demo: string };
  diagram: { steps: string[]; model: number; caption: string };
  context: { heading: string; body: string };
  problem: { heading: string; body: string };
  approach: { heading: string; body: string; steps: string[]; code: string };
  result: { heading: string; metrics: Metric[]; body: string; chartCaption: string };
  lesson: { heading: string; body: string };
};

export type Project = {
  slug: string;
  area: string;
  year: string;
  title: string;
  summary: string;
  metric: Metric;
  tags: string[];
  caseStudy: CaseStudy;
};

const caseStudy = (area: string): CaseStudy => ({
  title: "[Case study title: the outcome in a few words]",
  lede: "[Two sentences: what the system does, and the one result that matters most.]",
  meta: {
    role: "[What you did]",
    timeline: "[Start] → [End]",
    team: "[Size and shape]",
    stack: "[Full stack, comma-separated]",
    repo: "#",
    demo: "#",
  },
  diagram: {
    steps: ["[Data in]", "[Retrieval or pipeline]", "[Model step]", "[Product surface]"],
    model: 2,
    caption: `[What the ${area.toLowerCase()} architecture diagram shows]`,
  },
  context: {
    heading: "[Where this happened and why it mattered]",
    body: "[The team, the product and the people who used it. Who was affected by the problem, and what it cost them. Three or four sentences.]",
  },
  problem: {
    heading: "[The constraint that made this hard]",
    body: "[State the problem as a measurable gap: what the number was, what it needed to be, and the limits you worked within (latency, cost, data size, deadline).]",
  },
  approach: {
    heading: "[What you built, and the decision that mattered most]",
    body: "[The approach in plain words. Name the options you weighed and why you picked this one.]",
    steps: [
      "[Step 1: what you measured or tried first]",
      "[Step 2: what you changed after seeing the results]",
      "[Step 3: how you shipped it and checked it in production]",
    ],
    code: "# [The key snippet: 5 to 15 lines that show the idea]\ndef [function_name]([args]):\n    ...",
  },
  result: {
    heading: "[What changed, in numbers]",
    metrics: [
      { label: "[Metric 1]", value: "[91.4%]", base: "[baseline 83.0%]" },
      { label: "[Metric 2]", value: "[38 ms]", base: "[from 120 ms]" },
      { label: "[Metric 3]", value: "[−40%]", base: "[cost per 1k requests]" },
    ],
    body: "[What the numbers meant for the people from Context. Who used it, and what they could do afterward that they couldn't before.]",
    chartCaption: "[What the chart shows, and over what period]",
  },
  lesson: {
    heading: "[The lesson, stated plainly]",
    body: "[One thing you would change with what you know now, and why. This is where depth shows; be specific.]",
  },
});

export const projects: Project[] = [
  {
    slug: "applied-ai",
    area: "Applied AI",
    year: "[Year]",
    title: "[Project title: an AI product shipped to real users]",
    summary: "[One sentence: the problem, and what you built to solve it.]",
    metric: { value: "[N users]", base: "[adoption or quality: baseline → result]" },
    tags: ["[Python]", "[LLM API]", "[Vector DB]"],
    caseStudy: caseStudy("Applied AI"),
  },
  {
    slug: "data-platform",
    area: "Data engineering",
    year: "[Year]",
    title: "[Project title: a pipeline or data platform]",
    summary: "[One sentence: the problem, and what you built to solve it.]",
    metric: { value: "[−68%]", base: "[processing time: baseline → result]" },
    tags: ["[Spark]", "[SQL]", "[Python]"],
    caseStudy: caseStudy("Data engineering"),
  },
  {
    slug: "backend-service",
    area: "Backend",
    year: "[Year]",
    title: "[Project title: a backend service under real load]",
    summary: "[One sentence: the problem, and what you built to solve it.]",
    metric: { value: "[N req/day]", base: "[traffic served or load removed]" },
    tags: ["[Java]", "[Redis]", "[SQL]"],
    caseStudy: caseStudy("Backend"),
  },
  {
    slug: "agents-research",
    area: "Agents or research",
    year: "[Year]",
    title: "[Project title: agent tooling or an LLM research result]",
    summary: "[One sentence: the problem, and what you built to solve it.]",
    metric: { value: "[N%]", base: "[the headline result]" },
    tags: ["[PyTorch]", "[MCP]"],
    caseStudy: caseStudy("Agents or research"),
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function nextProject(slug: string) {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
}
