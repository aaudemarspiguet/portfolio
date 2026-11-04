export type Metric = { label?: string; value: string; base: string };
export type CaseStudy = {
  title: string;
  lede: string;
  meta: { role: string; timeline: string; team: string; stack: string; repo?: string; demo?: string };
  diagram?: { steps: string[]; model: number; caption: string };
  context?: { heading: string; body: string };
  problem?: { heading: string; body: string };
  approach: { heading: string; body: string; steps?: string[] };
  result?: { heading: string; metrics: Metric[]; body?: string };
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

export const projects: Project[] = [
  {
    slug: "handlab", area: "AI search", year: "2026",
    title: "Handlab Poker Intelligence",
    summary: "Search poker hand histories in your own words, from similar game situations to exact betting lines.",
    metric: { value: "3 paying clients", base: "Shipped by a two-person team" },
    tags: ["Pinecone", "SQL", "Pydantic"],
    caseStudy: {
      title: "Finding the poker hand you mean",
      lede: "At Handlab, I built search across 30,000 transcribed poker games. Players could describe a situation or ask for an exact betting line, with a different search path for each.",
      meta: { role: "Contract software engineer", timeline: "February to July 2026", team: "Two-person team", stack: "LLMs, Pinecone, SQL, Pydantic" },
      diagram: {
        steps: ["Player's question", "LLM → validated JSON", "Pre-written SQL blocks", "Matching hands"], model: 1,
        caption: "The exact-search path. Semantic search uses a separate Pinecone index of transcribed games.",
      },
      context: {
        heading: "A question about a past hand",
        body: "A poker player might remember a decision without remembering the game it came from. Handlab's coaching tool needed to find relevant hands from that description. Each game's events were transcribed from the player's point of view, making it possible to search for a situation such as taking one action when another would have been better.",
      },
      problem: {
        heading: "Two ways to search",
        body: "Finding a strategically similar situation is different from finding a specific sequence of bets. I worked on both: retrieval over written game records, and a structured query API for exact matches. Poker terminology mattered too, so the retrieval path expanded queries using a 400-term jargon dictionary.",
      },
      approach: {
        heading: "Let the model interpret the question",
        body: "For exact searches, the LLM returned a JSON description of the player's intent. Pydantic validated it, then the API assembled a query from pre-written SQL blocks. This kept query construction deterministic. The separate retrieval engine searched game transcripts indexed in Pinecone.",
      },
      result: {
        heading: "Shipped to paying clients",
        metrics: [{ label: "Adoption", value: "3", base: "paying clients" }, { label: "Search corpus", value: "30k", base: "transcribed poker games" }, { label: "Exact search", value: "3 sec", base: "response time" }],
        body: "We iterated on client feedback in monthly sprints.",
      },
    },
  },
  {
    slug: "ebara-data", area: "Data engineering", year: "2026",
    title: "Faster uploads at Ebara Elliott",
    summary: "A self-service app for loading files into Databricks, plus record matching across 15 data sources.",
    metric: { value: "60 min → 3 min", base: "Data ingestion time" },
    tags: ["Python", "Spark", "Databricks"],
    caseStudy: {
      title: "From an hour-long ticket to a three-minute upload",
      lede: "During my Ebara Elliott Energy internship, I built an app that let users load files into Databricks themselves. Data ingestion fell from 60 minutes to 3.",
      meta: { role: "Data engineer intern", timeline: "May to August 2026", team: "Ebara Elliott Energy", stack: "Python, Streamlit, Apache Spark, Databricks, RapidFuzz" },
      diagram: { steps: ["CSV / JSON / Parquet", "Streamlit upload", "Apache Spark", "Databricks tables"], model: 2, caption: "The self-service ingestion path, from an uploaded file to a Databricks table." },
      context: {
        heading: "Getting files into Databricks",
        body: "Loading data involved a manual ticket process with four to five people. I built a Python and Streamlit web app that accepted CSV, JSON, and Parquet files and used Apache Spark to load them into Databricks tables.",
      },
      problem: {
        heading: "Less waiting, fewer conflicting records",
        body: "The upload workflow took about an hour. I also worked on a separate record-linkage problem: data from 15 sources contained 8,200 linkage conflicts. Those records needed to be consolidated into a master schema.",
      },
      approach: {
        heading: "Automating uploads and matching records",
        body: "The upload app automated the ticket-based ingestion process. For record matching, I implemented a RapidFuzz pipeline with TF-IDF weighting and calibrated log-odds thresholds, then designed the master schema for the consolidated records.",
      },
      result: {
        heading: "Three-minute ingestion",
        metrics: [{ label: "Ingestion", value: "3 min", base: "previously 60 minutes" }, { label: "Master data", value: "2,082+", base: "golden records" }, { label: "Coverage", value: "15", base: "data sources" }],
      },
    },
  },
  {
    slug: "find-the-outfit", area: "University capstone", year: "2026 · In progress",
    title: "Find the Outfit",
    summary: "A daily fashion puzzle built with Shopbop mentors. Guess the hidden item in six tries, with warmer-or-colder feedback.",
    metric: { value: "116 tests", base: "Vitest unit tests added in paired sessions" },
    tags: ["TypeScript", "AWS Lambda", "Bedrock"],
    caseStudy: {
      title: "One hidden item, six guesses",
      lede: "Find the Outfit is a daily puzzle our five-person UW–Madison capstone team is building with Shopbop mentors. I work on the backend and run our weekly sprints as Scrum Master.",
      meta: { role: "Backend contributor and Scrum Master", timeline: "September 2026 to present", team: "Five students, with Shopbop mentors", stack: "TypeScript, Expo, AWS Lambda, API Gateway, S3, Bedrock, Amplify" },
      diagram: { steps: ["Free-text guess", "POST /guess", "Titan embeddings", "Warmer-or-colder score"], model: 2, caption: "The backend compares a guess with the hidden item's embedding to calculate a similarity score." },
      context: {
        heading: "A fashion puzzle for each day",
        body: "Players get one hidden Shopbop item and six free-text guesses. Attribute tiles, hints, and progressive photo reveals help them narrow it down. The Expo frontend connects to a serverless backend, and we demo the work to Shopbop mentors as the capstone develops.",
      },
      problem: {
        heading: "How close is a guess?",
        body: "A free-text guess needs feedback even when it doesn't name the item exactly. The backend scores semantic similarity so related descriptions can register as warmer. It also serves the daily puzzle and stores its photo stages in S3.",
      },
      approach: {
        heading: "Compare descriptions as vectors",
        body: "I paired with Nischal Bista on the backend design and implementation. Our sessions covered the Shopbop search client, puzzle builder, and Lambda handlers. Amazon Titan Text Embeddings V2 turns the guess and item description into normalized, 1,024-dimensional vectors; their dot product gives cosine similarity. We rescale that score between 0.15 and 0.7 into the game's 0–1 heat score.",
        steps: ["Serve the daily puzzle through GET /puzzle/today and score guesses through POST /guess.", "Add Vitest unit tests across the backend handlers, puzzle logic, Shopbop client, and frontend API client during the paired sessions."],
      },
      result: {
        heading: "Live, with more work ahead",
        metrics: [{ label: "Tests", value: "116", base: "unit tests added in paired sessions" }, { label: "Project status", value: "In progress", base: "live on AWS Amplify" }],
        body: "Sharath Kowdle, Triya Poondra, and Kavya Kanungo built the frontend. We demo the game to our Shopbop mentors as development continues.",
      },
    },
  },
  {
    slug: "saw", area: "Agent tooling", year: "2026 · In progress",
    title: "SAW: Shared Agent Workspace",
    summary: "A shared workspace where Codex and Claude Code can exchange messages and Git references while working together.",
    metric: { value: "5 MCP tools", base: "For messages and Git references" },
    tags: ["TypeScript", "MCP", "WebSockets"],
    caseStudy: {
      title: "Giving coding agents a shared workspace",
      lede: "I'm building SAW so Codex and Claude Code can pair-program in a shared workspace. Five MCP tools let them exchange chat messages and Git references.",
      meta: { role: "Project developer", timeline: "July 2026 to present", team: "Self-hosted project", stack: "TypeScript, Node.js, MCP, WebSockets, SQLite, Docker" },
      diagram: { steps: ["Codex / Claude Code", "MCP tools", "WebSocket relay", "SQLite state"], model: 1, caption: "The coordination layer exposes shared messages and Git references to connected coding agents." },
      approach: {
        heading: "Communication and persistence",
        body: "A custom WebSocket relay protocol handles communication between agents. I containerized the Node.js relay with Docker and stored its SQLite state on a mounted volume so it survives restarts. The service is running self-hosted.",
      },
    },
  },
  {
    slug: "llm-ablations", area: "Course research", year: "2026",
    title: "Safety and utility in LLMs",
    summary: "Replicating two interpretability papers to study how activation changes affect model refusals and reasoning.",
    metric: { value: "420 prompts", base: "Harmful prompts in the ablation evaluation" },
    tags: ["PyTorch", "Gemma", "Llama"],
    caseStudy: {
      title: "What changes when a safety direction is removed?",
      lede: "I led a five-person course research team replicating Difference-of-Means and ActSVD methods. We studied safety and utility in Gemma-2-2B-IT and Llama-3.1-8B-Instruct using PyTorch.",
      meta: { role: "Student research team lead", timeline: "January to May 2026", team: "Five students · CS 639, Deep Learning for NLP", stack: "PyTorch, Gemma-2-2B-IT, Llama-3.1-8B-Instruct, HelpSteer" },
      context: { heading: "Replicating interpretability work", body: "For our Deep Learning for NLP course, we replicated methods from two arXiv papers. The question was how model internals associated with safety relate to those associated with useful responses. Our work included Difference-of-Means activation ablations and an ActSVD replication." },
      problem: { heading: "Measure reasoning alongside refusals", body: "Changing a model's tendency to refuse harmful prompts only answers part of the question. We also measured reasoning accuracy and added two-way ablation tests: how removing the safety direction affects utility, and how removing the utility direction affects safety." },
      approach: {
        heading: "Test the directions in both ways",
        body: "We used Difference-of-Means ablation and extracted a utility direction from 37,000 HelpSteer response pairs. We also reproduced ActSVD, an activation-aware low-rank decomposition of model weights, using orthogonal projection to separate ranks associated with safety and utility.",
      },
      result: { heading: "The ablation results", metrics: [{ label: "Difference-of-Means", value: "93%", base: "attack success across 420 harmful prompts" }, { label: "Utility", value: "62%", base: "retained reasoning accuracy" }], body: "These results describe our course project's evaluation of the tested models." },
    },
  },
  {
    slug: "curio", area: "Education", year: "2024–25",
    title: "Curio",
    summary: "Generate a computer science curriculum and problem sets, with structured responses the worksheet renderer can use.",
    metric: { value: "Under 60 sec", base: "To generate a computer science curriculum" },
    tags: ["FastAPI", "React", "Pydantic"],
    caseStudy: {
      title: "From a model response to a working worksheet",
      lede: "Curio generates computer science curricula in under 60 seconds. I shipped the MVP at MadHacks 2024, then fixed worksheet errors by validating model output before it reached the frontend.",
      meta: { role: "Full-stack developer", timeline: "October 2024 to January 2025", team: "MadHacks 2024 project", stack: "FastAPI, GPT-4o, Pydantic, WeasyPrint, React, Tailwind CSS, Vercel" },
      diagram: { steps: ["GPT-4o response", "Pydantic validation", "React frontend", "Worksheet"], model: 1, caption: "Question-pattern schemas validate the response structure before the frontend receives it." },
      problem: { heading: "The worksheet expected a structure", body: "Unstructured model responses caused 13 null-pointer worksheet errors. The frontend needed predictable question data to render a worksheet." },
      approach: { heading: "Validate before rendering", body: "I defined 5 question-pattern JSON schemas and used Pydantic to validate GPT-4o responses before passing them to the React frontend. That addressed the worksheet errors caused by unstructured output." },
    },
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
export function nextProject(slug: string) {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
}
