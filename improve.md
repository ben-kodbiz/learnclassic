# LearnClassic — Improvement Backlog

**Purpose:** A practical, long-term backlog for improving LearnClassic over time.

**Guiding principle:** Preserve the app's lightweight, open, static-site architecture. Improve the quality of the Arabic learning experience before adding infrastructure or visual complexity.

---

## 1. Overall assessment

LearnClassic has a sensible foundation:

- Vanilla JavaScript with ES modules.
- Static HTML and CSS.
- JSON-based lesson content.
- Local browser storage for learner progress.
- Hash-based navigation.
- GitHub Pages hosting.

This is a good fit for a focused learning application. Keep it unless a demonstrated requirement makes a change necessary.

### Main improvement areas

1. Arabic content accuracy and review workflow.
2. Consistency between curriculum data and documentation.
3. Better active-recall exercises.
4. More useful morphology and grammar tools.
5. Guided reading and analysis of authentic Classical Arabic.
6. Arabic typography, RTL, mobile and accessibility QA.
7. Search, progress portability and discoverability.

**Don't begin by rewriting the application or introducing a backend.** First make the existing content and learning interactions dependable.

---

## 2. P0 — Fix correctness and consistency

These are the highest-priority items because errors in a language-learning app can teach learners the wrong thing.

### 2.1 Make curriculum data and documentation agree

The reviewed material contains a mismatch:

- `data/curriculum.json` describes Module 1 as weeks 1–8, Module 2 as weeks 9–17, and Module 3 as weeks 18–26.
- The README describes the ranges as 1–7, 8–16, and 17–26.

**Actions**

- [ ] Decide which curriculum definition is authoritative.
- [ ] Prefer `data/curriculum.json` as the source of truth if the application already reads it.
- [ ] Update README and other documentation to match.
- [ ] Check navigation, module labels, week counts and lesson links against the data.
- [ ] Add a validation script that detects gaps, duplicate week numbers, missing lesson files and broken references.

### 2.2 Correct the definite-article spelling in lesson content

In `data/lessons/m1-w01-ch01.json`, the reviewed examples represent the definite article as `أَلْ` and include `أَلشَّمْسُ`.

The definite article begins with hamzat al-waṣl. For ordinary Arabic spelling, use `الـ`; where a fully marked instructional form is useful, `ٱلْ` may be used. The example should be written `الشَّمْسُ`.

**Actions**

- [ ] Review the lesson explanation and all examples in this lesson.
- [ ] Correct the spelling consistently.
- [ ] Check other lessons for the same representation.
- [ ] Keep pronunciation/phonetic explanation separate from ordinary orthographic spelling.
- [ ] Have a qualified Arabic reviewer check the revised lesson before marking it verified.

### 2.3 Clarify the nominal-sentence rule

In `data/lessons/m1-w01-ch02.json`, the reviewed explanation presents a definite nominative subject and an indefinite nominative predicate as if the predicate must be indefinite.

That is a useful beginner pattern, but it should not be presented as an exceptionless rule.

**Actions**

- [ ] Reword the explanation as a common introductory pattern.
- [ ] Distinguish the core rule from common patterns and exceptions.
- [ ] Avoid wording such as "the khabar must be indefinite" unless the statement is carefully scoped to the specific construction being taught.
- [ ] Add an advanced note or a link to a later lesson for other valid predicate forms.
- [ ] Have the explanation reviewed by a qualified Arabic teacher.

### 2.4 Treat review status as a real quality-control process

The lesson data uses statuses such as `pending`, `reviewed` and `verified`. These should have explicit meanings.

Suggested meanings:

- `pending`: drafted; not yet checked by a qualified reviewer.
- `reviewed`: checked, with corrections or comments recorded; may still need a second review.
- `verified`: approved against the project's content standards by an appropriately qualified reviewer.

**Actions**

- [ ] Document the status definitions.
- [ ] Never mark Arabic content verified merely because JSON validation or automated tests pass.
- [ ] Record reviewer, review date and review notes where practical.
- [ ] Make the interface distinguish draft or pending content from verified content if learners can encounter both.
- [ ] Add a content-review checklist to the repository.

---

## 3. P1 — Establish an Arabic content-review standard

The most important long-term risk is not the JavaScript. It is inaccurate Arabic instruction.

### Review every lesson for

- [ ] Arabic spelling and orthography.
- [ ] Tashkīl and consistency of vowel marks.
- [ ] Grammar explanations and terminology.
- [ ] Verb forms and conjugation tables.
- [ ] Case endings and mood endings where taught.
- [ ] Examples that actually demonstrate the stated rule.
- [ ] English translations and their scope.
- [ ] Exercise answers and feedback.
- [ ] Qur'an, hadith or other source references, where present.
- [ ] Whether a beginner simplification is clearly labelled as a simplification.

### Suggested content-review workflow

1. Author drafts the lesson.
2. Automated checks validate JSON shape, required fields and internal links.
3. A qualified reviewer checks Arabic and the explanation.
4. Author addresses comments.
5. Reviewer approves the final version.
6. Status and review metadata are updated.
7. The lesson is published.

**Important:** Automated tests can detect structural problems. They cannot certify that an Arabic explanation is linguistically correct.

---

## 4. P1 — Improve exercises and active recall

The existing exercise engine supports:

- Multiple choice.
- True/false.
- Fill-in-the-blank with choices.
- Matching.
- Word ordering.

This is a useful starting set. The next step is to add exercises that require learners to retrieve Arabic knowledge rather than only recognize a displayed answer.

### Suggested additions

- [ ] **Typed Arabic answer:** Let learners enter an answer using an Arabic keyboard.
- [ ] **Vocabulary recall:** Show an Arabic word and ask for its meaning, then reverse the direction.
- [ ] **Tashkīl selection:** Ask learners to choose or enter the correct vowel marks.
- [ ] **Case-ending practice:** Ask learners to identify or supply the appropriate ending in a clearly defined sentence.
- [ ] **Conjugation production:** Ask learners to produce a form from a specified root, pattern, person and tense/aspect.
- [ ] **Sentence construction:** Ask learners to build a sentence from a meaning or a set of grammatical constraints.
- [ ] **Error correction:** Present a deliberately incorrect example and ask the learner to identify the issue.
- [ ] **Spaced review:** Reintroduce previously missed or older material at suitable intervals.

### Exercise design principles

- Give a short explanation after an answer, not only "correct" or "incorrect".
- Explain why plausible wrong answers are wrong.
- Do not make a question ambiguous when multiple Arabic forms could be valid.
- Accept legitimate variants where appropriate.
- Separate spelling tolerance from grammatical correctness.
- Keep the learner's progress local and usable offline.
- Do not turn every lesson into a long exam; use short retrieval practice throughout the learning path.

---

## 5. P1 — Improve morphology and grammar tools

A root/pattern explorer can become one of the most useful parts of LearnClassic, provided it teaches patterns accurately and avoids implying that roots work like deterministic translation codes.

### Root and pattern explorer

For each entry, consider showing:

- [ ] Root letters.
- [ ] Derived form or pattern.
- [ ] The word's actual meaning in context.
- [ ] Relevant prefixes, infixes and suffixes.
- [ ] A short explanation of the pattern.
- [ ] Several sourced examples.
- [ ] Links to lessons where the pattern is taught.
- [ ] Related vocabulary.

**Caution:** A pattern can suggest a semantic tendency, but it does not guarantee one fixed meaning for every word. Explain tendencies rather than promising mechanical translations.

### Grammar reference

- [ ] Build a searchable glossary of Arabic grammar terms.
- [ ] Give concise definitions with one or two clear examples.
- [ ] Link each term to the lessons that teach it.
- [ ] Distinguish beginner explanations from advanced details.
- [ ] Use consistent Arabic and English terminology throughout the app.

### Conjugation reference

- [ ] Provide tables for the forms actually covered by the curriculum.
- [ ] Identify the root, pattern, person, number, gender and tense/aspect as relevant.
- [ ] Explain what each table represents.
- [ ] Include example sentences.
- [ ] Validate every table with a qualified reviewer before publishing.

---

## 6. P2 — Add a guided Classical Arabic reading lab

This could become a distinctive feature, but it should be introduced only after the underlying lessons and review workflow are dependable.

### Suggested learner flow

1. Present a short, properly sourced Classical Arabic passage.
2. Let the learner select a word.
3. Show the word's root and pattern when these are known and relevant.
4. Explain its grammatical role in that passage.
5. Let the learner attempt an iʿrāb analysis.
6. Reveal a reviewed explanation.
7. Show a translation and explain important choices.
8. Link the words and grammar back to LearnClassic lessons.

### Content safeguards

- [ ] Identify the source of every passage.
- [ ] Check the usage rights and copyright status of the Arabic text, translation and explanatory material.
- [ ] Keep the Arabic text, grammatical analysis, translation and tafsīr distinct.
- [ ] Do not imply that grammatical analysis alone establishes the full interpretation of a Qur'anic passage.
- [ ] Have explanations reviewed by appropriately qualified people.
- [ ] Start with short passages and a small number of carefully checked examples.

---

## 7. P2 — Arabic typography, RTL and accessibility

Arabic presentation needs dedicated testing. A page that looks correct in English may still have serious issues with Arabic text.

### Arabic display checks

- [ ] Check that tashkīl is not clipped above or below the line.
- [ ] Use sufficient line height for fully marked Arabic.
- [ ] Check Arabic text at different font sizes.
- [ ] Test long Arabic passages and narrow mobile screens.
- [ ] Verify punctuation and mixed Arabic/English text.
- [ ] Test bidirectional text in headings, buttons, examples and feedback.
- [ ] Ensure numbers, parentheses and punctuation appear in the intended order.
- [ ] Choose fonts with good Arabic glyph coverage and readable diacritics.

### Accessibility checks

- [ ] Ensure all controls work with a keyboard.
- [ ] Provide visible focus indicators.
- [ ] Use semantic HTML and meaningful labels.
- [ ] Check contrast and text resizing.
- [ ] Ensure screen readers can identify Arabic text and language changes.
- [ ] Avoid conveying correctness or errors through colour alone.
- [ ] Test on an actual mobile device, not only desktop browser emulation.

---

## 8. P2 — Search, progress portability and discoverability

### Search

- [ ] Add search across lesson titles and lesson text.
- [ ] Support both Arabic and English search terms.
- [ ] Consider normalizing Arabic search input so common differences in diacritics do not prevent a useful match.
- [ ] Make search results link directly to the relevant lesson or section.
- [ ] Keep search fast and compatible with static hosting.

### Learner progress

- [ ] Explain that progress is stored in the browser.
- [ ] Add progress export to a downloadable JSON file.
- [ ] Add progress import with validation and a clear confirmation step.
- [ ] Handle malformed or older export files safely.
- [ ] Explain that clearing browser data or switching devices may otherwise lose local progress.

### Discoverability

- [ ] Review page titles and descriptions.
- [ ] Add useful metadata for the main page and important learning sections.
- [ ] Consider static, directly addressable lesson pages if search-engine discovery of individual lessons becomes important.
- [ ] Keep navigation and URLs understandable.
- [ ] Add a clear project description and contribution/review guidance to the README.

---

## 9. P3 — Optional features; do not prioritize yet

These may be useful later, but they should not distract from content accuracy and learning quality.

### Audio and pronunciation

- [ ] Consider audio for selected vocabulary and example sentences.
- [ ] Prefer open-source tools and assets with clear usage rights.
- [ ] Make audio optional and provide text alongside it.
- [ ] Have pronunciation checked by a competent Arabic speaker.
- [ ] Do not treat text-to-speech output as automatically correct.

### Progressive Web App

- [ ] Consider a service worker for reliable offline access.
- [ ] Cache the app shell and lesson data.
- [ ] Provide a clear update strategy so learners do not remain on stale lesson content.
- [ ] Test offline behaviour on mobile and desktop.

### Analytics

- [ ] Add analytics only if there is a concrete question that needs answering.
- [ ] Prefer privacy-respecting, minimal or self-hosted options if analytics become necessary.
- [ ] Do not collect personal learner data without a clear reason and transparent explanation.

---

## 10. Recommended implementation order

Work in small, verifiable increments. Avoid starting several large features at once.

| Order | Work | Why it comes here |
|---|---|---|
| 1 | Fix curriculum/documentation mismatch | Removes ambiguity about the learning structure. |
| 2 | Correct the definite-article lesson | Fixes a concrete content issue. |
| 3 | Clarify the nominal-sentence explanation | Prevents a beginner pattern being taught as an absolute rule. |
| 4 | Define review statuses and checklist | Establishes a quality gate for all future content. |
| 5 | Audit existing lessons | Finds content issues before expanding the curriculum. |
| 6 | Add automated content-structure validation | Catches broken data and links early. |
| 7 | Improve active-recall exercises | Makes the existing lessons more effective to practise. |
| 8 | Build the grammar glossary and root/pattern explorer | Adds reusable reference tools. |
| 9 | Add conjugation and iʿrāb exercises | Extends practice once content is reviewed. |
| 10 | Prototype the guided reading lab | Adds deeper application of the material. |
| 11 | Complete Arabic RTL, mobile and accessibility QA | Ensures the learning experience works across devices. |
| 12 | Add search and progress import/export | Improves day-to-day usability. |
| 13 | Consider audio, PWA and analytics | Adds optional capabilities only when justified. |

---

## 11. Suggested definition of done

### A lesson is ready to publish when

- [ ] Its JSON validates against the lesson schema.
- [ ] All required fields are present.
- [ ] All internal links and references resolve.
- [ ] Arabic spelling and tashkīl have been checked.
- [ ] Grammar explanations and examples have been reviewed.
- [ ] Translations and exercise answers have been checked.
- [ ] Feedback explains the relevant learning point.
- [ ] The review status accurately reflects the work completed.
- [ ] The lesson renders correctly on desktop and mobile.
- [ ] Arabic text is readable, including diacritics and mixed-direction content.

### A feature is ready to merge when

- [ ] It solves a defined learner problem.
- [ ] It fits the existing architecture unless a change is justified.
- [ ] It works on the supported browsers and screen sizes.
- [ ] It handles missing or invalid data safely.
- [ ] It does not break existing lessons or learner progress.
- [ ] Tests or a reproducible manual test plan are included.
- [ ] Documentation is updated where needed.
- [ ] Any Arabic content introduced by the feature has been reviewed.

---

## 12. Instructions for coding agents

Use these guidelines when asking a coding agent to work on LearnClassic.

1. Inspect the current repository and relevant files before making changes.
2. Read the existing architecture and follow its conventions.
3. Prefer vanilla JavaScript, HTML and CSS; do not introduce a framework without a demonstrated need.
4. Keep the site compatible with static hosting on GitHub Pages.
5. Do not introduce a backend, paid API or build system merely for convenience.
6. Make one focused change at a time.
7. Do not rewrite unrelated files or perform broad refactors as part of a small task.
8. Do not invent Arabic grammar rules, translations, citations or source references.
9. Flag uncertain Arabic content for qualified review instead of silently deciding.
10. Preserve existing learner progress and stored-data compatibility.
11. Run relevant validation and tests.
12. Report:
    - Files changed.
    - What changed and why.
    - Tests or checks run and their results.
    - Any content that still needs human review.
    - Known limitations or uncertainties.

---

## 13. Final recommendation

Keep LearnClassic small, fast, static and maintainable.

The biggest opportunity is not adding more technology. It is making the Arabic instruction trustworthy, then giving learners better ways to recall, apply and recognize what they have learned.

**Recommended immediate focus:** curriculum consistency, the two identified lesson corrections, and a proper linguistic review workflow. Once those foundations are in place, improve exercises and build the reference tools. Treat the reading lab, audio and PWA as later milestones.