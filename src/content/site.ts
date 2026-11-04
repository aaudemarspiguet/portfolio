// Home page content. Case studies live in projects.ts.
// Template mode (#4): prose goes through placeholder(). Names, links, orgs,
// titles, dates and places are real.
import { placeholder } from "./placeholder";

export type Logo = { light: string; dark?: string; alt: string };

export type Role = {
  title: string;
  org: string;
  when: string;
  where: string;
  line: string;
  /** Square mark in public/logos, shown inline after the title; hovering it names the org (#31). Without one, the org name shows as text. */
  logo?: Logo;
  /** Slug of a `kind: "work"` case study in projects.ts. */
  caseStudy?: string;
};

export type Education = {
  school: string;
  degree: string;
  when: string;
  line: string;
  logo?: Logo;
};

const roleLine = () =>
  placeholder("One line on what I built and the result, with the number from the claims ledger and the main tool.");

const roles: Role[] = [
  { title: "Data Engineer Intern", org: "Ebara Elliott Energy", when: "May to Aug 2026", where: "Jeannette, PA", line: roleLine(), caseStudy: "ebara-data", logo: { light: "/logos/ebara-elliott.jpg", alt: "Ebara Elliott Energy logo" } },
  { title: "Contract Software Engineer", org: "Handlab Poker Intelligence", when: "Feb to Jul 2026", where: "Remote", line: roleLine(), caseStudy: "handlab", logo: { light: "/logos/handlab.svg", alt: "Handlab logo" } },
  { title: "Software Engineer Intern", org: "Spencer's Gifts / Spirit Halloween", when: "Jun to Sep 2025", where: "Egg Harbor Township, NJ", line: roleLine(), logo: { light: "/logos/spencers.jpg", alt: "Spencer's logo" } },
];

const education: Education = {
  school: "University of Wisconsin–Madison",
  degree: "BS, Computer Science and Data Science",
  when: "Graduating Dec 2026",
  line: placeholder("Relevant coursework, in one line."),
  logo: { light: "/logos/uw-madison.jpg", alt: "University of Wisconsin–Madison crest" },
};

export const site = {
  name: "Amogh Paruvelli",
  /** Nav wordmark (#5). */
  brand: "amoghmade.dev",
  role: "Software Engineer",
  city: "Madison, WI",
  availability: "Graduating December 2026",
  timeZone: "America/Chicago",
  say: { pronunciation: "uh-MOH-g", meaning: "unerring" },
  description: placeholder("One sentence for search results: who I am, what I build, and where I study."),
  lede: {
    highlight: placeholder("A short claim about what I build."),
    rest: placeholder(" One sentence of proof, naming two specific results from the work below."),
  },
  now: placeholder("What I'm working on this month"),
  email: "amoghparuvelli@gmail.com",
  links: {
    github: "https://github.com/aaudemarspiguet",
    linkedin: "https://www.linkedin.com/in/amogh-paruvelli",
    source: "https://github.com/aaudemarspiguet/portfolio",
  },
  projects: { heading: placeholder("A few things I've built") },
  experience: {
    heading: placeholder("Where I've worked"),
    roles,
  },
  education,
  about: {
    heading: placeholder("A little about me"),
    paragraphs: [
      placeholder("Where I study, when I graduate, and the thread that connects the work. Two or three sentences in my own voice, not a summary of the résumé."),
      placeholder("One paragraph on the problem I've enjoyed most and what it taught me. Specific enough to start a conversation in an interview."),
      placeholder("What I'm building right now and who with. Name the team and the part that's mine."),
    ],
  },
  stack: {
    heading: placeholder("Tools I've worked with"),
    groups: [
      { label: "AI", items: ["PyTorch", "Pinecone", "Pydantic", "Amazon Bedrock", "MCP"] },
      { label: "Data", items: ["SQL / PostgreSQL", "PySpark", "Databricks", "Redis"] },
      { label: "Software", items: ["Python / FastAPI", "TypeScript / React", "Java / Spring MVC", "AWS", "Docker"] },
    ],
  },
  contact: {
    heading: placeholder("One line on the role I'm looking for."),
    caseStudyHeading: placeholder("Want to talk about the work?"),
    year: "2026",
    builtWith: "Next.js and React",
  },
};
