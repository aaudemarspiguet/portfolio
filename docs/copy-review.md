# Portfolio copy review

Reviewed on November 3, 2026, on `content/experience-copy`, branched from `UI-AI-Unslop-Codex`.

## Sources and voice

The supplied base resume PDF, `base.tex`, and `TRUTH.md` supplied the facts. Where the resume and ledger differed in emphasis, the ledger controlled attribution. No personal hobbies, hometown, project URLs, production source snippets, or unverified outcome metrics were added.

Copy references were [Jeff Antony](https://www.amjeff.com/about), [Spencer Gabor](https://spencergabor.work/), and [Marco Cornacchia](https://www.marco.fyi/). The direction is a short first-person introduction, concrete project descriptions, and direct contact labels. Jeff's current homepage returned an empty client-rendered shell to the crawler; his readable About page informed the personal introduction instead.

The chosen voice is conversational-professional: a student engineer explaining the work to engineering hiring teams. It uses plain technical language and contractions without promotional claims or forced casualness.

## Independent grading

A separate subagent read the local `unslop-text` skill, its tells catalog and writing guide, the complete exported website copy, shared UI labels, and the source ledger. It graded the copy without editing it.

| Round | Verdict | Grade | Scanner |
| --- | --- | --- | --- |
| Initial draft | REVISE | 7/10 | 2,251 words; 9 date-separator findings; score 27 |
| Revised draft | PASS | 8.5/10 | 1,827 words; 0 findings; score 0; density 0.0/1,000 words |

The first review found repeated explanations in SAW and Curio, redundant recaps, an unsupported personal-project team label, and a capstone title that said “outfit” where the game hides one item. It also identified that the scanner treats conventional date-range en dashes as em-dash findings.

The revision shortened SAW and Curio, made case-study sections optional, removed repeated steps and result recaps, corrected the item title and team label, and used “to” in date ranges.

The final grader reported: “No material copy or truth-ledger blockers remain.” Its structural review confirmed paired backend attribution for the capstone, the documented scope of the Spirit internship, and course-project scope for the research results. The scanner result is a lexical check; the PASS includes a separate structural and factual review.

## Validation

- ESLint and the production build passed, including TypeScript checking and generation of all six project pages.
- The local resume PDF matches the supplied source PDF byte for byte (SHA-256).
- HTTP checks passed for the homepage, six case studies, and the PDF download. An unknown project slug rendered the not-found UI with `noindex`: the initial streamed response returned HTTP 200, and the repeat request returned 404.
- Empty photo and chart placeholders, unsupported demo links, and illustrative source-code placeholders were removed.
- Browser automation could read the existing Chrome window but could not reliably capture the portfolio preview. Visual QA is not claimed.
