// Copy is grounded in the base resume and its truth ledger.
export const site = {
  name: "Amogh Paruvelli",
  role: "Software engineer",
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
    resume: "/Amogh_Paruvelli_Resume.pdf",
    github: "https://github.com/aaudemarspiguet",
    linkedin: "https://www.linkedin.com/in/amogh-paruvelli",
    source: "https://github.com/aaudemarspiguet/portfolio",
  },
  work: { heading: "A few things I've built" },
  experience: {
    heading: "Where I've worked",
    roles: [
      {
        when: "May to Aug 2026",
        title: "Data Engineer Intern · Ebara Elliott Energy",
        line: "Built a self-service upload app that cut data ingestion from 60 minutes to 3. Consolidated records from 15 sources.",
        where: "Jeannette, PA",
      },
      {
        when: "Feb to Jul 2026",
        title: "Contract Software Engineer · Handlab Poker Intelligence",
        line: "Built poker-hand search using AI retrieval and structured SQL queries. Our two-person team shipped to 3 paying clients.",
        where: "Remote",
      },
      {
        when: "Jun to Sep 2025",
        title: "Software Engineer Intern · Spencer's Gifts / Spirit Halloween",
        line: "Wrote the Java endpoint for selected-store pickup status, Redis lookup calls, and 12 JUnit tests ahead of Halloween.",
        where: "Egg Harbor Township, NJ",
      },
    ],
    education: {
      when: "Graduating Dec 2026",
      title: "BS, Computer Science and Data Science · UW–Madison",
      line: "Coursework in operating systems, relational databases, matrix methods in ML, and deep learning for NLP.",
      where: "Madison, WI",
    },
  },
  about: {
    heading: "A little about me",
    paragraphs: [
      "I'm studying computer science and data science at UW–Madison, graduating in December 2026. My work has taken me from Java e-commerce endpoints to poker search and industrial data pipelines.",
      "At Handlab, I worked on two ways to search a hand history: finding similar situations in written game records, and turning a player's question into an exact SQL query.",
      "This semester, I'm building Find the Outfit with a five-person capstone team and Shopbop mentors. I work on the backend and run our weekly sprints. I'm also building SAW, a shared workspace for AI coding agents.",
    ],
  },
  stack: {
    heading: "Tools I've worked with",
    groups: [
      { label: "AI", items: ["PyTorch", "Pinecone", "Pydantic", "Amazon Bedrock", "MCP"] },
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
