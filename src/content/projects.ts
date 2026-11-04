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
/** `more` adds one link after the body, e.g. to the case study that already teaches a term. */
export type Section = { heading: string; body: Body; more?: { href: string; label: string } };

/** The anchor id for a case-study heading, so other pages can link to a section. */
export const sectionId = (heading: string) => heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
  /** The card's headline result. Leave it out rather than fill it with a count of tests or commits. */
  metric?: Metric;
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
  nischal: { name: "Nischal Bista" },
  sharath: { name: "Sharath Kowdle" },
  triya: { name: "Triya Poondra" },
  kavya: { name: "Kavya Kanungo" },
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
// claims ledger. Curio and Ebara are still template copy.

export const caseStudies: Project[] = [
  // Kit: evidence/find-the-outfit
  {
    slug: "find-the-outfit", kind: "project", area: "University capstone", year: "2026",
    title: "Find the Outfit", flags: ["current", "highlighted"],
    summary: "Guess a Shopbop item from a corner of its photo. An AI model scores how close your description is in meaning, and the photo widens as you go.",
    cover: { kind: "image", src: "/projects/find-the-outfit/06-you-found-it.jpg", alt: "The game's win screen: \"You found it.\" above the full photo of a black dress with a floral panel", focus: "center 22%" },
    org: { name: "Amazon", logo: "/logos/amazon.jpg" },
    tags: ["TypeScript", "AWS Lambda", "Bedrock"],
    caseStudy: {
      title: "Scoring fashion guesses by meaning with Bedrock embeddings",
      lede: "Nobody can name a dress from a corner of its photo, so our daily fashion puzzle can't wait for the exact words. It scores each guess by how close it is in meaning. Out of the box, those scores bunched between about 0.05 and 0.75, which put nearly every guess in the cold half of the meter.",
      meta: { role: "Scrum Master and software engineer", timeline: "September 2026 to present", partners: [people.nischal, people.sharath, people.triya, people.kavya], stack: "TypeScript, Expo, AWS Lambda, API Gateway, S3, Amazon Bedrock, AWS Amplify" },
      context: {
        heading: "The situation",
        body: "Shopbop wants a daily game, in the spirit of Wordle, built on its own catalog. There's one hidden item a day, the same for every player. You see a tight crop of its photo, type what you think it is, and get back warmer or colder. You get six guesses, the photo widens every two of them, and a win ends with a link to the product. Five of us are building it as a UW-Madison capstone, and Shopbop mentors review our demos.",
      },
      problem: {
        heading: "What made it hard",
        body: [
          "Players type whatever comes to mind. \"Ivory slip dress\" and \"cream satin gown\" share no words, but both should land near the same answer, so matching keywords alone can't be the score.",
          "The answer also can't reach the browser, because a player who opens the developer tools should find nothing there. And there's one puzzle per day on one clock. The app and the API both use Chicago time, so they agree on what today means.",
        ],
      },
      explainer: {
        heading: "From a similarity score to a meter",
        body: [
          "To score meaning, the game turns the guess and a description of the hidden item into vectors, lists of numbers placed so that texts with similar meanings sit close together. Comparing two vectors gives a similarity score, and the higher it is, the closer the meanings. These vectors are called embeddings, and Amazon Bedrock's Titan model makes ours.",
          "The catch is the range. Notes in our code record what the model returns: about 0.05 to 0.20 for an unrelated guess, 0.30 to 0.50 for the right kind of garment, 0.50 to 0.60 once the color is right too, and 0.65 to 0.75 for a close description. Used as is, nearly every guess would land in the cold half of the meter, and even a close description would top out around 0.7.",
          "So we stretch it. A score of 0.15 or below counts as no resemblance, 0.70 or above counts as a perfect description, and everything between is spread evenly over the meter. Meaning gives the meter its warmer feel but tells a player nothing specific, so it makes up 60% of the heat. The other 40% comes from four tiles (category, color, pattern and length) that check the guess for the item's own words.",
          "Here's one guess worked through by the real scoring code, on a made-up black leopard-print mini dress. We didn't call Bedrock for this, so the raw score of 0.45 is an assumed value. Stretched, 0.45 becomes 0.55. \"Black silk dress\" gets the category and the color, two of four tiles, so the tiles give 0.5. The heat is 0.6 × 0.55 + 0.4 × 0.5, about 0.53, which the game shows as cool.",
        ],
        more: { href: "/work/qna#how-a-bot-finds-the-right-page", label: "How embeddings find a match, in the QnA case study" },
      },
      architecture: {
        cols: 5,
        rows: 3,
        nodes: [
          { id: "amplify", label: "AWS Amplify", sub: "hosts the web app", at: [0, 0] },
          { id: "browser", label: "Player's browser", sub: "runs the game", at: [0, 1] },
          { id: "today", label: "Puzzle Lambda", sub: "today's puzzle, no answer", at: [1, 0] },
          { id: "gateway", label: "API Gateway", sub: "the game's two endpoints", at: [1, 1] },
          { id: "guess", label: "Guess Lambda", sub: "scores each guess", at: [2, 1] },
          { id: "tiles", label: "Tiles-only score", sub: "if Bedrock fails", at: [2, 2], kind: "stop" },
          { id: "s3", label: "S3", sub: "puzzles and photo crops", at: [3, 0], kind: "store" },
          { id: "bedrock", label: "Amazon Bedrock", sub: "Titan embeddings", at: [3, 1], kind: "model" },
          { id: "builder", label: "Puzzle builder", sub: "a person approves each", at: [4, 0] },
          { id: "shopbop", label: "Shopbop catalog", sub: "products and photos", at: [4, 1], kind: "store" },
        ],
        edges: [
          { from: "amplify", to: "browser" },
          { from: "browser", to: "gateway", step: 1 },
          { from: "gateway", to: "today" },
          { from: "today", to: "s3" },
          { from: "gateway", to: "guess", step: 2 },
          { from: "guess", to: "s3", step: 3, exit: "t", enter: "b" },
          { from: "guess", to: "bedrock", step: 4 },
          { from: "guess", to: "tiles", step: 5, stop: true },
          { from: "shopbop", to: "builder" },
          { from: "builder", to: "s3" },
        ],
        groups: [
          { label: "Server side, on AWS", nodes: ["today", "gateway", "guess", "tiles", "s3", "bedrock"] },
          { label: "Daily setup", nodes: ["builder", "shopbop"] },
        ],
        caption: "One guess's trip through the game, numbered to match the steps below. The reply in step 6 goes back the way the guess came. The setup on the right runs before any player shows up.",
      },
      walkthrough: {
        heading: "One guess, start to finish",
        intro: "Before the first guess, the browser loads the app from Amplify and asks the puzzle Lambda for today's puzzle. That Lambda strips out the answer, so nothing in the browser can give the item away. Here's what happens on the second guess, \"black silk dress\". The numbers match the diagram.",
        steps: [
          "The app sends \"black silk dress\" to API Gateway along with the first guess, \"red striped skirt\". The server keeps no game state, so every request carries the history.",
          "API Gateway hands it to the guess Lambda, which re-scores \"red striped skirt\" with the tiles alone. That costs nothing and tells it this is guess 2, which hint comes next, and whether the game is over.",
          "The Lambda loads the full puzzle from S3, answer and scoring keywords included. None of it goes back to the browser until the game ends.",
          "Bedrock's Titan model turns the guess and the item's description into vectors, and the Lambda stretches their similarity onto the meter.",
          "If Bedrock fails, the Lambda skips step 4 and scores the guess from the tiles alone, so a cloud outage doesn't stop the game.",
          "The Lambda blends the two scores and replies with the tiles, the heat and the next hint. Here the category and color tiles match, and pattern and length show as not said. The full photo and the product link come back only when the game ends.",
        ],
      },
      approach: {
        heading: "Two scores, and the answer stays on the server",
        body: [
          "Meaning alone would catch \"cream satin gown\", but it gives a player nothing concrete to fix, and the game would stop whenever Bedrock did. The tiles answer both. They say which part of a guess was right, and they still score when Bedrock is down.",
          "A script builds each day's puzzle from the Shopbop catalog. It picks an in-stock item from a different clothing family each weekday, writes the scoring keywords and cuts five photo crops, from tight to full. A person approves each puzzle before the API will serve it. I'm the team's Scrum Master and run our weekly sprints in Jira.",
        ],
      },
      figures: [
        { src: "/projects/find-the-outfit/04-two-tiles-found.jpg", alt: "The game after two guesses: a cropped photo of a dark dress, the heat meter, and the category and color tiles matched under \"black silk dress\"", caption: "Step 6 on screen. \"Black silk dress\" matches the category and color tiles, and the meter moves well past guess 1. These captures run on the app's built-in sample puzzle with local scoring, so no Bedrock call is behind them.", width: 657, height: 1421 },
        { src: "/projects/find-the-outfit/05-photo-zooms-out.jpg", alt: "Guess 3, \"mini dress with a leopard print\", with category and pattern matched and length missed, and a wider crop of the photo", caption: "Guess 3 finds the pattern but misses on length, and the photo widens. The meter still marks guess 2 as the best so far.", width: 657, height: 1421 },
      ],
      sections: [
        {
          heading: "Scoring what players actually say",
          body: [
            "Players rarely type \"solid\" or \"regular length\". So when the item has a plain pattern or an ordinary length, those tiles count as found even if the guess never mentions them. Found tiles stay found across guesses, and naming the item's exact category or its product name wins outright. A different length in a later guess still counts against you.",
            "We also changed what the item is embedded as. Its text starts with the answer values (color, pattern, length and category), then the product name and its description bullets, with care and sourcing lines dropped. Leading with the answer keeps one shared word, like \"blue\" in \"blue jeans\", from pulling an unrelated guess close.",
          ],
        },
      ],
      result: {
        heading: "How it turned out",
        metrics: [
          { label: "Puzzles published", value: "7", base: "October 20 to 26, each approved by a person" },
        ],
        body: "We didn't run the live Bedrock scoring for this write-up, so the similarity ranges above come from notes in the code, not from a rerun. It's still rough in places, too. Puzzles are built and published in batches by script, and there's no nightly job yet, so a day with no published puzzle has nothing to serve. The stretch and the 60/40 blend come from a handful of live puzzles, not a labelled set. And the tiles' keywords are extracted by simple matching, which is why a person reviews each puzzle before it goes live.",
      },
      lessons: [
        { title: "Calibrate the score on real examples before you trust it.", body: "The model's similarity range was nowhere near 0 to 1, and the meter looked broken until we rescaled it." },
        { title: "Score what players actually say.", body: "Almost nobody types \"solid\", so we stopped requiring it." },
        { title: "Keep the answer on the server.", body: "The app sends its guess history and gets back a verdict. Nothing in the browser can reveal the item early." },
        { title: "Make the failure mode a feature.", body: "With Bedrock down, a guess falls back to the tiles and the game goes on." },
      ],
    },
  },

  // Kit: evidence/saw
  {
    slug: "saw", kind: "project", area: "Agent tooling", year: "2026",
    title: "SAW: Shared Agent Workspace", flags: ["current", "highlighted"],
    summary: "A shared thread where two developers' coding agents trade messages and branch names but never code, and both humans can read and steer everything.",
    cover: { kind: "image", src: "/projects/saw/06-bob-replies.jpg", alt: "SAW's thread view: Alice posts her plan for a work item and Bob replies", focus: "center top" },
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
          { label: "MCP tools", value: "9", base: "registered for agents" },
          { label: "Claude Code hooks", value: "4", base: "session start, prompt, pre-tool-use, stop" },
        ],
        body: "The screens here come from two members on one machine with demo data. A live agent session hasn't been recorded yet.",
      },
    },
  },

  // Kit: evidence/nlp-safety-utility. "Team lead" is Amogh's own call (#10).
  {
    slug: "llm-ablations", kind: "project", area: "AI research", year: "2026",
    title: "Safety vs. Utility in LLM Activation Spaces", flags: ["highlighted"],
    summary: "We tested whether a chat model's safety and its skills live in separate places by deleting one direction inside it at a time. Safety came out cleanly. Helpfulness didn't.",
    cover: { kind: "image", src: "/projects/llm-ablations/04-team-matrix-gemma.png", alt: "Bar chart of the ablation matrix on Gemma-2-2B-IT: attack success rate and four benchmarks for each cell" },
    metric: { value: "1% → 84%", base: "Harmful prompts a small open model answered once its safety direction was gone, with benchmark scores barely moved (N=100)" },
    tags: ["PyTorch", "Transformers", "NumPy"],
    caseStudy: {
      title: "Can you delete an LLM's refusals and keep its skills?",
      lede: "Chat models refuse harmful requests, and earlier work found that the refusal hangs on a single direction inside the model. We removed it from Gemma, a small open model from Google, and the share of harmful prompts that got through went from 1% to 84% (N=100) while its benchmark scores barely moved. We wanted to know whether helpfulness could be pulled out the same way, without touching safety.",
      meta: {
        role: "Research team lead",
        timeline: "March to May 2026",
        partners: [people.shrey, people.vansh, people.aditya, people.rohan, people.kushal],
        stack: "Python, PyTorch, Hugging Face Transformers, NumPy",
      },
      context: {
        heading: "The question",
        body: "Aligned chat models do two jobs at once. They refuse harmful requests, and they stay useful for everything else. For our CS 639 project, six of us asked whether those two jobs live in separate places inside the model. If they do, you should be able to delete one and leave the other alone. We tested two open chat models, Google's Gemma-2-2B-IT and Meta's Llama-3.1-8B-Instruct.",
      },
      explainer: {
        heading: "How a refusal can be one direction",
        body: [
          "Inside a chat model, each layer hands the next a long list of numbers for every token, a word or a piece of one. On Gemma each list holds 2,304 numbers, so you can treat it as a point in a space with 2,304 dimensions. That running list is called the residual stream, and it's where we look.",
          "Run a batch of harmful prompts and a batch of harmless ones, and average the points each batch reaches at one layer. The difference between the two averages is an arrow pointing from harmless toward harmful. Earlier work found that refusal runs along this single arrow, which is called a direction (Arditi et al., 2024). Building it from two averages is called difference of means.",
          "Removing a direction means taking away each point's share along the arrow and keeping the rest. In two dimensions, if the arrow is (1, 0) and a point is (3, 2), the point becomes (0, 2). Do that to every point at one layer while the model runs, and the model loses the signal it refuses with. No weights change, and turning the removal off restores the model.",
          "The catch is the layer. A direction is read and removed at one layer, and the right arrow at the wrong layer can do almost nothing. That turned out to matter a lot on Llama.",
        ],
      },
      architecture: {
        cols: 5,
        rows: 3,
        nodes: [
          { id: "advbench", label: "AdvBench", sub: "harmful prompts", at: [0, 0], kind: "store" },
          { id: "alpaca", label: "Alpaca", sub: "harmless prompts", at: [0, 1], kind: "store" },
          { id: "helpsteer", label: "HelpSteer", sub: "rated answer pairs", at: [0, 2], kind: "store" },
          { id: "read", label: "Read activations", sub: "at one layer", at: [1, 1] },
          { id: "dom", label: "Difference of means", sub: "one direction", at: [2, 0] },
          { id: "saved", label: "Saved directions", sub: "computed once, reused", at: [2, 1], kind: "store" },
          { id: "actsvd", label: "ActSVD", sub: "a few directions at once", at: [2, 2] },
          { id: "runner", label: "Experiment runner", sub: "every cell, layer, rank", at: [3, 0] },
          { id: "hook", label: "Model with a hook", sub: "removes it at one block", at: [3, 1], kind: "model" },
          { id: "bench", label: "Benchmarks", sub: "BoolQ, HellaSwag, ARC-C", at: [3, 2] },
          { id: "refused", label: "Refused", sub: "matched a refusal phrase", at: [4, 0], kind: "stop" },
          { id: "check", label: "Refusal check", sub: "100 held-out prompts", at: [4, 1] },
          { id: "answered", label: "Answered", sub: "counts as an attack", at: [4, 2] },
        ],
        edges: [
          { from: "advbench", to: "read", step: 1 },
          { from: "alpaca", to: "read" },
          { from: "helpsteer", to: "read" },
          { from: "read", to: "dom", step: 2 },
          { from: "read", to: "actsvd" },
          { from: "dom", to: "saved", step: 3 },
          { from: "actsvd", to: "saved" },
          { from: "saved", to: "hook", step: 4 },
          { from: "runner", to: "hook", dashed: true },
          { from: "hook", to: "check", step: 5 },
          { from: "check", to: "refused", step: 6, stop: true },
          { from: "check", to: "answered", step: 7 },
          { from: "hook", to: "bench", step: 8 },
        ],
        groups: [
          { label: "Data", nodes: ["advbench", "alpaca", "helpsteer"] },
          { label: "Find the direction", nodes: ["read", "dom", "saved", "actsvd"] },
          { label: "Remove it and score", nodes: ["runner", "hook", "bench", "refused", "check", "answered"] },
        ],
        caption: "The pipeline, numbered for one cell: Gemma, safety direction, difference of means, layer 25. HelpSteer and ActSVD feed the other cells. The dashed line is the runner that sets up each cell. Every score lands in result files the charts are drawn from.",
      },
      walkthrough: {
        heading: "One cell, start to finish",
        intro: "The experiment is a grid of cells, and each one removes one direction from one model. Here's the cell behind the 84%. The numbers match the diagram.",
        steps: [
          "Harmful prompts from AdvBench and harmless ones from Alpaca go through Gemma, and we save each prompt's point at layer 25, read at its last token.",
          "Average each batch and subtract. The difference, scaled to length 1, is the safety direction.",
          "The direction is saved once, so every later run reads it instead of running the prompts again.",
          "A hook, a function PyTorch calls on a block's output, subtracts the direction from every point at layer 25 while Gemma runs.",
          "Gemma answers 100 harmful AdvBench prompts it never saw while we built the direction, always picking its most likely next word, for up to 256 new tokens.",
          "A response that contains a phrase from a fixed list of refusals counts as refused. Without the hook, 99 of the 100 were.",
          "Anything else counts as answered. With the direction gone, 84 of 100 were.",
          "The same hooked model takes BoolQ, HellaSwag and ARC-Challenge, 200 questions each. Its average went from 61.3% to 60.5%.",
        ],
      },
      approach: {
        heading: "One hook, a 2×2 grid",
        body: [
          "The full experiment crosses two choices. You can remove the safety direction or a utility direction, and you can find it by difference of means or by ActSVD, which finds a few directions at once instead of one. That makes a 2×2 grid per model, plus a baseline with nothing removed and two random-direction controls. Both methods sit behind the same hook, so cells differ only in what gets removed.",
          "The utility direction had no recipe to copy, since earlier work only extracted refusal. My idea used HelpSteer, a dataset of answers rated for helpfulness. Pair a high-rated and a low-rated answer to the same prompt, and keep only pairs whose ratings differ by 3 points or more. At that gap, directions built from random resamples of the pairs point almost the same way (an average cosine of 0.994 on Gemma, where 1 means identical), and 1,201 of the 37,120 pairs pass.",
          "I also set up the codebase, the dataset preprocessing and the activation cache that every other step reads from.",
        ],
      },
      figures: [
        { src: "/projects/llm-ablations/01-layer-sweep-asr.png", alt: "Line charts of attack success rate by ablation layer: Gemma climbs to 84% at layer 25, Llama peaks at 55% at layer 11", caption: "The share of harmful prompts answered, by the layer where the safety direction is removed. Llama's effect sits early, far from the layer our analysis picked.", width: 1920, height: 704 },
        { src: "/projects/llm-ablations/02-cells-with-controls.png", alt: "Bar charts of every ablation cell and the random controls on both models, attack success above and benchmark mean below", caption: "Every cell on both models. The grey random-direction controls stay at baseline, so the jumps come from the direction we removed.", width: 1920, height: 1120 },
      ],
      sections: [
        {
          heading: "Finding Llama's layer",
          body: [
            "On Gemma, a sweep over layers 22 to 25 settled it. Llama was harder. Our analysis scores every layer and recommends the one where the safety and utility directions differ most, and for Llama it picked index 32. That index is the output after the last block, and a hook can't attach to it. The nearest real block, layer 31, did nothing: 7% against a 6% baseline.",
            "So we swept. Layers 13 to 28 stayed between 4% and 14%, and the effect only showed up early, at layers 9 to 12, peaking at 55% on layer 11 with the benchmark average at 64.7% against 65.0%. We think the analysis leaned toward late layers because the numbers in each point grow larger with depth. We kept the failed layer 16 and layer 31 runs in the repo, next to the one that worked.",
          ],
        },
        {
          heading: "The cell that broke the pattern",
          body: [
            "On Gemma, removing the utility subspace found by ActSVD left refusals alone (3%) but dropped the benchmark average from 61.3% to 53.2%. Its score on TruthfulQA, a test of whether answers are true, fell from 36% to 25.5%. Helpfulness didn't come out cleanly.",
            "One similarity score between Gemma's safety and utility subspaces, 0.065, says they barely overlap. Measuring the angle between each pair of their directions tells a different story: three of the four angles sit between 80.7 and 89.9 degrees, close to unrelated, but one sits at 61.9. That shared piece is our candidate explanation for the drop. On Llama the utility cell is a different experiment, which removes the weakest safety components instead, so it isn't comparable.",
          ],
        },
      ],
      result: {
        heading: "What the numbers say",
        metrics: [
          { label: "Gemma, safety removed", value: "1% → 84%", base: "harmful prompts answered, N=100" },
          { label: "Llama, layer 11", value: "6% → 55%", base: "benchmark average 65.0% → 64.7%" },
          { label: "Random controls", value: "At baseline", base: "1% on Gemma, 6% on Llama" },
        ],
        body: "These are point estimates from two models, one layer each and one seed, with no confidence intervals. Refusal is scored by matching a fixed list of phrases. We read 10 Gemma responses by hand: 8 were clear flips and 2 were reworded refusals, so a judge model would score tighter. Helpfulness ratings stand in for utility, and the charts are drawn from the committed result files, not a new run.",
      },
      lessons: [
        { title: "Check that the layer you picked can be hooked at all.", body: "Our recommended Llama layer was past the last block. We only saw the problem after the nearest block did nothing." },
        { title: "Add the control before you trust the jump.", body: "The random-direction cells were added late, and they are what lets us say the 55% is about the direction." },
        { title: "Keep the negative runs.", body: "The layer 16 and layer 31 results show where the effect isn't, and they sit next to the layer 11 result that shows where it is." },
        { title: "Read the angles, not just the cosine.", body: "The single similarity score between the two subspaces was 0.065. The one angle at 61.9 degrees is where the utility cell broke." },
      ],
    },
  },

  // Kit: evidence/qna-51
  {
    slug: "qna", kind: "project", area: "Course project", year: "2026",
    title: "QnA: a course board with a cited AI answerer", flags: ["highlighted"],
    summary: "We added an AI that answers students from the course's own material and cites its sources, then measured five ways to configure it.",
    cover: { kind: "image", src: "/projects/qna/04-student-ai-answer-with-sources.jpg", alt: "A student's question on the QnA board with an AI-generated answer and three numbered sources", focus: "center top" },
    metric: { value: "17×", base: "Time per question with a 70× larger search model, which found the right sources no more often (N=14)" },
    tags: ["FastAPI", "RAG", "React"],
    caseStudy: {
      title: "Teaching a RAG course bot when to stay quiet",
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

/** Every heading on a case study page that renders with an anchor id. */
function headingIds(cs: CaseStudy) {
  const sections = [cs.context, cs.problem, cs.explainer, cs.walkthrough, cs.approach, ...(cs.sections ?? [])];
  return new Set(sections.flatMap((s) => (s ? [sectionId(s.heading)] : [])));
}

// Fail the build if a "more" link points at a case study or section that doesn't exist.
for (const p of caseStudies) {
  const cs = p.caseStudy;
  for (const s of [cs.context, cs.problem, cs.explainer, ...(cs.sections ?? [])]) {
    if (!s?.more) continue;
    const m = /^\/work\/([^#]+)#(.+)$/.exec(s.more.href);
    const target = m && caseStudies.find((q) => q.slug === m[1]);
    if (!m || !target || !headingIds(target.caseStudy).has(m[2])) throw new Error(`${p.slug}: "${s.heading}" links to ${s.more.href}, which isn't a case-study section`);
  }
}

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
