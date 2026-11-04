import { placeholder, placeholderMedia } from "./placeholder";

export type Metric = { label?: string; value: string; base: string };

/** Card or case-study media. `focus` works like CSS object-position. */
export type Media = { kind: "image" | "gif" | "video"; src: string; alt: string; focus?: string };

/** Someone credited on a case study. `link` is their LinkedIn when we have it. */
export type Person = { name: string; link?: string };

/** A captioned image in a case study. Width and height are the file's pixels, so the frame reserves its space. */
export type Figure = { src: string; alt: string; caption: string; width: number; height: number };

/** One paragraph, or several. */
export type Body = string | string[];
export type Section = { heading: string; body: Body };

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
  edges: { from: string; to: string; step?: number; exit?: Side; enter?: Side; stop?: boolean }[];
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
    summary: "A shared thread where two developers' coding agents trade messages and branch names but never code, and both humans can read and steer everything.",
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
        caption: "Agents reach SAW through 9 MCP tools (MCP is the standard way an agent calls outside tools) and 4 Claude Code hooks. A Node.js relay keeps the threads in SQLite.",
      },
      context: {
        heading: "The situation",
        body: "SAW is a coordination layer for developers who each use a coding agent. Agents post messages, Git refs and ticket refs into shared threads. Code never travels through SAW. It moves only through Git. Humans see every message in their scope and can pause or steer their own agent. We built it as a TypeScript monorepo of three packages: a shared schema, a relay server, and a saw command line tool that runs a local daemon, an MCP server and a small web page.",
      },
      problem: {
        heading: "Code leaking through the boundary",
        body: "In August we set the product up from the written steps instead of the test harness, and that pass found problems the tests had stepped over. One was that pasted code could still reach the shared work log. The relay's detectors looked for the start of a diff or a Markdown code fence at the beginning of a line. But the CLI collapsed a prompt's whitespace and cut it to 600 characters before the relay saw it, so no line was left to begin and every detector missed. I added a check that catches pasted code after the whitespace is gone, and a bounded log query that returns the newest entries.",
      },
      approach: {
        heading: "Messages and Git refs, nothing else",
        body: "The tool agents post with, room_post, takes free text plus branch names or commit SHAs, and its own description says those are the only pointers to code. That rule is strict on purpose. Code review stays in Git, where it already lives, and the boundary is easy to test, since anything that looks like pasted code is a bug. Each member also sets a mode for their own agent on each thread. Edit lets it change files and push branches, comment lets it post without touching files, and view makes it read-only. Nobody can set another member's mode.",
        steps: [
          "I built the relay's Docker deployment: a Node 20 Alpine image with the SQLite file on a mounted volume, so state survives restarts.",
          "I made saw up work with an npm-installed claude on Windows, and added a test that proves the relay stores token hashes, never tokens.",
        ],
      },
      figures: [
        { src: "/projects/saw/04-bob-sees-unread-thread.jpg", alt: "Bob's SAW page with the work-item thread in bold and an unread marker", caption: "Alice's post reaches Bob through the relay, and his thread list marks it unread.", width: 800, height: 600 },
        { src: "/projects/saw/07-agent-mode-editing-commenting-viewing.jpg", alt: "The per-thread mode picker with Editing, Commenting and Viewing options", caption: "Each person sets their own agent's mode per thread, and only they can change it.", width: 800, height: 600 },
      ],
      result: {
        heading: "Where it stands",
        metrics: [
          { label: "Tests", value: "355 of 357", base: "pass on a clean export, 2 skipped" },
          { label: "MCP tools", value: "9", base: "registered for agents" },
          { label: "Claude Code hooks", value: "4", base: "session start, prompt, pre-tool-use, stop" },
        ],
        body: "CI runs the suite on Ubuntu and Windows, and both runs gate merges. The screens here come from two members on one machine with demo data. A live agent session hasn't been recorded yet.",
      },
    },
  },

  // Kit: evidence/nlp-safety-utility. "Team lead" is Amogh's own call (#10).
  {
    slug: "llm-ablations", kind: "project", area: "AI research", year: "2026",
    title: "Safety vs. Utility in LLM Activation Spaces", flags: ["highlighted"],
    summary: "Subtracting one direction from a chat model's activations took the share of harmful prompts it answered from 1% to 84% (N=100). Its benchmark scores barely moved.",
    cover: { kind: "image", src: "/projects/llm-ablations/04-team-matrix-gemma.png", alt: "Bar chart of the ablation matrix on Gemma-2-2B-IT: attack success rate and four benchmarks for each cell" },
    metric: { value: "1% → 84%", base: "Harmful prompts answered after removing one safety direction (Gemma-2-2B-IT, N=100)" },
    tags: ["PyTorch", "Transformers", "NumPy"],
    caseStudy: {
      title: "Can you remove a model's refusals without breaking its skills?",
      lede: "Take one direction out of a chat model's activations and it stops refusing harmful requests. On Gemma-2-2B-IT, a small open model from Google, the share of harmful prompts that got through went from 1% to 84% (N=100), while its benchmark scores barely moved. We wanted to know whether helpfulness could be pulled out the same way, without touching safety.",
      meta: {
        role: "Research team lead",
        timeline: "March to May 2026",
        partners: [people.shrey, people.vansh, people.aditya, people.rohan, people.kushal],
        stack: "Python, PyTorch, Hugging Face Transformers, NumPy",
      },
      diagram: {
        steps: ["Contrasting prompts", "Cached activations", "Extracted direction", "Hook removes it", "Attack rate and benchmarks"],
        model: 3,
        caption: "A forward hook (a function PyTorch runs on a block's output) subtracts the direction. No weights change, and removing the hook undoes it.",
      },
      context: {
        heading: "The question",
        body: "Aligned chat models do two jobs at once. They refuse harmful requests, and they stay useful for everything else. Earlier work pinned refusal to a single direction in the residual stream, the running vector each layer reads and writes (Arditi et al., 2024). Subtract that one vector and the refusals go. For our CS 639 project we asked whether helpfulness sits in its own direction. If it does, you should be able to delete one and leave the other alone.",
      },
      problem: {
        heading: "Finding Llama's layer",
        body: "On Gemma, a sweep over layers 22 to 25 settled it. Llama was harder. Our analysis scores every layer and recommends the one where the safety and utility directions differ most, and for Llama it picked index 32. That index is the output after the last block, and a hook can't attach to it. The nearest real block, layer 31, did nothing: 7% against a 6% baseline. We swept 15 layers. Layers 13 to 28 stayed between 4% and 14%, and the effect only showed up early, peaking at 55% on layer 11. We think the analysis leaned toward late layers because activations grow larger with depth.",
      },
      approach: {
        heading: "One hook, a 2×2 grid",
        body: "We tested two open chat models, Gemma-2-2B-IT and Llama-3.1-8B-Instruct, and found each direction two ways. Difference of means takes the average activation on harmful prompts and subtracts the average on harmless ones. ActSVD uses a matrix factorization (SVD) to find a few directions at once. Both sit behind one hook interface, so every cell differs only in which direction gets projected out. Removing safety or utility with either method gives a 2×2 grid per model. We added a baseline with nothing removed and two random-direction controls. Every cell was scored on attack success, the share of 100 held-out harmful prompts from AdvBench that the model answered. Each was also scored on three standard benchmarks, BoolQ, HellaSwag and ARC-Challenge, at 200 samples each.",
        steps: [
          "The utility direction had no recipe to copy, since earlier work only extracted refusal. My idea used HelpSteer, a dataset of responses rated for helpfulness: pair a high-rated and a low-rated response to the same prompt, and keep only pairs with a big enough gap. At a gap of 3 or more, directions built from random resamples of the pairs point the same way (mean cosine 0.994 on Gemma, 0.988 on Llama), and 1,201 of 37,120 pairs survive the filter.",
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
        body: "Removing the ActSVD utility subspace broke the pattern: refusals stayed (3%), but Gemma's benchmark mean fell from 61.3% to 53.2%. A single similarity score between the safety and utility subspaces, 0.065, says they barely overlap. Measured angle by angle instead (their principal angles), three of the four sit near 90 degrees and one sits at 61.9, which is our candidate explanation for the drop. Refusal is scored by matching a fixed list of refusal phrases on one seed, so these are point estimates.",
      },
    },
  },

  // Kit: evidence/qna-51
  {
    slug: "qna", kind: "project", area: "Course project", year: "2026",
    title: "QnA: a course Q&A board with a cited AI answerer", flags: ["highlighted"],
    summary: "We added an AI that answers students from the course's own material and cites its sources, then measured five ways to configure it.",
    cover: { kind: "image", src: "/projects/qna/04-student-ai-answer-with-sources.jpg", alt: "A student's question on the QnA board with an AI-generated answer and three numbered sources", focus: "center top" },
    metric: { value: "17×", base: "Time per question with a 70× larger search model, which found the right sources no more often (N=14)" },
    tags: ["FastAPI", "RAG", "React"],
    caseStudy: {
      title: "Teaching a course bot when to stay quiet",
      lede: "A wrong answer under a student's question is worse than no answer. So our course bot answers only when it finds a passage in the course material that's close enough to the question. The first cutoff we picked, 0.65, sounded careful and answered almost nothing: it matched 1 of 22 test questions, and that one on the wrong source.",
      meta: { role: "Full-stack engineer", timeline: "October 2026", partners: [people.divij], stack: "FastAPI, MySQL, Redis, React, Ollama, Infinity, ChromaDB" },
      context: {
        heading: "The situation",
        body: "QnA is a Piazza-style board for a course. A student posts a question, anyone in the course can reply, and staff mark one answer as verified. The starter code had no AI in it. Our assignment was to add a bot that answers a new question from the course's own material (the syllabus, the schedule, a repo of rubrics and slides, and past threads) and shows where each part of its answer came from.",
      },
      problem: {
        heading: "What made it hard",
        body: [
          "The AI models ran on a virtual machine with 4 CPU cores and no GPU, so a bigger model cost time on every single question. The model writing the answers was small, with 1.5 billion parameters.",
          "The board also had to keep working when the AI was down, and a wrong answer was worse than none. The bot needed a way to say nothing.",
        ],
      },
      explainer: {
        heading: "How a bot finds the right page",
        body: [
          "Before it can answer, the bot has to find the part of the course that holds the answer. When we load a course, every page, rubric and past thread is cut into short passages. An embedding model then turns each passage into a long list of numbers, a vector, built so that passages with similar meanings get vectors that sit close together.",
          "A new question goes through the same model. A vector database returns the passages whose vectors are nearest to it, each with a similarity score: the higher the score, the closer the meaning. Only then does a language model write the answer, from those passages alone, which is how it can cite them. This find-then-write pattern is called retrieval-augmented generation, or RAG.",
          "The catch is that every question has a nearest passage, even one the course can't answer. \"What grade did I get on the midterm?\" found one with a score of 0.571. So the bot needs a cutoff, called a similarity threshold. Below it, the bot stays quiet and leaves the question for a person.",
        ],
      },
      architecture: {
        cols: 5,
        rows: 3,
        nodes: [
          { id: "browser", label: "Browser", sub: "students and staff", at: [0, 1] },
          { id: "backend", label: "FastAPI backend", sub: "the board's API", at: [1, 1] },
          { id: "redis", label: "Redis", sub: "queue of answer jobs", at: [2, 0], kind: "store" },
          { id: "mysql", label: "MySQL", sub: "posts, jobs, citations", at: [2, 2], kind: "store" },
          { id: "worker", label: "RAG worker", sub: "answers in the background", at: [3, 1] },
          { id: "quiet", label: "No answer posted", sub: "a person answers instead", at: [3, 2], kind: "stop" },
          { id: "infinity", label: "Infinity", sub: "turns text into vectors", at: [4, 0] },
          { id: "chroma", label: "ChromaDB", sub: "finds nearest passages", at: [4, 1], kind: "store" },
          { id: "ollama", label: "Ollama", sub: "runs the 1.5B model", at: [4, 2], kind: "model" },
        ],
        edges: [
          { from: "browser", to: "backend", step: 1 },
          { from: "backend", to: "mysql", step: 2, exit: "b", enter: "l" },
          { from: "backend", to: "redis", step: 3, exit: "t", enter: "l" },
          { from: "redis", to: "worker", exit: "r", enter: "t" },
          { from: "worker", to: "infinity", step: 4 },
          { from: "worker", to: "chroma", step: 5 },
          { from: "worker", to: "quiet", step: 6, exit: "b", enter: "t", stop: true },
          { from: "worker", to: "ollama", step: 7 },
          { from: "worker", to: "mysql", step: 8, exit: "l", enter: "r" },
        ],
        groups: [
          { label: "The board", nodes: ["backend", "redis", "mysql"] },
          { label: "The AI answerer", nodes: ["worker", "quiet", "infinity", "chroma", "ollama"] },
        ],
        caption: "One question's trip through QnA, numbered to match the steps below. The admin app and the nginx proxy in front of the backend are left out for space.",
      },
      walkthrough: {
        heading: "One question, start to finish",
        intro: "Here's what happens when a student asks how many points the parallax bug fix is worth. The numbers match the diagram.",
        steps: [
          "The student posts the question from the browser, and the backend takes it like any other post.",
          "The backend saves the question and an answer job in one database transaction, with a snapshot of the course's AI settings. A question can't be saved without its job.",
          "The backend puts the job's reference on a Redis queue, and a single worker picks it up. The board doesn't wait for the AI: if the queue can't be reached, the job stays pending until the worker sweeps it up.",
          "The worker sends the question to the embedding model, which turns it into a vector.",
          "ChromaDB returns the 3 nearest passages from each live course resource, each with its similarity score. Here they include the project rubric.",
          "If the best score is below the threshold, the job ends with no match. Nothing is posted, and the question waits for a person.",
          "Otherwise the passages go into a prompt, each tagged with its type, and Ollama runs the 1.5B model with its randomness set to zero. It answers 14 points and lists the rubric's criteria.",
          "The worker saves the answer, one citation per passage and the job's done status in one transaction. The student sees an \"AI-generated\" badge and three numbered sources, and the first one opens the rubric on the exact lines.",
        ],
      },
      approach: {
        heading: "Fixed when loaded, chosen per question",
        body: [
          "Some choices are baked in when a course is loaded: how the material is cut into passages and which embedding model reads it. Changing either means loading the course again. Others can change on every question, like the threshold, the instructions the model gets and which model writes the answer. We made those settings on each request, so three of the five things we wanted to compare cost one request each instead of a reload.",
          "One function serves both the live worker and the staff comparison page, so every number below describes the code students actually use. Divij built the schema, the worker, web and Q&A ingestion, the retrieval pipeline and the comparison endpoint. I built the Docker Compose services, repository ingestion, the staff pages and citation UI, the deploy pipeline and the evaluation run.",
        ],
      },
      figures: [
        { src: "/projects/qna/06-source-viewer-cited-lines.jpg", alt: "The source viewer with lines 36 to 45 of a course rubric highlighted", caption: "Step 8's first citation opens the rubric on lines 36 to 45, so anyone can check the 14-point answer in seconds.", width: 1280, height: 800 },
        { src: "/projects/qna/03-staff-ai-settings.jpg", alt: "The staff AI settings page with the similarity threshold, top-k, system prompt and generation model", caption: "Staff tune the bot for each course on this page. The threshold field is where 0.65 started.", width: 1280, height: 800 },
      ],
      sections: [
        {
          heading: "Finding the cutoff",
          body: [
            "A threshold is a guess until you measure it. We swept it from 0.25 to 0.70 with a rule for picking the winner. The off-topic question had to stay unanswered. After that we took the cutoff that caught the most answerable questions, and then the one whose answers were most often right. Our test set had only one off-topic question, so the sweep added 8 more of its own to push against.",
            "For the default embedding model the rule picked 0.40. At that cutoff the bot answered 12 questions and cited the right source for 10 of them, so 83% of its answers pointed to the right place. That share is called precision. It also found the right source for 10 of the 11 questions it should have matched, a recall of 91%. The one false match was the midterm-grade question. Drop the cutoff to 0.30 and four off-topic questions got answers instead of one.",
          ],
        },
        {
          heading: "Bigger wasn't better",
          body: [
            "Then we ran the course's 14 test questions against the deployed board 8 times, changing one setting each run. I expected the embedding model to matter most. A model 70 times larger, given its own calibrated threshold, found the right source exactly as often, for 77% of 13 answerable questions, and took 33.8 seconds per question instead of 2.0. The off-topic question stayed unanswered in all 8 runs, though that's a single question.",
            "The model writing the answers mattered most. Swapping in an even smaller one, llama3.2:1b, dropped correct answers from about 10 of 13 to about 5, by my reading. And finding the right passage didn't guarantee a right answer. On a question about one project's architecture, the right passage came back and the 1.5B model still got the answer backwards.",
          ],
        },
      ],
      result: {
        heading: "How it turned out",
        metrics: [
          { label: "Bigger embedding model", value: "33.8 s", base: "per question, against 2.0 s, for the same retrieval" },
          { label: "Right source found", value: "77%", base: "baseline, N=13" },
          { label: "Calibrated threshold", value: "83% / 91%", base: "precision and recall at 0.40" },
        ],
        body: "These numbers are optimistic. The test set is 14 questions with one off-topic, and we picked the threshold on the same questions we report on. The hit rate counts the right file, not the right passage, and answer quality is my own reading. On a CPU even zero randomness isn't fully repeatable: across two runs, 24 of 99 answers came out worded differently.",
      },
      lessons: [
        { title: "Calibrate a threshold before you trust it.", body: "0.65 sounded reasonable. The sweep showed it was nearly mute." },
        { title: "Run the live path and the evaluation through one function.", body: "Our comparison numbers describe what students get because both paths call it." },
        { title: "Have a fresh reader check the design.", body: "An AI session that saw only our design document, with no tools and no code, found 34 holes, including 2 real design bugs the two of us had missed." },
        { title: "Set timeouts on the machine that serves the model.", body: "Each batch sent to the large embedding model had a 120-second limit. It never tripped on a laptop and failed on the 4-core server, so I raised it to 600 seconds." },
      ],
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
    summary: "A poker tracker that imports your hand records, filters and replays them, and finds the hands you describe in plain English.",
    cover: { kind: "image", src: "/projects/handlab/02-hands-all-505.jpg", alt: "The hands list with 505 imported hands and filters down the side" },
    metric: { value: "510 tests passing", base: "Backend suite on a clean export of the code" },
    tags: ["Python", "FastAPI", "React"],
    caseStudy: {
      title: "A hand tracker you can ask questions",
      lede: "Poker sites keep a record of every hand you play, and finding one situation in thousands of them means scrolling. So we built a tracker you can ask in plain English, and it answers with the matching hands.",
      meta: { role: "Contract software engineer", timeline: "February to July 2026", partners: [people.shrey], stack: "Python, FastAPI, SQLite, React, TypeScript, an LLM query router" },
      diagram: {
        steps: ["Plain-English question", "LLM router", "Validated query plan", "SQL compilers", "Matching hands"],
        model: 1,
        caption: "The router turns a question into a plan. Everything after it is ordinary code.",
      },
      context: {
        heading: "The situation",
        body: "It's built for Pot-Limit Omaha (PLO), a poker game where each player holds four cards. Players call those per-hand records hand histories. The app reads them from GGPoker and CoinPoker, or from a DriveHUD export (a desktop tracking tool), and parses them into SQLite. It serves a hands list you can filter by board, action, position and pot type, a step-by-step hand replay, saved sets and a Copilot chat. The backend is Python and FastAPI with a React frontend, and it ships no hand data: every player brings their own.",
      },
      problem: {
        heading: "What we were up against",
        body: "Hand histories arrive as text, XML, zip files or a database export, from more than one site. And the questions players ask don't fit a filter. Take \"hands where I check-raised a monotone flop\": the player checked, then raised after an opponent bet, when the first three shared cards were all one suit. That's a pattern over a sequence of actions, not a column you can filter on.",
      },
      approach: {
        heading: "The LLM decides, code executes",
        body: "Earlier versions tried an exact-match catalog of known questions and a regex rewriter, and the README records that both were measured to add nothing. So a model reads the question, and code does the rest. A router returns a typed, validated query plan (a structured description of which hands to find), and deterministic compilers turn that plan into SQL. The model never touches the database, so the same plan always returns the same hands, and the query path can be tested without a model in the loop.",
        steps: [
          "I added multipart and zip uploads, so a whole folder of session files loads at once, and fixed the duplicate player-fact crash that overlapping uploads caused.",
          "I added a cache for the hands workspace that prefetches five hands at a time and clears on upload.",
        ],
      },
      figures: [
        { src: "/projects/handlab/03-filter-4bet-66-hands.jpg", alt: "The hands list filtered to 4-bet pots, showing 66 hands", caption: "One filter, 4-bet pots (hands where a re-raise was raised again), takes the sample set from 505 hands to 66.", width: 800, height: 600 },
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

// Fail the build if a diagram and its walkthrough drift apart: every edge must join two
// real boxes, every grid cell must hold one box, and badge n needs walkthrough item n.
for (const p of caseStudies) {
  const a = p.caseStudy.architecture;
  if (!a) continue;
  const ids = new Set(a.nodes.map((n) => n.id));
  const cells = new Set<string>();
  for (const n of a.nodes) {
    const [c, r] = n.at;
    if (c < 0 || r < 0 || c >= a.cols || r >= a.rows || cells.has(`${c},${r}`)) throw new Error(`${p.slug}: box "${n.id}" is off the grid or shares a cell`);
    cells.add(`${c},${r}`);
  }
  for (const g of a.groups ?? []) for (const id of g.nodes) if (!ids.has(id)) throw new Error(`${p.slug}: group "${g.label}" names unknown box "${id}"`);
  const steps = p.caseStudy.walkthrough?.steps.length ?? 0;
  for (const e of a.edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) throw new Error(`${p.slug}: edge ${e.from} → ${e.to} names an unknown box`);
    if (e.step && (e.step < 1 || e.step > steps)) throw new Error(`${p.slug}: badge ${e.step} has no walkthrough step`);
  }
}

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
