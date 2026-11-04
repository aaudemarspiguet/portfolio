// Home page content. Case studies live in projects.ts.
// Copy is Amogh's own (tag copy-v1), with lines changed where an evidence kit disagrees.

export type Logo = { light: string; dark?: string };

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

const roles: Role[] = [
  { title: "Data Engineer Intern", org: "Ebara Elliott Energy", when: "May to Aug 2026", where: "Jeannette, PA", line: "Built a self-service upload app that cut data ingestion from 60 minutes to 3. Consolidated records from 15 sources.", caseStudy: "ebara-data", logo: { light: "/logos/ebara-elliott.jpg" } },
  { title: "Contract Software Engineer", org: "Handlab Poker Intelligence", when: "Feb to Jul 2026", where: "Remote", line: "Built zip uploads for a poker hand tracker with plain-English search, so a folder of 11 session files imports 505 hands at once.", caseStudy: "handlab", logo: { light: "/logos/handlab.svg" } },
  { title: "Software Engineer Intern", org: "Spencer's Gifts / Spirit Halloween", when: "Jun to Sep 2025", where: "Egg Harbor Township, NJ", line: "Wrote the Java endpoint for selected-store pickup status, Redis lookup calls, and 12 JUnit tests ahead of Halloween.", logo: { light: "/logos/spencers.jpg" } },
];

const education: Education = {
  school: "University of Wisconsin–Madison",
  degree: "BS, Computer Science and Data Science",
  when: "Graduating Dec 2026",
  line: "Coursework in operating systems, relational databases, matrix methods in ML, and deep learning for NLP.",
  logo: { light: "/logos/uw-madison.jpg" },
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
  description: "Amogh Paruvelli is a software engineer studying computer science and data science at UW–Madison. Work in AI search, data engineering, and backend development.",
  lede: {
    highlight: "I build AI tools and data systems.",
    rest: " I've helped poker players search their hands and cut a data upload from an hour to three minutes.",
  },
  now: "Building a daily fashion puzzle with Shopbop mentors",
  email: "amoghparuvelli@gmail.com",
  links: {
    github: "https://github.com/aaudemarspiguet",
    linkedin: "https://www.linkedin.com/in/amogh-paruvelli",
    source: "https://github.com/aaudemarspiguet/portfolio",
  },
  projects: { heading: "A few things I've built" },
  experience: {
    heading: "Where I've worked",
    roles,
  },
  education,
  about: {
    heading: "A little about me",
    /** Portrait in public/, 4:5. Until it exists the About section shows text only. */
    photo: undefined as { src: string; alt: string } | undefined,
    /** Sticker on the photo's corner (#8). */
    hometown: "Pittsburgh, PA",
    paragraphs: [
      "I'm studying computer science and data science at UW–Madison, graduating in December 2026. My work has taken me from Java e-commerce endpoints to poker search and industrial data pipelines.",
      "At Handlab, I built zip uploads for a poker tracker that answers questions about your hands in plain English. An LLM turns each question into a checked plan, and ordinary code runs it.",
      "This semester, I'm building Find the Outfit with a five-person capstone team and Shopbop mentors. I work on the backend and run our weekly sprints. I'm also building SAW, a shared workspace for AI coding agents.",
    ],
  },
  stack: {
    heading: "Tools I've worked with",
    groups: [
      { label: "AI", items: ["PyTorch", "Pydantic", "Amazon Bedrock", "MCP"] },
      { label: "Data", items: ["SQL / PostgreSQL", "PySpark", "Databricks", "Redis"] },
      { label: "Software", items: ["Python / FastAPI", "TypeScript / React", "Java / Spring MVC", "AWS", "Docker"] },
    ],
  },
  contact: {
    heading: "I'm looking for my first full-time software role.",
    caseStudyHeading: "Want to talk about the work?",
    year: "2026",
    builtWith: "Next.js and React",
  },
};
