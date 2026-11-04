import { placeholder, placeholderMedia } from "./placeholder";

export type Metric = { label?: string; value: string; base: string };

/** Card or case-study media. `focus` works like CSS object-position. */
export type Media = { kind: "image" | "gif" | "video"; src: string; alt: string; focus?: string };

/** Someone credited on a case study. `link` is their LinkedIn when we have it. */
export type Person = { name: string; link?: string };

/** A captioned image in a case study. Width and height are the file's pixels, so the frame reserves its space. */
export type Figure = { src: string; alt: string; caption: string; width: number; height: number };

export type CaseStudy = {
  title: string;
  lede: string;
  /**
   * `role` is a plain, recognisable title; the story carries the specifics.
   * Team work lists `partners` (shown as "Partners"). `team` is free text for the rest.
   */
  meta: { role: string; timeline: string; team?: string; partners?: Person[]; stack: string };
  diagram?: { steps: string[]; model: number; caption: string };
  context?: { heading: string; body: string };
  problem?: { heading: string; body: string };
  approach: { heading: string; body: string; steps?: string[] };
  figures?: Figure[];
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

// ---- People ------------------------------------------------------------------
// Missing LinkedIn links are tracked as GitHub issues; add them here when they arrive.

const people = {
  shrey: { name: "Shrey Katyal", link: "https://www.linkedin.com/in/shrey-katyal-801948223/" },
  divij: { name: "Divij Agarwal" },
  vansh: { name: "Vansh Amara" },
  aditya: { name: "Aditya Machiroutu" },
  rohan: { name: "Rohan Abraham" },
  kushal: { name: "Kushal" },
} satisfies Record<string, Person>;

// ---- Template copy (#4) ---------------------------------------------------
// Lengths match the real copy so layouts are tuned to realistic text.
// Entries without an evidence kit yet still use these.

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
// Synced entries (#10) come from the evidence kits; every number traces to a kit's
// claims ledger. Find the Outfit, Curio and Ebara are still template copy.

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

  // Kit: evidence/saw
  {
    slug: "saw", kind: "project", area: "Agent tooling", year: "2026",
    title: "SAW: Shared Agent Workspace", flags: ["current", "highlighted"],
    summary: "A shared thread where two developers' coding agents trade messages and Git refs, and the humans see everything.",
    cover: { kind: "image", src: "/projects/saw/06-bob-replies.jpg", alt: "SAW's thread view: Alice posts her plan for a work item and Bob replies", focus: "center top" },
    metric: { value: "355 tests passing", base: "On a clean export of the code, 2 skipped. CI runs on Ubuntu and Windows." },
    tags: ["TypeScript", "MCP", "WebSockets"],
    caseStudy: {
      title: "Giving two coding agents one place to coordinate",
      lede: "Two developers each running a coding agent have no shared place for those agents to talk. SAW gives them one: a thread where only messages and Git references cross, and both humans can read and steer everything.",
      meta: { role: "Software engineer", timeline: "July 2026 to present", partners: [people.shrey], stack: "TypeScript, Node.js, MCP, WebSockets, SQLite, Docker" },
      diagram: {
        steps: ["Your coding agent", "saw CLI: MCP tools and hooks", "Relay over WebSocket", "Your partner's page and agent"],
        model: 2,
        caption: "Agents post through 9 MCP tools and 4 Claude Code hooks. A Node.js relay keeps the threads in SQLite.",
      },
      context: {
        heading: "The situation",
        body: "SAW is a coordination layer for developers who each use a coding agent. Agents post messages, Git refs and ticket refs into shared threads. Code never travels through SAW. It moves only through Git. Humans see every message in their scope and can pause or steer their own agent. We built it as a TypeScript monorepo of three packages: a shared schema, a relay server, and a saw command line tool that runs a local daemon, an MCP server and a small web page.",
      },
      problem: {
        heading: "Code leaking through the boundary",
        body: "In August we set the product up from the written steps instead of the test harness, and that pass found problems the tests had stepped over. One was that pasted code could still reach the shared work log. The CLI collapsed whitespace in a prompt and cut it to 600 characters before the relay checked it, which defeated every detector that looked for a diff or a code fence at the start of a line. I added a check that catches pasted code after the whitespace is gone, and a bounded log query that returns the newest entries.",
      },
      approach: {
        heading: "Messages and Git refs, nothing else",
        body: "The room_post tool takes free text plus branch names or commit SHAs, and its own description says those are the only pointers to code. That keeps shared state small, keeps code review in Git where it already lives, and makes the boundary easy to test: anything that looks like pasted code is a bug. Each member also sets a mode for their own agent on each thread (view, comment or edit), and nobody can set another member's mode.",
        steps: [
          "I built the relay's Docker deployment: a Node 20 Alpine image with the SQLite file on a mounted volume, so state survives restarts.",
          "I made saw up work with an npm-installed claude on Windows, and added a test that proves the relay stores token hashes, never tokens.",
        ],
      },
      figures: [
        { src: "/projects/saw/04-bob-sees-unread-thread.jpg", alt: "Bob's SAW page with the work-item thread in bold and an unread marker", caption: "Alice's post reaches Bob through the relay, and his thread list marks it unread.", width: 800, height: 600 },
        { src: "/projects/saw/07-agent-mode-editing-commenting-viewing.jpg", alt: "The per-thread mode picker with Editing, Commenting and Viewing options", caption: "Each person sets their own agent's mode per thread. It governs the agent, not the human.", width: 800, height: 600 },
      ],
      result: {
        heading: "Where it stands",
        metrics: [
          { label: "Tests", value: "355 of 357", base: "pass on a clean export, 2 skipped" },
          { label: "MCP tools", value: "9", base: "registered for agents" },
          { label: "Claude Code hooks", value: "4", base: "session start, prompt, pre-tool-use, stop" },
        ],
        body: "CI runs the suite on Ubuntu and Windows, and both runs gate merges. The screens here ran both members on one machine with demo data, not a live agent session.",
      },
    },
  },

  // Kit: evidence/nlp-safety-utility. "Team lead" is Amogh's own call (#10).
  {
    slug: "llm-ablations", kind: "project", area: "AI research", year: "2026",
    title: "Safety vs. Utility in LLM Activation Spaces", flags: ["highlighted"],
    summary: "Removing one direction from Gemma-2-2B-IT's activations took harmful-prompt success from 1% to 84% (N=100), with benchmarks flat.",
    cover: { kind: "image", src: "/projects/llm-ablations/04-team-matrix-gemma.png", alt: "Bar chart of the ablation matrix on Gemma-2-2B-IT: attack success rate and four benchmarks for each cell" },
    metric: { value: "1% → 84%", base: "Harmful prompts answered after removing one safety direction (Gemma-2-2B-IT, N=100)" },
    tags: ["PyTorch", "Transformers", "NumPy"],
    caseStudy: {
      title: "Can you remove a model's refusals without breaking its skills?",
      lede: "Take one direction out of a language model's activations and it stops refusing harmful requests. On Gemma-2-2B-IT, the share of harmful prompts that got through went from 1% to 84% (N=100), while benchmark scores barely moved.",
      meta: {
        role: "Research team lead",
        timeline: "March to May 2026",
        partners: [people.shrey, people.vansh, people.aditya, people.rohan, people.kushal],
        stack: "Python, PyTorch, Hugging Face Transformers, NumPy",
      },
      diagram: {
        steps: ["Contrasting prompts", "Cached activations", "Extracted direction", "Hook removes it", "Attack rate and benchmarks"],
        model: 3,
        caption: "A forward hook on one block subtracts the direction. No weights change, and removing the hook undoes it.",
      },
      context: {
        heading: "The question",
        body: "Aligned chat models do two jobs at once. They refuse harmful requests, and they stay useful for everything else. Earlier work pinned refusal to a single direction in the residual stream (Arditi et al., 2024). For our CS 639 project we asked whether helpfulness sits in its own direction. If it does, you should be able to delete one and leave the other alone.",
      },
      problem: {
        heading: "Finding Llama's layer",
        body: "On Gemma, a sweep over layers 22 to 25 settled it. On Llama, our layer-picking analysis recommended index 32, the output after the last block, which a hook can't attach to. The nearest real block, layer 31, did nothing: 7% against a 6% baseline. We swept 15 layers. Layers 13 to 28 stayed between 4% and 14%, and the effect only showed up early, peaking at 55% on layer 11. We think the statistic leaned toward late layers because activation norms grow with depth.",
      },
      approach: {
        heading: "One hook, a 2×2 grid",
        body: "We tested Gemma-2-2B-IT and Llama-3.1-8B-Instruct with two ways of finding a direction, difference of means and ActSVD, behind one hook interface, so every cell differs only in which direction gets projected out. Removing safety or utility with either method gives a 2×2 grid per model. We added a no-ablation baseline and two random-direction controls, and scored every cell on attack success over 100 held-out AdvBench prompts, plus BoolQ, HellaSwag and ARC-Challenge at 200 samples each.",
        steps: [
          "The utility direction had no recipe to copy. My idea was to pair a high-rated and a low-rated HelpSteer response to the same prompt and keep only pairs with a big enough helpfulness gap. At a gap of 3 or more, directions from repeated bootstrap samples agree (mean cosine 0.994 on Gemma, 0.988 on Llama), and 1,201 of 37,120 pairs survive the filter.",
          "I also set up the codebase, the dataset preprocessing and the activation cache that every other step reads from.",
        ],
      },
      figures: [
        { src: "/projects/llm-ablations/01-layer-sweep-asr.png", alt: "Line charts of attack success rate by ablation layer: Gemma climbs to 84% at layer 25, Llama peaks at 55% at layer 11", caption: "Attack success by the layer where the safety direction is removed. Llama's effect sits early, far from the layer our analysis picked.", width: 1920, height: 704 },
        { src: "/projects/llm-ablations/02-cells-with-controls.png", alt: "Bar charts of every ablation cell and the random controls on both models, attack success above and benchmark mean below", caption: "Every cell on both models. The grey random-direction controls stay at baseline.", width: 1920, height: 1120 },
      ],
      result: {
        heading: "What the numbers say",
        metrics: [
          { label: "Gemma, safety removed", value: "1% → 84%", base: "harmful prompts answered, N=100" },
          { label: "Llama, layer 11", value: "6% → 55%", base: "benchmark mean 65.0% → 64.7%" },
          { label: "Random controls", value: "At baseline", base: "1% on Gemma, 6% on Llama" },
        ],
        body: "Removing the ActSVD utility subspace broke the pattern: refusals stayed (3%), but Gemma's benchmark mean fell from 61.3% to 53.2%. One of the four principal angles between the subspaces sits at 61.9 degrees, which a single similarity score of 0.065 hides. Refusal is scored by substring matching on one seed, so these are point estimates.",
      },
    },
  },

  // Kit: evidence/qna-51
  {
    slug: "qna", kind: "project", area: "Course project", year: "2026",
    title: "QnA: a course Q&A board with a cited AI answerer", flags: ["highlighted"],
    summary: "We added a RAG answerer to a Piazza-style board and measured five ways to configure it.",
    cover: { kind: "image", src: "/projects/qna/04-student-ai-answer-with-sources.jpg", alt: "A student's question on the QnA board with an AI-generated answer and three numbered sources", focus: "center top" },
    metric: { value: "17×", base: "Wall clock of a 70× larger embedder, for no retrieval gain (N=14)" },
    tags: ["FastAPI", "RAG", "React"],
    caseStudy: {
      title: "A course Q&A board that answers from the course's own material",
      lede: "Our first similarity threshold, 0.65, sounded careful and answered almost nothing: it matched 1 of 22 sweep questions, on the wrong source. So we swept the threshold before trusting it, and ran the live answers and the evaluation through one function.",
      meta: { role: "Full-stack engineer", timeline: "October 2026", partners: [people.divij], stack: "FastAPI, MySQL, Redis, React, Ollama, Infinity, ChromaDB" },
      diagram: {
        steps: ["Student question", "Retrieve from ChromaDB", "Threshold check", "Generate with Ollama", "Answer with sources"],
        model: 2,
        caption: "Below the threshold the job ends with no answer, and the question waits for a human.",
      },
      context: {
        heading: "The situation",
        body: "QnA is a Piazza-style board for a course. A student posts a question, anyone in the course can reply, and staff mark one answer as verified. The starter had no AI in it. Our assignment was to add an assistant that answers a new question from the course's own material (a syllabus page, a schedule, a repo of rubrics and slides, past threads) and says where each part of the answer came from.",
      },
      problem: {
        heading: "What made it hard",
        body: "The model host was a 4-vCPU VM with no GPU, so every model size was a cost on every question, and the generator was a 1.5B model. The board had to keep working when the AI services were down. A wrong answer under a student's question was worse than no answer, so the system needed a way to stay quiet. On the VM, ingestion with the large embedding model failed on a 120-second batch timeout a laptop never hit, and I raised it to 600 seconds.",
      },
      approach: {
        heading: "Fixed at ingestion, chosen per question",
        body: "Chunking and the embedding model are baked into the stored vectors, so they live in an ingestion profile. The threshold, system prompt and generation model are request parameters, so three of our five comparison axes cost one request each. One function, run_rag, serves both the worker that answers students and the staff compare page, so the numbers we report describe the code students use. Divij built the schema, the worker, the retrieval pipeline and the compare endpoint. I built the Compose services, repository ingestion, the staff pages and citation UI, the deploy pipeline and the evaluation run.",
        steps: [
          "A new question creates an answer job in the same transaction, with a snapshot of the course's settings.",
          "A worker embeds the question and takes the 3 nearest chunks from each live resource.",
          "Below the threshold, the job ends with no match and nothing is posted.",
          "Otherwise the model answers at temperature 0, and the post and one citation per chunk are saved together.",
        ],
      },
      figures: [
        { src: "/projects/qna/06-source-viewer-cited-lines.jpg", alt: "The source viewer with lines 36 to 45 of a course rubric highlighted", caption: "The first citation opens the source on the exact lines, so a reader can check the answer quickly.", width: 1280, height: 800 },
        { src: "/projects/qna/03-staff-ai-settings.jpg", alt: "The staff AI settings page with the similarity threshold, top-k, system prompt and generation model", caption: "Staff set the threshold, prompt and model per course. 0.65 was the default we started from.", width: 1280, height: 800 },
      ],
      result: {
        heading: "How it turned out",
        metrics: [
          { label: "Larger embedder", value: "33.8 s", base: "per question, against 2.0 s, for the same retrieval" },
          { label: "Retrieval hit rate", value: "77%", base: "baseline, N=13" },
          { label: "Calibrated threshold", value: "83% / 91%", base: "precision and recall at 0.40" },
        ],
        body: "No single change beat the baseline. The generator mattered most: a correct retrieval didn't guarantee a correct answer from a 1.5B model. The ground truth is 14 questions with one negative, and we chose the threshold on the same questions we report on, so these numbers are optimistic.",
      },
    },
  },

  {
    slug: "curio", kind: "project", area: "Education", year: "2024–25",
    title: "Curio",
    summary: summary(), cover: cover("Curio"), metric: metric(),
    tags: ["FastAPI", "React", "Pydantic"],
    caseStudy: caseStudy(
      { role: "Full-stack developer", timeline: "October 2024 to January 2025", team: "MadHacks 2024 project", stack: "FastAPI, GPT-4o, Pydantic, WeasyPrint, React, Tailwind CSS, Vercel" },
      { diagram: true, problem: true },
    ),
  },

  // Kit: evidence/poker-tracker (redacted level: screenshots keep the product name blacked out).
  {
    slug: "handlab", kind: "work", area: "AI search", year: "2026",
    title: "Handlab Poker Intelligence",
    summary: "Import PLO hand histories, filter and replay hands, and search in plain English through an LLM query router.",
    cover: { kind: "image", src: "/projects/handlab/02-hands-all-505.jpg", alt: "The hands list with 505 imported hands and filters down the side" },
    metric: { value: "510 tests passing", base: "Backend suite on a clean export of the code" },
    tags: ["Python", "FastAPI", "React"],
    caseStudy: {
      title: "A hand tracker you can ask questions",
      lede: "Finding a spot in thousands of hand histories means scrolling. So we built a tracker where you import Pot-Limit Omaha hands, filter and replay them, and ask for spots in plain English.",
      meta: { role: "Contract software engineer", timeline: "February to July 2026", partners: [people.shrey], stack: "Python, FastAPI, SQLite, React, TypeScript, an LLM query router" },
      diagram: {
        steps: ["Plain-English question", "LLM router", "Validated query plan", "SQL compilers", "Matching hands"],
        model: 1,
        caption: "The LLM only decides what you meant. Deterministic code runs the query.",
      },
      context: {
        heading: "The situation",
        body: "The app is a Python and FastAPI backend with a React frontend. It reads hand histories from GGPoker and CoinPoker, or a DriveHUD export, parses them into SQLite, and serves a hands list with filters, a hand replay, saved sets and a Copilot chat. It ships no hand data: every player brings their own.",
      },
      problem: {
        heading: "What we were up against",
        body: "Hand histories arrive as text, XML, zip files or a database export, from more than one site. And the questions players ask don't fit a filter: \"hands where I check-raised a monotone flop\" is a pattern over actions, not a column.",
      },
      approach: {
        heading: "The LLM decides, code executes",
        body: "An LLM never runs the query. A question goes to a router that returns a typed, validated query plan, and deterministic compilers run that plan against SQLite. Results stay repeatable, and the query path can be tested without a model in the loop.",
        steps: [
          "I added multipart and zip uploads, so a whole folder of session files loads at once, and fixed the duplicate player-fact crash that overlapping uploads caused.",
          "I added a cache for the hands workspace that prefetches five hands at a time and clears on upload.",
        ],
      },
      figures: [
        { src: "/projects/handlab/03-filter-4bet-66-hands.jpg", alt: "The hands list filtered to 4-bet pots, showing 66 hands", caption: "One filter, 4-bet pots, takes the sample set from 505 hands to 66.", width: 800, height: 600 },
        { src: "/projects/handlab/05-replay-river-result.jpg", alt: "A hand replay at the river with the full board, all-in players and the winner", caption: "A replay at step 19 of 19: the full board, the all-ins and who won. Players show as hashed ids.", width: 800, height: 600 },
      ],
      result: {
        heading: "Where it landed",
        metrics: [
          { label: "Sample import", value: "505 hands", base: "from 11 files in one zip, 0 errors" },
          { label: "Backend tests", value: "510 passing", base: "on a clean export, Python 3.12" },
          { label: "4-bet filter", value: "66 of 505", base: "hands in the sample set" },
        ],
        body: "Natural-language search needs a live LLM key, so it isn't shown here. The screens use the repo's sample hand histories, with the product name blacked out.",
      },
    },
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
