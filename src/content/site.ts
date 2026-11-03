// Every piece of copy on the home page. Bracketed values are placeholders
// until the content phase; the pronunciation is the only real content so far.

export const site = {
  name: "[Your Name]",
  role: "Software engineer",
  city: "[City]",
  availability: "Open to new-grad roles from [month]",
  // IANA zone for the footer clock, e.g. "America/Chicago". Undefined uses the visitor's zone.
  timeZone: undefined as string | undefined,
  say: { pronunciation: "uh-MOH-g", meaning: "unerring" },

  lede: {
    highlight: "[I build AI-powered products]",
    rest: " and [the data systems under them]. [One clause of proof.]",
  },
  now: "[building X]",
  email: "[you@domain.com]",
  links: {
    resume: "#",
    github: "#",
    linkedin: "#",
    source: "#",
  },

  work: {
    heading: "[A heading that ties AI products to the systems under them]",
  },

  experience: {
    heading: "[Where you've shipped so far]",
    roles: [
      { when: "[Mon YYYY] → [Mon YYYY]", title: "[Role] · [Organization]", line: "[One line: what you built, and the number that changed.]", where: "[City or Remote]" },
      { when: "[Mon YYYY] → [Mon YYYY]", title: "[Role] · [Organization]", line: "[One line: what you built, and the number that changed.]", where: "[City or Remote]" },
      { when: "[Mon YYYY] → [Mon YYYY]", title: "[Role] · [Organization]", line: "[One line: what you built, and the number that changed.]", where: "[City or Remote]" },
    ],
    education: { when: "Graduating [Mon YYYY]", title: "[Degree] · [University]", line: "[Two or three courses that back up the positioning.]", where: "Education" },
  },

  about: {
    heading: "[One line about how you work]",
    hometown: "[Hometown]",
    paragraphs: [
      "[Paragraph 1: where you come from, and what pulled you into engineering.]",
      "[Paragraph 2: the kinds of problems you like, how you approach them, and what teammates rely on you for. Two or three sentences.]",
      "[Paragraph 3: what you're working on or learning right now.]",
      "[One human detail: what you do away from the keyboard.]",
    ],
  },

  stack: {
    heading: "[What you reach for]",
    groups: [
      { label: "AI and LLMs", items: ["[Framework]", "[Retrieval or vector store]", "[Model APIs]", "[Agent tooling]"] },
      { label: "Data", items: ["[Query language and database]", "[Processing engine]", "[Data platform]", "[Cache]"] },
      { label: "Software", items: ["[Languages]", "[Web framework]", "[Cloud]", "[Containers and CI]"] },
    ],
  },

  contact: {
    heading: "[One line on what you're open to: new-grad software roles, especially on AI and data teams, from [month].]",
    caseStudyHeading: "[Want the longer version of this story?]",
    year: "[Year]",
    builtWith: "[stack]",
  },
};
